//
// There is nothing to do here
// Just use:
//   echo "transpile test/test.unit.ts" | nc -U var/socket.sock
//
// broker will broadcast:
//   "1786060343769_00001 transpile test/test.unit.ts"
//
// Here is though implementation of function to do the same from js
//

import net from "node:net";
import fs from "node:fs";

/**
 * Checks whether the specified path exists and is a valid Unix domain socket file.
 *
 * @param SOCKET Absolute or relative path to the Unix socket file
 * @returns true if path exists and is a socket file, false otherwise
 */
export function checkIfSocket(SOCKET: string): boolean {
  if (typeof SOCKET !== "string" || !SOCKET.trim() || !fs.existsSync(SOCKET)) {
    return false;
  }

  try {
    const stat = fs.statSync(SOCKET);
    return stat.isSocket();
  } catch (err) {
    return false;
  }
}

export interface Publisher {
  send: (message: string) => boolean;
  client: net.Socket;
  destroy: () => void;
}

/**
 * Creates a persistent connection to the Unix domain socket for publishing multiple messages efficiently.
 * Returns an object containing a `send(message)` method and the underlying `client` instance.
 * 
 * Usage example:
 *   const pub = createPublisher("var/socket.sock");
 *   pub.send("open file.ts");
 *   pub.send("transpile file.ts");
 *   pub.destroy();
 * 
 * @param SOCKET Path to the Unix socket file
 */
export function createPublisher(SOCKET: string): Publisher {
  if (typeof SOCKET !== "string" || !SOCKET.trim()) {
    throw new Error("createPublisher error: SOCKET path is required");
  }

  const client = net.createConnection(SOCKET);

  client.on("error", (err) => {
    console.error(`createPublisher error: Socket error on >${SOCKET}<: ${err.message}`);
  });

  return {
    send(message: string): boolean {
      const trimmed = message.trim();
      if (!trimmed) {
        return false;
      }
      if (client.destroyed || !client.writable) {
        console.error(`createPublisher error: Cannot send message, socket >${SOCKET}< is not writable`);
        return false;
      }
      return client.write(`${trimmed}\n`);
    },
    client,
    destroy() {
      if (!client.destroyed) {
        client.destroy();
      }
    },
  };
}

/**
 * Convenience one-shot function to connect, publish a single message, and close connection.
 * 
 * @param SOCKET Path to the Unix socket file
 * @param message Message payload to publish to the broker
 */
export default function socketPublish(SOCKET: string, message: string): void {
  if (typeof SOCKET !== "string" || !SOCKET.trim()) {
    throw new Error("socketPublish error: SOCKET path is required");
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  const client = net.createConnection(SOCKET, () => {
    client.write(`${trimmed}\n`, () => {
      client.end();
    });
  });

  client.on("error", (err) => {
    console.error(`socketPublish error: Failed to send message to >${SOCKET}<: ${err.message}`);
  });
}

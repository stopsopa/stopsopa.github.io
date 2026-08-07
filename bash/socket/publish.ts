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

// Centralized error factory — prepends the module preamble to every thrown error.
function th(msg: string) {
  return new Error("publish.ts error: " + msg);
}

/**
 * Checks whether the specified path exists and is a valid Unix domain socket file.
 * When shouldThrow is true, throws via th() with a specific message instead of returning false.
 *
 * @param SOCKET Absolute or relative path to the Unix socket file
 * @param shouldThrow If true, throws on invalid socket instead of returning false
 * @returns true if path exists and is a socket file, false otherwise
 */
export function checkIfSocket(SOCKET: string, shouldThrow: boolean = false): boolean {
  if (typeof SOCKET !== "string" || !SOCKET.trim()) {
    if (shouldThrow) throw th("checkIfSocket: SOCKET path is required");
    return false;
  }

  if (!fs.existsSync(SOCKET)) {
    if (shouldThrow) throw th(`checkIfSocket: path does not exist >${SOCKET}<`);
    return false;
  }

  try {
    const stat = fs.statSync(SOCKET);
    const isSocket = stat.isSocket();
    if (!isSocket && shouldThrow) throw th(`checkIfSocket: path exists but is not a socket >${SOCKET}<`);
    return isSocket;
  } catch (err: any) {
    if (shouldThrow) throw th(`checkIfSocket: failed to stat >${SOCKET}<: ${err?.message ?? err}`);
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
  checkIfSocket(SOCKET, true);

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
  checkIfSocket(SOCKET, true);

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
    console.error(`publish.ts error: Failed to send message to >${SOCKET}<: ${err.message}`);
  });
}

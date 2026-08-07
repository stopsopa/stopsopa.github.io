//
// There is nothing to do here
// Just use:
//   echo "transpile test/test.unit.ts" | nc -U var/socket.sock
//
// broker will broadcast:
//   "1786060343769_00001 transpile test/test.unit.ts"
//
// Here is though implementation of function to do the same from ts
//

import net from "node:net";
import { checkIfSocket } from "./libs/checkIfSocket.ts";
import { createConnection, ManagedConnection } from "./libs/createConnection.ts";

export { checkIfSocket } from "./libs/checkIfSocket.ts";

export interface Publisher {
  send: (message: string) => boolean;
  /**
   * Returns the current underlying net.Socket instance.
   *
   * Why getFreshClient() and not a plain `client` property:
   * The connection automatically reconnects with exponential backoff whenever the socket
   * closes or errors. Each reconnect creates a brand-new net.Socket object and replaces
   * the previous one. Exposing a plain `client` property would freeze the reference at
   * the moment of creation and the caller would hold a stale, destroyed socket.
   * getFreshClient() always resolves to the latest live socket, keeping the caller safe
   * even across multiple reconnect cycles. May return null if currently between reconnects.
   */
  getFreshClient: () => net.Socket | null;
  destroy: () => void;
}

/**
 * Creates a persistent connection to the Unix domain socket for publishing multiple messages efficiently.
 * Uses exponential backoff reconnect — connection is maintained automatically if the socket closes.
 * Returns an object with send(), getFreshClient(), and destroy() methods.
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
  const conn: ManagedConnection = createConnection({ socket: SOCKET });

  return {
    send: conn.send.bind(conn),
    getFreshClient: conn.getFreshClient.bind(conn),
    destroy() {
      conn.stop();
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

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
import { encode } from "./libs/lineEncoding.ts";

/**
 * Convenience one-shot function to connect, publish a single message, and close connection.
 *
 * @param SOCKET Path to the Unix socket file
 * @param message Message payload to publish to the broker
 */
export default function socketPublish(SOCKET: string, message: string): void {
  checkIfSocket(SOCKET);

  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  const encoded = encode(trimmed);

  const client = net.createConnection(SOCKET, () => {
    client.write(`${encoded}\n`, () => {
      client.end();
    });
  });

  client.on("error", (err) => {
    console.error(`publishOne.ts error: Failed to send message to >${SOCKET}<: ${err.message}`);
  });
}

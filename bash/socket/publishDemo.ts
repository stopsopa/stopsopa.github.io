/**
 * SOCKET=var/socket.sock node bash/socket/publishDemo.ts
 *
 * Interactive terminal connection demo using createConnection from libs/createConnection.ts.
 * Listens on stdin and forwards typed lines to the Unix socket broker.
 */

import readline from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createConnection } from "./libs/createConnection.ts";
import { checkIfSocket } from "./libs/checkIfSocket.ts";

const __filename = fileURLToPath(import.meta.url);
const __filename_relative = path.relative(process.cwd(), __filename);

const th = (msg: string) => new Error(`${__filename_relative} error: ${msg}`);
const log = (msg: string) => console.log(`${__filename_relative}: ${msg}`);

const SOCKET = process.env.SOCKET as string;

checkIfSocket(SOCKET);

if (!process.stdin.isTTY) {
  log(`\x1b[31minteractive mode disabled\x1b[0m`);
  throw th("terminal is not interactive");
}

const connection = createConnection({ socket: SOCKET as string });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

log(`\x1b[32minteractive mode enabled\x1b[0m`);

rl.on("line", (line) => {
  connection.send(line);
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string) {
  log(`shutting down (${signal})`);
  connection.destroy();
  rl.close();
  process.exit(0);
}

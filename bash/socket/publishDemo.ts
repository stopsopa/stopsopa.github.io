/**
 * SOCKET=var/socket.sock node bash/socket/publishDemo.ts
 *
 * Interactive terminal publisher demo using createPublisher from publish.ts.
 * Listens on stdin and forwards typed lines to the Unix socket broker.
 */

import readline from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createPublisher, checkIfSocket } from "./publish.ts";

const __filename = fileURLToPath(import.meta.url);
const __filename_relative = path.relative(process.cwd(), __filename);

const th = (msg: string) => new Error(`${__filename_relative} error: ${msg}`);
const log = (msg: string) => console.log(`${__filename_relative}: ${msg}`);

const SOCKET = process.env.SOCKET;

if (!checkIfSocket(SOCKET as string)) {
  throw th(`process.env.SOCKET >${SOCKET}< does not exist or is not a socket file`);
}

if (!process.stdin.isTTY) {
  log(`\x1b[31minteractive mode disabled\x1b[0m`);
  throw th("terminal is not interactive");
}

const publisher = createPublisher(SOCKET as string);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

log(`\x1b[32minteractive mode enabled\x1b[0m`);

rl.on("line", (line) => {
  publisher.send(line);
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string) {
  log(`shutting down (${signal})`);
  publisher.destroy();
  rl.close();
  process.exit(0);
}

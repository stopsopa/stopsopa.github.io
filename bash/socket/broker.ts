/**
 *
 * SOCKET=var/socket.sock node bash/socket/broker.ts
 * NODE_OPTIONS= SOCKET=var/socket.sock node bash/socket/broker.ts
 * NODE_OPTIONS= SOCKET=var/socket.sock node bash/socket/broker.ts --no-interactive
 * NODE_OPTIONS= SOCKET=var/socket.sock node bash/socket/broker.ts --retention 44
 *
 * NODE_OPTIONS= SOCKET=var/socket.sock node bash/socket/broker.ts --extra flags
 *      --extra flags is not doing anything but can be used to find in ps aux
 *
 * Options:
 *  --retention N : Sets maximum number of messages stored in history buffer (default: 100, min: 0).
 *                  Passing 0 disables history retention (no replay for new subscribers).
 *
 * Lifecycle of the script:
 * - socket (as a filesystem location) shouldn't exist, it will be created on start
 * - when process stopped it will remove socket (as a filesystem location)
 * - killing it with -9 is possible, but socket will stay and it must be removed manually
 *   this serves as an exclusion mechanism to prevent two processes attempting to bind to the same socket file at once
 *
 * if --no-interactive not given it will try to detect if terminal is interactive and
 * it will try to allow you to type messages from terminal
 *
 * diagnostics:
 * check if socket is alive
 * lsof var/socket.sock
 * nc -U var/socket.sock
 */

import net from "node:net";
import fs from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { encode } from "./libs/lineEncoding.ts";

const RETENTION = getRetentionArg();

const __filename = fileURLToPath(import.meta.url);

const __filename_relative = path.relative(process.cwd(), __filename);

const th = (msg: string) => new Error(`${__filename_relative} error: ${msg}`);

const log = (msg: string) => console.log(`${__filename_relative}: ${msg}`);

const nextId = createIdGenerator();

const SOCKET = process.env.SOCKET as string;

const socket_dir = path.dirname(SOCKET);

if (!fs.existsSync(socket_dir)) {
  fs.mkdirSync(socket_dir, { recursive: true });
}

if (!fs.statSync(socket_dir).isDirectory()) {
  throw th(`socket directory is not a directory: ${socket_dir}`);
}

const history: string[] = [];

const clients = new Set<net.Socket>();

const idRegex = /^\d{13}_\d{5}$/;

// let's not do that, this way if anyone will try to run second server
// on that path it will fail
// if (fs.existsSync(SOCKET)) {
//   fs.unlinkSync(SOCKET);
// }

/**
 * Parses --retention argument from process.argv.
 * Minimum value allowed is 0 (disables history buffering).
 * If invalid (negative, NaN, missing value), defaults to 100.
 */
function getRetentionArg(): number {
  const index = process.argv.indexOf("--retention");
  if (index !== -1 && index + 1 < process.argv.length) {
    const val = Number(process.argv[index + 1]);
    if (!Number.isNaN(val) && Number.isInteger(val) && val >= 0) {
      return val;
    }
  }
  return 100;
}

function createIdGenerator() {
  let lastValue = 0;
  let counter = 0;

  return function nextId() {
    const value = new Date().getTime();
    if (value === lastValue) {
      counter += 1;
    } else {
      lastValue = value;
      counter = 1;
    }

    return `${value}_${String(counter).padStart(5, "0")}`;
  };
}

/**
 * Publishes a line to connected clients and saves it to history.
 * If the first token (up to first space) matches the nextId() format (13 digits + _ + 5 digits),
 * it is forwarded as is without generating a new ID prefix.
 */
function publish(line: string) {
  line = line.trim();

  if (!line) {
    return;
  }

  const firstSpaceIndex = line.indexOf(" ");
  const firstPart = firstSpaceIndex === -1 ? line : line.slice(0, firstSpaceIndex);

  const lineWithId = idRegex.test(firstPart) ? line : `${nextId()} ${line}`;

  history.push(lineWithId);

  if (history.length > RETENTION) {
    history.shift();
  }

  for (const client of clients) {
    client.write(lineWithId + "\n");
  }
}

function presentSocket(socket: net.Socket, label: string) {
  console.log(
    `${label} ${String(clients.size).padStart(4, " ")} dst:${socket.destroyed} con:${socket.connecting} rd:${
      socket.bytesRead
    } wr:${socket.bytesWritten} r:${socket.readable} w:${socket.writable}`
  );
}

const server = net.createServer((socket) => {
  clients.add(socket);

  presentSocket(socket, "in ");

  // replay history
  for (const event of history) {
    socket.write(event + "\n");
  }

  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();

    while (true) {
      const index = buffer.indexOf("\n");
      if (index === -1) {
        break;
      }

      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);

      publish(line);
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    presentSocket(socket, "out");
  });

  socket.on("error", () => {
    clients.delete(socket);
  });
});

// this is where we create a socket
// this point requires nothing to be under the path ${SOCKET} but directory have to exist
server.listen(SOCKET, () => {
  log(`socket created: ${SOCKET} (pid: ${process.pid})`);

  const noInteractive = process.argv.includes("--no-interactive");

  if (!noInteractive && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    log(`\x1b[32minteractive mode enabled\x1b[0m`);

    rl.on("line", (line) => {
      publish(encode(line));
    });
  } else {
    log(`\x1b[31minteractive mode disabled\x1b[0m`);
  }
});

// when SIGINT - Ctrl+C | SIGTERM - kill [pid]
// if kill -9 [pid] then socket will stay and will cause problems on next start
//   try killing process, socket will stay and then try to run, you will endup with exception
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string) {
  log(`shutting down (${signal})`);

  for (const client of clients) {
    client.destroy();
  }

  // removes the socket (thie filesystem entry - file is gone)
  // and it will exit here, no need for process.exit()

  server.close(() => {
    // interestingly enough SIGTERM requires process.exit(1) otherwise process won't exit
    // it's not the case for SIGINT - Ctrl+C
    process.exit(1);
  });
}

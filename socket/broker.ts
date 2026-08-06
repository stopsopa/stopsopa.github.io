/**
 *
 * SOCKET=var/socket.sock node socket/broker.ts
 * NODE_OPTIONS= SOCKET=var/socket.sock node socket/broker.ts
 *
 * check if socket is alive
 * lsof var/socket.sock
 * nc -U var/socket.sock
 */

import net from "node:net";
import fs from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RETENTION = 100;

const __filename = fileURLToPath(import.meta.url);

const __filename_relative = path.relative(process.cwd(), __filename);

const th = (msg: string) => new Error(`${__filename_relative} error: ${msg}`);

if (typeof process.env.SOCKET !== "string" || !process.env.SOCKET.trim()) {
  throw th("process.env.SOCKET is not defined");
}

const SOCKET = process.env.SOCKET as string;

const socket_dir = path.dirname(SOCKET);

if (!fs.existsSync(socket_dir)) {
  fs.mkdirSync(socket_dir, { recursive: true });
}

if (!fs.statSync(socket_dir).isDirectory()) {
  throw th(`Socket directory is not a directory: ${socket_dir}`);
}

// let's not do that, this way if anyone will try to run second server
// on that path it will fail
// if (fs.existsSync(SOCKET)) {
//   fs.unlinkSync(SOCKET);
// }

if (fs.existsSync(SOCKET)) {
  const stat = fs.statSync(SOCKET);

  if (stat.isSocket()) {
    throw th(`other server is probably running now, if not then remove >${SOCKET}< and try again`);
  }

  throw th(`Socket path exists but is not a socket: ${SOCKET}`);
}

const history: string[] = [];

const clients = new Set<net.Socket>();

function publish(line: string) {
  line = line.trim();

  if (!line) {
    return;
  }

  history.push(line);

  if (history.length > RETENTION) {
    history.shift();
  }

  for (const client of clients) {
    client.write(line + "\n");
  }
}

function presentSocket(socket: net.Socket, label: string) {
  console.log(
    `${label} dst:${socket.destroyed} con:${socket.connecting} rd:${socket.bytesRead} wr:${socket.bytesWritten} r:${socket.readable} w:${socket.writable}`
  );
}

const server = net.createServer((socket) => {
  presentSocket(socket, "in ");

  clients.add(socket);

  // replay history
  for (const event of history) {
    socket.write(event + "\n");
  }

  socket.on("data", (data) => {
    const lines = data.toString().split("\n");

    for (const line of lines) {
      publish(line);
    }
  });

  socket.on("close", () => {
    presentSocket(socket, "out");
    clients.delete(socket);
  });

  socket.on("error", () => {
    clients.delete(socket);
  });
});

// this is where we create a socket
// this point requires nothing to be under the path ${SOCKET} but directory have to exist
server.listen(SOCKET, () => {
  console.log(`socket created: ${SOCKET} (pid: ${process.pid})`);

  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("interactive mode enabled");

    rl.on("line", (line) => {
      publish(line);
    });
  }
});

// when SIGINT - Ctrl+C | SIGTERM - kill [pid]
// if kill -9 [pid] then socket will stay and will cause problems on next start
//   try killing process, socket will stay and then try to run, you will endup with exception
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string) {
  console.log(`shutting down (${signal})`);

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

import path from "path";

import fs from "fs";

import express from "express";

import * as dotenv from "dotenv";

import { get, has, getDefault, getThrow, getIntegerThrowInvalid, getIntegerDefault, getIntegerThrow } from "nlab/env";

// Replace SPDY with native HTTPS
import https from "https";

import serveIndex from "serve-index";

import { fileURLToPath } from "url";

const env = path.resolve(".", ".env");

if (!fs.existsSync(env)) {
  throw th(`File ${env} doesn't exist`);
}

dotenv.config({
  path: env,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = console.log;

const th = (msg) => new Error(`server.js error: ${msg}`);

const protocols = getThrow("NODE_SERVER_PROTOCOLS")
  .split(" ")
  .map((k) => k.trim())
  .filter(Boolean);

const protocolsPorts = {
  http: getIntegerThrow("NODE_API_PORT"),
  https: getIntegerThrow("NODE_API_PORT_HTTPS"),
};

{
  if (protocols.length === 0) {
    throw th(`NODE_SERVER_PROTOCOLS is not defined`);
  }

  protocols.forEach((protocol) => {
    if (!/^https?$/.test(protocol)) {
      throw th(`NODE_SERVER_PROTOCOLS >${get("NODE_SERVER_PROTOCOLS")}<: protocol ${protocol} is not supported`);
    }
  });
}

const host = "0.0.0.0";

const web = path.resolve(__dirname);

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.all("/ping", (req, res) => {
  res.end("ok");
});

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);

  next();
});

app.use(
  express.static(web, {
    // http://expressjs.com/en/resources/middleware/serve-static.html
    // maxAge: 60 * 60 * 24 * 1000 // in milliseconds
    // maxAge: "356 days", // in milliseconds max-age=30758400
    cacheControl: false,
    etag: false,
    immutable: true,
    lastModified: false,
    maxAge: false,
  }),
  serveIndex(web, { icons: true })
);

function createServer(protocol = "http") {
  if (!/^https?$/.test(protocol)) {
    throw th(`protocol ${protocol} is not supported`);
  }
  const port = protocolsPorts[protocol];

  let server;
  if (protocol === "https") {
    const options = {
      key: fs.readFileSync(path.resolve(__dirname, "cert", `server.key`)),
      cert: fs.readFileSync(path.resolve(__dirname, "cert", `server.crt`)),
    };

    server = https.createServer(options, app);

    // Error handling for HTTPS server errors
    server.on("error", (err) => {
      console.error("HTTPS Server error:", err);
    });

    // Handle socket errors
    server.on("clientError", (err, socket) => {
      console.error("Client error:", err);
      if (socket.writable) {
        socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      }
    });
  } else {
    server = app;
  }

  server.listen(port, () => {
    const dumpFile = path.resolve(__dirname, "var", `server_js_${protocol}.log`);
    const dumpFileRelative = path.relative(process.cwd(), dumpFile);

    const msg = `
   🌎  Server is running ${protocol.toUpperCase()}
          ${protocol}://${host}:${port}
          ${protocol}://${process.env.LOCAL_HOSTS}:${port}/index.html
          dump file ${dumpFileRelative}
  `;

    fs.writeFileSync(dumpFile, msg);

    setTimeout(() => {
      log(msg);
    }, 4000);
  });
}

protocols.forEach((protocol) => {
  createServer(protocol);
});

if (protocols.length > 0) {
  const red = `\x1b[41m`;
  const reset = `\x1b[0m`;

  log(`
${red}NOTICE: make sure to add ${process.env.LOCAL_HOSTS} to /etc/hosts                 ${reset}
${red}                                                                                  ${reset} 
${red} 127.0.0.1       localhost stopsopa.github.io.local kubernetes.docker.internal    ${reset}
${red}                                                                                  ${reset} 
${red} and be aware of this issue on mac with /etc/hosts https://superuser.com/a/1297335${reset}    
`);
}

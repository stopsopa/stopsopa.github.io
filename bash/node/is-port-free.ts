#!/usr/bin/env node

import http from "node:http";

const filename = import.meta.url;

if (process.argv[2] === "--help" || process.argv.length < 3) {
  console.log(`

Script checking if port is free and can be allocated, usage:

  Mode 1:

    node script.mjs localhost:80
    node script.mjs 0.0.0.0:8080

    script echos to console 1 if port is free or 0 if port can't be taken (no access or already used)

    exit code in both cases will be 0

    if any other error appear then it will show as unhandled error and thus will cause exit code to be non zero

  Mode 2:

    node script.mjs localhost:80 -v
    node script.mjs 0.0.0.0:8080 -v

    script echos human readable message whether port is free or not

    if port is free exit code will be 0

    if it is not free exit code will be non 0

`);

  process.exit(1);
}

const arg = process.argv[2];

if (typeof arg !== "string") {
  throw new Error(`process.argv[2] !== 'string'`);
}

const reg = /^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;

const match = arg.match(reg);

if (match === null) {
  throw new Error(`process.argv[2] (${arg}) don't match: ${reg}`);
}

const host: string = match[1];
const port: number = Number.parseInt(match[2], 10);

const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");

const app = http.createServer(() => {});

app
  .listen(port, host, () => {
    if (verbose) {
      console.log(`node ${filename}: port ${host}:${port} is free`);
    } else {
      process.stdout.write("1");
    }

    process.exit(0);
  })
  .on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EADDRINUSE" || e.code === "EACCES") {
      if (verbose) {
        console.log(`node ${filename} error: port ${host}:${port} is not free: ${String(e)}`);

        process.exit(1);
      } else {
        process.stdout.write("0");

        process.exit(0);
      }
    } else {
      console.log(`node ${filename} error: port ${host}:${port} is not free due to unknown reason:`);

      throw e;
    }
  });

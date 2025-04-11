import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import readline from "readline";
const __filename = fileURLToPath(import.meta.url);

// const path = require("path");
// const fs = require("fs");
// const readline = require("readline");

const th = (msg) => new Error(`${__filename} error: ${msg}`);

const web_relative = process.argv[2];

if (web_relative) {
  if (typeof web_relative !== "string") {
    throw th(`web_relative arg is not defined`);
  }

  if (!fs.lstatSync(web_relative).isDirectory()) {
    throw th(`web_relative path >${web_relative}< is not a directory`);
  }
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let first = true;

rl.on("line", (file) => {
  if (typeof file !== "string") {
    throw th(`file >${file}< arg is not defined`);
  }

  if (!fs.existsSync(file)) {
    throw th(`file >${file}< doesn't exist`);
  }

  const p = {
    ext: path.extname(file).substring(1),
    base: path.basename(file, path.extname(file)),
    path: path.dirname(file),
  };

  const jasmineFile = `${p.path}${path.sep}${p.base}.jasmine-esbuild.${p.ext}`;

  let final = jasmineFile;

  if (web_relative) {
    final = path.relative(web_relative, final);
  }

  if (!first) {
    process.stdout.write("\n");
  }

  process.stdout.write(final);

  first = false;
});

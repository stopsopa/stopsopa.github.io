#!/usr/bin/env node

/**
 * This script acts as a Prettier post-processor in a file-processing pipeline.
 *
 * It reads file paths from stdin and formats them using Prettier in batches.
 *
 * Workflow:
 *
 * 1. Reads file paths line-by-line from stdin.
 *
 *    Example input:
 *
 *      bash/node/versioncheck.js
 *      pages/index.js
 *      styles/main.css
 *
 * 2. For each path:
 *    - Checks if the file exists.
 *    - If the file does not exist:
 *        - normal mode: prints an error to stderr.
 *        - --forward-stdin-to-stdout mode: silently ignores it.
 *    - Existing files are passed to Prettier unchanged.
 *
 * 3. Buffers files and runs Prettier in batches:
 *    - Groups up to BATCH_SIZE files into one Prettier command.
 *    - Uses DEBOUNCE_MS to flush incomplete batches.
 *
 * 4. Output:
 *
 *    Default:
 *      frmtd: 0001 file.js
 *
 *    With --forward-stdin-to-stdout:
 *      file.js
 *
 * Usage:
 *
 *   node transpile_prettier_pipe.ts
 *
 *   node transpile_prettier_pipe.ts --forward-stdin-to-stdout
 *
 * Example pipeline:
 *
 *   node transpile.ts --watch \
 *     | node transpile_prettier_pipe.ts --forward-stdin-to-stdout \
 *     | node bash/node/preamble.ts transpile.preamble --stream
 */

import readline from "readline";
import { spawn } from "child_process";
import fs from "fs";

const cleanStdout = process.argv.includes("--forward-stdin-to-stdout");

if (process.stdin.isTTY) {
  console.log(`
Usage:
  node transpile_prettier_pipe.ts [--forward-stdin-to-stdout]

Input:
  File paths, one per line.

Output:
  Default:
    frmtd: 0001 file.js

  With --forward-stdin-to-stdout:
    file.js
`);
  process.exit(0);
}

const BATCH_SIZE = 3;
const DEBOUNCE_MS = 100;
const PADDING = 4;

let counter = 0;
let buffer: string[] = [];
let timeout: NodeJS.Timeout | null = null;

function outputFormatted(files: string[]) {
  if (cleanStdout) {
    files.forEach((file) => console.log(file));
    return;
  }

  counter++;

  const c = String(counter).padStart(PADDING, "0");

  files.forEach((file) => {
    console.log(`frmtd: ${c} ${file}`);
  });
}

function flush() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  if (buffer.length === 0) {
    return;
  }

  const files = [...buffer];
  buffer = [];

  const args = ["--config", "prettier.config.cjs", "--write", ...files];

  const proc = spawn("node_modules/.bin/prettier", args);

  let stderr = "";

  proc.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  proc.on("error", (error) => {
    console.error(`prettier: ${error.message}`);
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`prettier: failed\n${stderr}`);
      return;
    }

    outputFormatted(files);
  });
}

function scheduleFlush() {
  if (buffer.length >= BATCH_SIZE) {
    flush();
    return;
  }

  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(flush, DEBOUNCE_MS);
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (line) => {
  const file = line.trim();

  if (!file) {
    return;
  }

  if (!fs.existsSync(file)) {
    if (!cleanStdout) {
      console.error(`prettier: file not found: ${file}`);
    }

    return;
  }

  buffer.push(file);

  scheduleFlush();
});

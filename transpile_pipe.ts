/**
 * This script acts as a post-processor for the transpilation process.
 * It is intended to be used in a pipe, typically following `transpile.ts`.
 * 
 * Workflow:
 * 1.  Listens to `stdin` for lines matching the pattern "transpiled [file].ts".
 * 2.  When a match is found, it identifies the corresponding generated ".js" file.
 * 3.  Checks if the ".js" file exists on the filesystem and adds it to a buffer.
 * 4.  Buffering & Batching:
 *     - Groups up to BATCH_SIZE (3) files to format them in a single Prettier command.
 *     - Uses a DEBOUNCE_MS (100ms) timer to flush the buffer if it doesn't fill up.
 * 5.  Formatting:
 *     - Uses `spawn` to run Prettier safely, passing files as an array of arguments 
 *       (avoids issues with spaces in paths).
 * 6.  Logs:
 *     - Original stdin lines (prefixed with "stdin: ").
 *     - Successful formatting (prefixed with "frmtd: ").
 *     - Any errors or stderr output from Prettier.
 * 
 * Usage example:
 * node transpile.ts --watch | node transpile_pipe.ts
 */
import readline from "readline";
import { spawn } from "child_process";
import fs from "fs";

if (process.stdin.isTTY) {
  console.log(`
Usage:
  node transpile.ts --watch | node transpile_pipe.ts

Description:
  Listen for "transpiled [file].ts" on stdin.
  Run prettier on "[file].js".
  Prefix stdin with "stdin: ".
  Print "frmtd: [file].js" on success.
`);
  process.exit(0);
}

const BATCH_SIZE = 3;
const DEBOUNCE_MS = 100;
const PADDING = 4;

let counter = 0;
let buffer: string[] = [];
let timeout: NodeJS.Timeout | null = null;

function flush() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  if (buffer.length === 0) return;

  const files = [...buffer];
  buffer = [];

  const args = ["--config", "prettier.config.cjs", "--write", ...files];
  const proc = spawn("node_modules/.bin/prettier", args);

  let stderr = "";
  proc.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  proc.on("error", (error) => {
    console.error(`error: ${error.message}`);
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    counter++;
    const c = String(counter).padStart(PADDING, "0");
    files.forEach((f) => {
      console.log(`frmtd: ${c} ${f}`);
    });
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (line) => {
//   console.log(`stdin: ${line}`);

  const match = line.match(/^transpiled (.*\.ts)$/);
  if (match) {
    const tsFile = match[1];
    const jsFile = tsFile.replace(/\.ts$/, ".js");

    if (fs.existsSync(jsFile)) {
      buffer.push(jsFile);

      if (buffer.length >= BATCH_SIZE) {
        flush();
      } else {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(flush, DEBOUNCE_MS);
      }
    }
  }
});

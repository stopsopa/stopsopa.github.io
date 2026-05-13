/**
 * This script acts as a post-processor for the transpilation process.
 * It is intended to be used in a pipe, typically following `transpile.ts`.
 * 
 * Workflow:
 * 1.  Listens to `stdin` for lines matching the pattern "transpiled [file].ts".
 * 2.  When a match is found, it identifies the corresponding generated ".js" file.
 * 3.  Checks if the ".js" file exists on the filesystem.
 * 4.  If it exists, it triggers `prettier` to format the generated JavaScript file 
 *     using the project's configuration (prettier.config.cjs).
 * 5.  Logs the original stdin line (prefixed with "stdin: ") and reports successful 
 *     formatting (prefixed with "frmtd: ") or any errors encountered.
 * 
 * Usage example:
 * node transpile.ts --watch | node transpile_pipe.ts
 */
import readline from "readline";
import { exec } from "child_process";
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

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (line) => {
  console.log(`stdin: ${line}`);

  const match = line.match(/^transpiled (.*\.ts)$/);
  if (match) {
    const tsFile = match[1];
    const jsFile = tsFile.replace(/\.ts$/, ".js");

    if (fs.existsSync(jsFile)) {
      const cmd = `/bin/bash node_modules/.bin/prettier --config prettier.config.cjs --write ${jsFile}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`frmtd: ${jsFile}`);
      });
    }
  }
});

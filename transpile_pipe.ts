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

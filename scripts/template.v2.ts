import path from "path";

import { fileURLToPath } from "url";
import * as readline from "node:readline";

import { templateToDeterminedFile } from "./template.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const script = path.relative(root, __filename);

const CONCURRENCY = 3;
/**
 
 find . -type d -name 'node_modules' -prune -o -type f -name '*.template.html' -print \
    | time SILENT=true /bin/bash ts.sh scripts/template.v2.ts

 *
 * This function handles the transformation of each line.
 * You can modify this function to implement any logic you need.
 *
 * @param line - The input line from stdin
 * @returns The transformed line to be sent to stdout
 */
async function process_file(line: string): Promise<string> {
  const output = await templateToDeterminedFile(line);

  return `
  ${script} input  : ${line}
  ${script} output : ${output}
`;
}

// Start the process
try {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const running = new Set<Promise<void>>();

  for await (const line of rl) {
    const p = (async () => {
      const result = await process_file(line);
      process.stdout.write(result);
    })();

    running.add(p);
    p.finally(() => running.delete(p));

    if (running.size >= CONCURRENCY) {
      await Promise.race(running);
    }
  }

  // Wait for any remaining tasks to complete
  await Promise.all(running);

  console.log(`
  Done 🎉
`);
} catch (error) {
  console.error("src/stream.ts error:", error);
  process.exit(1);
}

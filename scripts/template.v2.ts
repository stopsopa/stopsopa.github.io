import * as readline from "node:readline";

import { setTimeout } from "node:timers/promises";

const min = 30;
const max = 100;
function rand() {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 *
 * ls -la | NODE_OPTIONS="" SILENT=true /bin/bash ts.sh scripts/template.v2.ts
 *
 * This function handles the transformation of each line.
 * You can modify this function to implement any logic you need.
 *
 * @param line - The input line from stdin
 * @returns The transformed line to be sent to stdout
 */
async function transformer(line: string): Promise<string> {
  const timestamp = new Date().toISOString();

  await setTimeout(rand());

  return `[${timestamp}] ${line}`;
}

/**
 * Main function to read from stdin line by line and
 * output the transformed content to stdout.
 */
async function processStream() {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  for await (const line of rl) {
    const result = await transformer(line);

    // Output the result followed by a newline
    process.stdout.write(result + "\n");
  }
}

// Start the process
try {
  await processStream();
} catch (error) {
  console.error("src/stream.ts error:", error);
  process.exit(1);
}

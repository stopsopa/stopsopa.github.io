#!/usr/bin/env node

/**
 * Prepends a preamble to files received from stdin.
 *
 * Usage:
 *
 *   cat files.txt | node bash/node/preamble.ts preamble.txt
 *
 * Example:
 *
 *   /bin/bash transpile.sh transpile.ignore \
 *     | awk '{ print $2 }' \
 *     | node bash/node/preamble.ts TRANSPILATION.md
 *
 * Behaviour:
 *
 * - Reads file paths line-by-line from stdin.
 * - Reads the preamble text from the first CLI argument.
 * - Inserts the preamble at the top of each file.
 * - Preserves shebang lines (#!...) by inserting after them.
 * - Skips files which already contain the preamble.
 */

import fs from "node:fs/promises";
import readline from "node:readline";

const preambleFile = process.argv[2];

if (!preambleFile) {
  console.error("Usage: preamble.ts <preamble-file>");
  process.exit(1);
}

const preamble = await fs.readFile(preambleFile, "utf8");

if (!preamble.trim()) {
  console.error(`Preamble file is empty: ${preambleFile}`);
  process.exit(1);
}

function addPreamble(source: string): string {
  // Already added
  if (source.includes(preamble)) {
    return source;
  }

  const text = preamble.endsWith("\n") ? preamble : `${preamble}\n`;

  // Keep executable scripts valid
  if (source.startsWith("#!")) {
    const newline = source.indexOf("\n");

    if (newline === -1) {
      return `${source}\n${text}`;
    }

    return `${source.slice(0, newline + 1)}${text}${source.slice(newline + 1)}`;
  }

  return `${text}${source}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

for await (const line of rl) {
  const file = line.trim();

  if (!file) {
    continue;
  }

  try {
    const source = await fs.readFile(file, "utf8");
    const updated = addPreamble(source);

    if (updated !== source) {
      await fs.writeFile(file, updated);
      console.log(`preamble: ${file}`);
    } else {
      console.log(`preamble: skipped ${file}`);
    }
  } catch (err) {
    console.error(`preamble: failed ${file}`, err);
    process.exitCode = 1;
  }
}
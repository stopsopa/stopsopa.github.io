#!/usr/bin/env node

// cat <<'EOF' | NODE_OPTIONS= node bash/node/json/sortObjectNested.ts
// {
//   "z": 1,
//   "a": {
//     "d": 4,
//     "b": 2,
//     "c": {
//       "y": 25,
//       "x": 24
//     }
//   },
//   "m": [
//     {
//       "z": 3,
//       "a": 1
//     },
//     {
//       "c": 3,
//       "b": 2
//     }
//   ]
// }
// EOF
//
// Sort arrays too:
//
// cat <<'EOF' | NODE_OPTIONS= node bash/node/json/sortObjectNested.ts --array
// [
//   { "z": 1, "a": 2 },
//   { "c": 3 },
//   { "a": 1 }
// ]
// EOF
//
// It can also be used on a file in place:
//
// NODE_OPTIONS= node bash/node/json/sortObjectNested.ts [--array] [path to file in place]

import { readFile, writeFile } from "node:fs/promises";

function isObject(o: unknown): o is Record<string, unknown> {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function sortObjectNested<T>(data: T, sortArrays: boolean): T {
  if (Array.isArray(data)) {
    const sorted = data.map((item) => sortObjectNested(item, sortArrays));

    if (sortArrays) {
      sorted.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }

    return sorted as T;
  }

  if (isObject(data)) {
    return Object.fromEntries(
      Object.keys(data)
        .sort()
        .map((key) => [key, sortObjectNested(data[key], sortArrays)])
    ) as T;
  }

  return data;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

try {
  const args = process.argv.slice(2);
  const sortArrays = args.includes("--array");
  const file = args.find((arg) => arg !== "--array");

  if (file) {
    const input = await readFile(file, "utf8");
    const sorted = sortObjectNested(JSON.parse(input), sortArrays);

    await writeFile(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  } else {
    const input = await readStdin();
    const sorted = sortObjectNested(JSON.parse(input), sortArrays);

    process.stdout.write(JSON.stringify(sorted, null, 2) + "\n");
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);

  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

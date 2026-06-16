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
// also it can be used on file in place
// NODE_OPTIONS= node bash/node/json/sortObjectNested.ts [path to file in place]

import { readFile, writeFile } from "node:fs/promises";

function isObject(o: unknown): o is Record<string, unknown> {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function sortObjectNested<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(sortObjectNested) as T;
  }

  if (isObject(data)) {
    return Object.fromEntries(
      Object.keys(data)
        .sort()
        .map((key) => [key, sortObjectNested(data[key])]),
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
  const file = process.argv[2];

  if (file) {
    const input = await readFile(file, "utf8");
    const sorted = sortObjectNested(JSON.parse(input));

    await writeFile(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  } else {
    const input = await readStdin();
    const sorted = sortObjectNested(JSON.parse(input));

    process.stdout.write(JSON.stringify(sorted, null, 2) + "\n");
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);

  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

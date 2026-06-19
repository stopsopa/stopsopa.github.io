#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
function sortObjectNested(data) {
  if (Array.isArray(data)) {
    return data.map(sortObjectNested);
  }
  if (isObject(data)) {
    return Object.fromEntries(
      Object.keys(data)
        .sort()
        .map((key) => [key, sortObjectNested(data[key])])
    );
  }
  return data;
}
async function readStdin() {
  const chunks = [];
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
  process.stderr.write(`Error: ${message}
`);
  process.exit(1);
}

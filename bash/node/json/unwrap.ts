/**
cat <<EEE | NODE_OPTIONS= node bash/node/json/unwrap.ts abc
{
        "abc": {
                "def": {
                        "ghi": "boom"
                }
        }
}
EEE
{
  "def": {
    "ghi": "boom"
  }
}

cat <<EEE | NODE_OPTIONS= node bash/node/json/unwrap.ts abc.def
{
        "abc": {
                "def": {
                        "ghi": "boom"
                }
        }
}
EEE

{
  "ghi": "boom"
}

cat <<EEE | NODE_OPTIONS= node bash/node/json/unwrap.ts --num 2
{
        "abc": {
                "def": {
                        "ghi": "boom"
                }
        }
}
EEE
{
  "ghi": "boom"
}

 */

import { stdin } from "node:process";

function unwrapByDepth(value: unknown, depth: number): unknown {
  let current = value;

  for (let i = 0; i < depth; i++) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    const keys = Object.keys(current);

    if (keys.length === 0) {
      break;
    }

    current = (current as Record<string, unknown>)[keys[0]];
  }

  return current;
}

function unwrapByPath(value: unknown, path: string): unknown {
  let current = value;

  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object" || !(part in (current as Record<string, unknown>))) {
      throw new Error(`Path not found: ${path}`);
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

async function readStdin(): Promise<string> {
  let data = "";

  stdin.setEncoding("utf8");

  for await (const chunk of stdin) {
    data += chunk;
  }

  return data;
}

async function main(): Promise<void> {
  const input = await readStdin();

  if (!input.trim()) {
    return;
  }

  const json = JSON.parse(input);

  const arg = process.argv[2];

  let result = json;

  if (!arg) {
    result = unwrapByDepth(json, 1);
  } else if (arg === "--num") {
    const depth = Number.parseInt(process.argv[3] ?? "1", 10);

    if (!Number.isInteger(depth) || depth < 0) {
      throw new Error("Invalid depth");
    }

    result = unwrapByDepth(json, depth);
  } else {
    result = unwrapByPath(json, arg);
  }

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

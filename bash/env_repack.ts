/**
 
this will change or set TAG and PORT and remove DOCKER_BIN and JWT_EXPIRE_SECONDS

cat <<EEE | NODE_OPTIONS= node bash/env_repack.ts --in-place .env
TAG="v8.6.1"
PORT=4778
-DOCKER_BIN
-JWT_EXPIRE_SECONDS=32400
EEE

or

cat <<EEE | NODE_OPTIONS= node bash/env_repack.ts .env > .env.new
TAG="v8.6.1"
PORT=4778
-DOCKER_BIN
-JWT_EXPIRE_SECONDS=32400
EEE

 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { stdin } from "node:process";
import { fileURLToPath } from "node:url";

function escapeEnvValue(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}
function iterateOverEnv(envFileBody: string): string[] {
  return envFileBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      return match?.[1];
    })
    .filter((key): key is string => Boolean(key));
}

function setEnvVar(envFileBody: string, key: string, value: string): string {
  const escapedValue = escapeEnvValue(value);

  let replaced = false;

  const updatedLines = envFileBody.split(/\r?\n/).map((line) => {
    const match = line.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*)=(.*)$/);

    if (!match) {
      return line;
    }

    const [, prefix, existingKey, spacing, rest] = match;

    if (existingKey !== key) {
      return line;
    }

    replaced = true;

    // keep everything after the value if it is a comment
    const commentMatch = rest.match(/^.*?(\s+#.*)$/);
    const comment = commentMatch?.[1] ?? "";

    return `${prefix}${key}${spacing}=${escapedValue}${comment}`;
  });

  if (replaced) {
    return updatedLines.join("\n");
  }

  return `${envFileBody.trimEnd()}\n${key}=${escapedValue}`;
}

function unsetEnvVar(envFileBody: string, key: string): string {
  const keys = iterateOverEnv(envFileBody);

  if (!keys.includes(key)) {
    return envFileBody;
  }

  return envFileBody
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);

      return match?.[1] !== key;
    })
    .join("\n");
}

function editEnvVar(
  envVarBody: string,
  instructions: string,
): {
  unset: string[];
  set: Record<string, string>;
} {
  const unset: string[] = [];
  const set: Record<string, string> = {};

  instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith("-")) {
        const key = line.slice(1).split("=")[0].trim();

        if (key) {
          unset.push(key);
        }

        return;
      }

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

      if (!match) {
        return;
      }

      const [, key, rawValue] = match;

      let value = rawValue.trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replaceAll('\\"', '"');
      }

      set[key] = value;
    });

  return {
    unset,
    set,
  };
}

export { iterateOverEnv, setEnvVar, unsetEnvVar, editEnvVar };

const th = (msg: string) => new Error(`bash/env_repack.ts error: ${msg}`);

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    stdin.setEncoding("utf8");

    stdin.on("data", (chunk) => {
      data += chunk;
    });

    stdin.on("end", () => {
      resolve(data);
    });

    stdin.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  const inPlace = args.includes("--in-place");

  const envFile = args.find((arg) => arg !== "--in-place");

  if (!envFile) {
    throw th("missing .env file argument");
  }

  if (!existsSync(envFile)) {
    throw th(`env file does not exist: ${envFile}`);
  }

  const instructions = await readStdin();

  if (!instructions.trim()) {
    throw th("no instructions received from stdin");
  }

  let envBody = readFileSync(envFile, "utf8");

  const { unset, set } = editEnvVar(envBody, instructions);

  for (const key of unset) {
    envBody = unsetEnvVar(envBody, key);
  }

  for (const [key, value] of Object.entries(set)) {
    envBody = setEnvVar(envBody, key, value);
  }

  if (inPlace) {
    writeFileSync(envFile, envBody, "utf8");
    return;
  }

  process.stdout.write(envBody);
}

// execute only when called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

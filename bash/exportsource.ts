//
// script will properly export variables defined in .env file,
// where normally they are not prefixed with "export" keyword
//
// USAGE:
//
// override mode - false (default)
// eval "$(node bash/exportsource.ts .env.test)"
//
// override mode - true
// eval "$(node bash/exportsource.ts .env.test true)"
//

import fs from "node:fs";
import dotenv from "dotenv";

const err = (msg: string) => `${import.meta.filename} error: ${msg}`;

const th = (msg: string) => new Error(err(msg));

const env = process.argv[2];

if (typeof env !== "string" || !env.trim()) {
  throw th(`.env file not specified - provide it in first arg`);
}

if (!fs.existsSync(env)) {
  throw th(`File ${env} doesn't exist`);
}

const copy = { ...process.env };

const result = dotenv.config({
  path: env,
});

if (result.error) {
  throw result.error;
}

for (const [key, value] of Object.entries(result.parsed ?? {})) {
  if (!process.argv[3] && typeof copy[key] === "string") {
    continue;
  }

  console.log(`export ${key}="${value}"`);
}

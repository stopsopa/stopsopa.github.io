//
// script will properly export variables defined in .env file,
// where normally they are not prefixed with "export" keyword
//
// USAGE:
//
// override mode - false (default) - variables already present in the environment (even empty) are left alone
// eval "$(node bash/exportsource.ts .env.test)"
//
// override mode - true
// eval "$(node bash/exportsource.ts .env.test true)"
//
// eval "$(...)" hides exit code of this script, if you need to stop on error (e.g. missing file):
// ENVEXPORTS="$(node bash/exportsource.ts .env.test)" || exit 1
// eval "${ENVEXPORTS}"
//
// tests: /bin/bash bash/tests/exportsource/test.sh
//
// the same thing implemented in bash: bash/exportsource.sh
// difference: this script parses the file with dotenv (nothing is executed),
//             bash/exportsource.sh sources it (so it is interpreted by bash: FOO=$BAR is expanded)
//

import fs from "node:fs";
import dotenv from "dotenv";

function fail(msg: string): never {
  console.error(`${import.meta.filename} error: ${msg}`);

  process.exit(1);
}

const file = process.argv[2];

const override = process.argv[3] || "false";

if (typeof file !== "string" || !file.trim()) {
  fail(`.env file not specified - provide it in first arg`);
}

if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
  fail(`file '${file}' doesn't exist`);
}

if (override !== "true" && override !== "false") {
  fail(`second arg (override mode) should be 'true', 'false' or not specified, it is '${override}'`);
}

// dotenv.parse() instead of dotenv.config() - it doesn't touch process.env and doesn't print anything
const parsed = dotenv.parse(fs.readFileSync(file));

for (const [key, value] of Object.entries(parsed)) {
  // dotenv allows also . and - in the name, shell doesn't
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
    console.error(`${import.meta.filename} warning: '${key}' is not valid name of shell variable - skipped`);

    continue;
  }

  if (override === "false" && typeof process.env[key] === "string") {
    continue;
  }

  // single quotes, each ' in the value replaced with '\''
  // this way nothing in the value is interpreted when the output is evaluated
  console.log(`export ${key}='${value.replaceAll("'", `'\\''`)}'`);
}

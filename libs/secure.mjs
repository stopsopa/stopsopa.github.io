import path from "path";

import fs from "fs";

const log = console.log;

const file = process.argv[2];

const replacement = process.argv[3];

const msg = (ms) => `secure.mjs ${ms}`;

const th = (ms) => new Error(msg(`error: ${ms}`));

if (typeof file !== "string") {
  throw th(`target file is not specified, provide using first argument to this script`);
}

if (typeof replacement !== "string") {
  throw th(`replacement is not specified, provide using second argument to this script`);
}

if (!fs.existsSync(file)) {
  throw th(`file >${file}< doesn't exist`);
}

const content = fs.readFileSync(file, "utf8").toString();

/**
 * from: https://www.30secondsofcode.org/js/s/replace-last-occurrence/
 */
const replaceLast = (str, pattern, replacement) => {
  const match = typeof pattern === "string" ? pattern : (str.match(new RegExp(pattern.source, "g")) || []).slice(-1)[0];
  if (!match) return str;
  const last = str.lastIndexOf(match);
  return last !== -1 ? `${str.slice(0, last)}${replacement}${str.slice(last + match.length)}` : str;
};

const newContent = replaceLast(content, /(<\/body>)/, `  ${replacement}\n  </body>`);

fs.writeFileSync(file, newContent);

log(msg(`file >${file}< saved...`));

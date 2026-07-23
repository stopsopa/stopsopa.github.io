/**
 * NODE_OPTIONS= node bash/node/versioncheck.ts v14.4
 * NODE_OPTIONS= node bash/node/versioncheck.ts --nvmrc .nvmrc
 * NODE_OPTIONS= node bash/node/versioncheck.ts --tool-versions .tool-versions
 *
 * NODE_OPTIONS= node bash/node/versioncheck.ts v14.4.0 --exact
 * NODE_OPTIONS= node bash/node/versioncheck.ts --nvmrc .nvmrc --exact
 * NODE_OPTIONS= node bash/node/versioncheck.ts --tool-versions .tool-versions --exact
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const matchOperatorsRe: RegExp = /[|\\{}()[\]^$+*?.]/g;

function pregQuote(str: unknown): string | false {
  if (typeof str !== "string") {
    return false;
  }

  return str.replace(matchOperatorsRe, "\\$&");
}

function trim(string: unknown, charlist?: string, direction?: string): string | false {
  if (typeof string !== "string") {
    return false;
  }

  direction = direction || "rl";

  const escapedCharlist = pregQuote(charlist || "");
  const finalCharlist = escapedCharlist || " \\n";

  direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + finalCharlist + "]*$", "gm"), "$1"));

  direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + finalCharlist + "]*(.*)$", "gm"), "$1"));

  return string;
}

const nvmrcCheck: number = process.argv.indexOf("--nvmrc");
const toolVersionsCheck: number = process.argv.indexOf("--tool-versions");

let declaredNodeVersion: string | null = null;

if (nvmrcCheck > -1) {
  const nvmrcFile: string = process.argv[nvmrcCheck + 1];

  if (!fs.existsSync(nvmrcFile)) {
    throw new Error(`file '${nvmrcFile}' doesn't exist`);
  }

  declaredNodeVersion = fs.readFileSync(nvmrcFile, "utf8").toString();
} else if (toolVersionsCheck > -1) {
  const toolVersionsFile: string = process.argv[toolVersionsCheck + 1];

  if (!fs.existsSync(toolVersionsFile)) {
    throw new Error(`file '${toolVersionsFile}' doesn't exist`);
  }

  const toolVersions: string = fs.readFileSync(toolVersionsFile, "utf8").toString();

  const match: RegExpMatchArray | null = toolVersions.match(/^\s*nodejs\s+(v?\d+\.\d+\.\d+)/m);

  if (!match) {
    throw new Error(`couldn't find nodejs version in '${toolVersionsFile}'`);
  }

  declaredNodeVersion = match[1];
} else {
  declaredNodeVersion = process.argv[2] ?? null;
}

if (typeof declaredNodeVersion !== "string") {
  throw new Error(
    `typeof declaredNodeVersion !== 'string', provide as first argument like v14.4 or provide path to .nvmrc using --nvmrc [filepath] or .tool-versions using --tool-versions [filepath]`,
  );
}

if (!declaredNodeVersion.trim()) {
  throw new Error(
    `declaredNodeVersion is an empty string, provide as first argument like v14.4 or provide path to .nvmrc using --nvmrc [filepath] or .tool-versions using --tool-versions [filepath]`,
  );
}

const trimmedDeclaredNodeVersion: string | false = trim(declaredNodeVersion);

if (!trimmedDeclaredNodeVersion) {
  throw new Error("failed trimming declared node version");
}

declaredNodeVersion = trimmedDeclaredNodeVersion;

let ver: string = process.version;

const reg: RegExp = /^(v?\d+\.\d+)(\.\d+)?$/;

const parts: RegExpMatchArray | null = declaredNodeVersion.match(reg);

if (!Array.isArray(parts) || parts.length !== 3) {
  throw new Error(
    `extracting minor version ${reg} from given version to compare '${declaredNodeVersion}' didn't worked`,
  );
}

if (process.argv.indexOf("--exact") === -1) {
  declaredNodeVersion = parts[1];

  const verParts: string[] = ver.split(".");

  verParts.pop();

  ver = verParts.join(".");
}

if (ver !== declaredNodeVersion) {
  throw new Error(`${__dirname} error: Version of node should be '${declaredNodeVersion}' but it is '${ver}'`);
}

console.log(`Version of node is ${ver} and it should be ${declaredNodeVersion} - so it's valid`);

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
function pregQuote(str) {
  if (typeof str !== "string") {
    return false;
  }
  return str.replace(matchOperatorsRe, "\\$&");
}
function trim(str, charlist, direction) {
  if (typeof str !== "string") {
    return false;
  }
  direction = direction || "rl";
  const escapedCharlist = pregQuote(charlist || "");
  const finalCharlist = escapedCharlist || " \\n";
  let result = str;
  direction.indexOf("r") + 1 && (result = result.replace(new RegExp("^(.*?)[" + finalCharlist + "]*$", "gm"), "$1"));
  direction.indexOf("l") + 1 && (result = result.replace(new RegExp("^[" + finalCharlist + "]*(.*)$", "gm"), "$1"));
  return result;
}
const nvmrcCheck = process.argv.indexOf("--nvmrc");
const toolVersionsCheck = process.argv.indexOf("--tool-versions");
let declaredNodeVersion = null;
if (nvmrcCheck > -1) {
  const nvmrcFile = process.argv[nvmrcCheck + 1];
  if (!fs.existsSync(nvmrcFile)) {
    throw new Error(`file '${nvmrcFile}' doesn't exist`);
  }
  declaredNodeVersion = fs.readFileSync(nvmrcFile, "utf8").toString();
} else if (toolVersionsCheck > -1) {
  const toolVersionsFile = process.argv[toolVersionsCheck + 1];
  if (!fs.existsSync(toolVersionsFile)) {
    throw new Error(`file '${toolVersionsFile}' doesn't exist`);
  }
  const toolVersions = fs.readFileSync(toolVersionsFile, "utf8").toString();
  const match = toolVersions.match(/^\s*nodejs\s+(v?\d+\.\d+\.\d+)/m);
  if (!match) {
    throw new Error(`couldn't find nodejs version in '${toolVersionsFile}'`);
  }
  declaredNodeVersion = match[1];
} else {
  declaredNodeVersion = process.argv[2] ?? null;
}
if (typeof declaredNodeVersion !== "string") {
  throw new Error(
    `typeof declaredNodeVersion !== 'string', provide as first argument like v14.4 or provide path to .nvmrc using --nvmrc [filepath] or .tool-versions using --tool-versions [filepath]`
  );
}
if (!declaredNodeVersion.trim()) {
  throw new Error(
    `declaredNodeVersion is an empty string, provide as first argument like v14.4 or provide path to .nvmrc using --nvmrc [filepath] or .tool-versions using --tool-versions [filepath]`
  );
}
const trimmedDeclaredNodeVersion = trim(declaredNodeVersion);
if (!trimmedDeclaredNodeVersion) {
  throw new Error("failed trimming declared node version");
}
declaredNodeVersion = trimmedDeclaredNodeVersion;
let ver = process.version;
const reg = /^(v?\d+\.\d+)(\.\d+)?$/;
const parts = declaredNodeVersion.match(reg);
if (!Array.isArray(parts) || parts.length !== 3) {
  throw new Error(
    `extracting minor version ${reg} from given version to compare '${declaredNodeVersion}' didn't worked`
  );
}
if (process.argv.indexOf("--exact") === -1) {
  declaredNodeVersion = parts[1];
  const verParts = ver.split(".");
  verParts.pop();
  ver = verParts.join(".");
}
if (ver !== declaredNodeVersion) {
  throw new Error(`${__dirname} error: Version of node should be '${declaredNodeVersion}' but it is '${ver}'`);
}
console.log(`Version of node is ${ver} and it should be ${declaredNodeVersion} - so it's valid`);

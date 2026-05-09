// see TRANSPILATION.md

/**
 * NODE_OPTIONS= node tsc.ignore.ts "tsc.ignore" tsconfig.json tsc.ignore.tsconfig.json
 */

import fs from "fs";

import ts from "typescript";

const th = (msg: string) => new Error(`tsc.ignore.ts error: ${msg}`);

const args = process.argv.slice(2);

const ignorefile = args[0];
const tsconfigfile = args[1];
const outputfile = args[2];

if (!fs.existsSync(ignorefile)) {
  throw th(`${ignorefile} doesn't exist`);
}

if (!fs.existsSync(tsconfigfile)) {
  throw th(`${tsconfigfile} doesn't exist`);
}

const fileContent = fs.readFileSync(ignorefile, "utf-8");

const exclude = fileContent
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .filter((l) => !l.startsWith("#"));

console.log(exclude);

const tsconfigContent = fs.readFileSync(tsconfigfile, "utf-8");

const { config: tsconfigObj, error } = ts.parseConfigFileTextToJson(tsconfigfile, tsconfigContent);

if (error) {
  throw th(`Error parsing ${tsconfigfile}: ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`);
}

tsconfigObj.exclude = exclude;

fs.writeFileSync(outputfile, JSON.stringify(tsconfigObj, null, 2));

console.log(`

tsc.ignore.ts config generated at: ${outputfile}:
${JSON.stringify(tsconfigObj, null, 2)}

`);

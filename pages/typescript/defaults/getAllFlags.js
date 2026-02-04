// dump-ts-all-options.mjs
import ts from "typescript";
import fs from "fs";

const targetPath = process.argv[2];

if (!targetPath) {
  console.error("Usage: node all-ts-flags.js <target-file-path>");
  process.exit(1);
}

// TS internal metadata subtree
const optionInfo = ts.optionDeclarations;

// Build JSON output
const allOptions = {};

for (const opt of optionInfo) {
  // option name (e.g. "allowJs")
  const name = opt.name;

  // default value — some are functions or shared logic, so show literal default if present
  let defaultValue = opt.defaultValue;
  if (defaultValue === undefined && opt.type === "boolean") {
    // boolean flags default to false
    defaultValue = false;
  }

  allOptions[name] = {
    type: opt.type,
    default: defaultValue === undefined ? null : defaultValue,
  };
}

// Write to file
fs.writeFileSync(targetPath, JSON.stringify(allOptions, null, 2));
console.log("Dumped all TS flags to ts-all-options.json");

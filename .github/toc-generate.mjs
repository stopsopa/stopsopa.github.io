/**
 * Script to be used from toc-generate.sh
 *
 * Explaination of it's function:
 *
 * This script accepts two arguments:
 * 1. The source file (e.g., README.md.md) from which to extract the Table of Contents (TOC).
 * 2. The target file (e.g., README.md) where the TOC will be inserted.
 *
 *  It reads the source file, extracts the content between the markers <!-- toc --> and <!-- tocstop -->,
 *   and replaces the content between the same markers in the target file with the extracted TOC content.
 */

import fs from "fs";

const sourceFile = process.argv[2]; // README.md.md

const targetFile = process.argv[3]; // README.md

if (!fs.existsSync(sourceFile)) {
  console.log(`toc-generate.mjs error: Source file "${sourceFile}" does not exist.`);

  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.log(`toc-generate.mjs error: Target file "${targetFile}" does not exist.`);

  process.exit(1);
}

const start = "<!-- toc -->";

const end = "<!-- tocstop -->";

const content = fs.readFileSync(sourceFile, "utf8");

const tocStart = content.indexOf(start);
const tocEnd = content.indexOf(end);

if (tocStart === -1 || tocEnd === -1) {
  console.log(`toc-generate.mjs error: TOC markers not found in "${sourceFile}".`);

  process.exit(1);
}

const tocContent = content.slice(tocStart + start.length, tocEnd);

// now let's look for start and end string in the README.md file
// and replace the content between them with the extracted TOC content
const targetContent = fs.readFileSync(targetFile, "utf8");
const targetStart = targetContent.indexOf(start);
const targetEnd = targetContent.indexOf(end);
if (targetStart === -1 || targetEnd === -1) {
  console.log(`toc-generate.mjs error: TOC markers not found in "${targetFile}".`);

  process.exit(1);
}
const newContent =
  targetContent.slice(0, targetStart + start.length) + "\n" + tocContent + "\n" + targetContent.slice(targetEnd);

// write to README.md
fs.writeFileSync(targetFile, newContent, "utf8");

console.log(`toc-generate.mjs: TOC content updated in "${targetFile}".`);

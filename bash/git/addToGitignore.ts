/**
 * Reads file paths from stdin and keeps a named section in a .gitignore file
 * up to date.
 *
 * Usage:
 *   node bash/git/addToGitignore.ts <gitignore-file> <section-name>
 *
 * For every incoming line:
 *   1. Read the .gitignore file fresh.
 *   2. Find the section:
 *
 *        # <section-name> vvv
 *        ...
 *        # <section-name> ^^^
 *
 *   3. Extract the managed entries between the markers.
 *   4. If the incoming path already exists, immediately forward it to stdout.
 *   5. Otherwise add it, sort the section, rewrite only that section,
 *      close the file, then forward the original line to stdout.
 *
 * The script is designed to be used in pipes, where stdout remains a transparent
 * stream of the original input while .gitignore is updated as new paths appear.
 */

import fs from "node:fs/promises";
import readline from "node:readline";

const [gitignoreFile, sectionName] = process.argv.slice(2);

if (!gitignoreFile || !sectionName) {
  console.error("Usage: node addToGitignore.ts <gitignore-file> <section-name>");
  process.exit(1);
}

const startMarker = `# ${sectionName} vvv`;
const endMarker = `# ${sectionName} ^^^`;

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

async function updateGitignore(line: string): Promise<boolean> {
  const content = await fs.readFile(gitignoreFile, "utf8");

  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Cannot find section "${sectionName}" in ${gitignoreFile}`);
  }

  const sectionStart = start + startMarker.length;

  const before = content.slice(0, sectionStart);
  const section = content.slice(sectionStart, end);
  const after = content.slice(end);

  const entries = section
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  if (entries.includes(line.trim())) {
    return false;
  }

  entries.push(line.trim());
  entries.sort((a, b) => a.localeCompare(b));

  const newContent = before + "\n" + entries.join("\n") + "\n" + after;

  await fs.writeFile(gitignoreFile, newContent);

  return true;
}

for await (const line of rl) {
  const changed = await updateGitignore(line);

  // If already present this happens immediately.
  // If added, this happens only after the file write completed.
  process.stdout.write(line + "\n");
}

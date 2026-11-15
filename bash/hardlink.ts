/**
 * hardlink.ts
 *
 * Plan, documentation and tests:
 *   bash/file/hardlink/PLAN.md
 *
 * Purpose:
 * Reads a markdown configuration file containing pairs of file paths (path A -> path B)
 * and creates hardlinks from path A to path B after a strict validation phase.
 * Optionally updates a specified .gitignore file to ensure path B is ignored.
 *
 * Usage examples:
 *   node bash/hardlink.ts ./path/to/config.md
 *   node bash/hardlink.ts ./path/to/config.md --pwd
 *   node bash/hardlink.ts ./path/to/config.md --pwd /custom/base/dir
 *   node bash/hardlink.ts ./path/to/config.md --gitignore ./path/to/.gitignore
 *   node bash/hardlink.ts --help
 *
 * Base resolution directory:
 *   - default: directory of config.md
 *   - if --pwd is given alone: process.cwd()
 *   - if --pwd [path] is given: resolved path of [path]
 *
 * Gitignore update:
 *   - if --gitignore [path] is given, file B paths (relative to that gitignore file) are added.
 *   - looks for delimiters "# hardlink.ts vvv" and "# hardlink.ts ^^^". If present, inserts between them.
 *   - if delimiters not present, appends to the end of gitignore.
 *
 * Validation phase checks:
 *   - Path A must exist, be a regular file, and be readable.
 *   - Path B:
 *     - If it exists: must be a file; if same inode as A, skip; must be readable and writable; content must match file A.
 *     - If it does not exist: parent directory must exist (and be writable) or ancestors must permit creation.
 *
 * Execution phase:
 *   - If same inode, skip.
 *   - If file B exists (and content matches), unlink file B and create hardlink from A to B.
 *   - If file B does not exist, ensure parent directory exists and create hardlink from A to B.
 *   - Update .gitignore if --gitignore was specified.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const filename = path.basename(fileURLToPath(import.meta.url));
const th = (msg: string) => new Error(`${filename} error: ${msg}`);

export interface ParsedPair {
  rawLine: string;
  rawA: string;
  rawB: string;
  resolvedA: string;
  resolvedB: string;
}

export interface CliOptions {
  configFile?: string;
  pwdOverride?: string;
  useCwd?: boolean;
  gitignorePath?: string;
  help?: boolean;
}

/**
 * Print help page and exit with code 1
 */
export function showHelp(): never {
  const helpText = `
Usage:
  node bash/hardlink.ts <path/to/config.md> [options]

Options:
  --pwd                     Resolve paths relative to current working directory (process.cwd())
  --pwd <path>              Resolve paths relative to explicit <path>
  --gitignore <path>        Path to .gitignore to ensure target file B paths are ignored
  --help, -h                Show this help page

Gitignore delimiters:
  If the target gitignore contains the block delimiters:
    # hardlink.ts vvv
    # hardlink.ts ^^^
  new file B entries (relative to gitignore) are inserted inside this block (if not already present).
  If either delimiter is missing, entries are appended to the end of the file.

Config file format:
  The config file defines pairs of paths separated by " -> " (one pair per line).
  Empty lines are allowed.
  Paths can be in plain text or markdown link format [label](path).
  Quotes can be used for paths with spaces.
  Tilde (~) expands to the current user's home directory.

Examples of valid pairs in config.md:
  [one](./lib/test.ts) -> [two](./bin/test.ts)
  [one](./node_modules/some_lib/test.ts) -> [two](somewhere else/test.ts)
  path/to/file.log -> [two](./bin/path/to/file2.log)
  [one](./test/ttt.sh) -> ./test/ttt2.sh
  "path/with/ spaces /file log.log" -> [two](./bin/path/with/ spaces /file log2.log)
  ~/.test/ttt.sh -> [in home user](./test/ttt2.sh)
`;
  console.log(helpText.trim());
  process.exit(1);
}

/**
 * Expand tilde to home directory
 */
export function expandHome(filePath: string): string {
  if (filePath === "~") {
    return os.homedir();
  }
  if (filePath.startsWith("~/") || filePath.startsWith("~\\")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Parse a raw path token which can be:
 * - markdown link: [label](target/path)
 * - quoted path: "target/path" or 'target/path'
 * - plain text path: target/path
 */
export function extractPathString(token: string): string {
  let cleaned = token.trim();
  const mdMatch = cleaned.match(/^\[.*?\]\((.*)\)$/);
  if (mdMatch) {
    cleaned = mdMatch[1].trim();
  }
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

/**
 * Parse CLI arguments into options
 */
export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--pwd") {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        options.pwdOverride = nextArg;
        i++;
      } else {
        options.useCwd = true;
      }
    } else if (arg === "--gitignore") {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        options.gitignorePath = nextArg;
        i++;
      } else {
        console.error("Error: --gitignore requires a file path argument.");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      if (!options.configFile) {
        options.configFile = arg;
      }
    }
  }
  return options;
}

/**
 * Determine the base resolution directory and reason
 */
export function resolveBaseDir(
  configFilePath: string,
  options: CliOptions
): { baseDir: string; reason: string } {
  if (options.pwdOverride) {
    const resolved = path.resolve(process.cwd(), expandHome(options.pwdOverride));
    return {
      baseDir: resolved,
      reason: `--pwd parameter with explicit path "${options.pwdOverride}"`,
    };
  }
  if (options.useCwd) {
    return {
      baseDir: process.cwd(),
      reason: "--pwd flag using current working directory",
    };
  }
  const configDir = path.dirname(path.resolve(process.cwd(), expandHome(configFilePath)));
  return {
    baseDir: configDir,
    reason: `config.md location (${configDir})`,
  };
}

/**
 * Check if path is readable
 */
function isReadable(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is writable
 */
function isWritable(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if parent directory exists and is writable, or can be created
 */
function canCreateInParent(filePath: string): { ok: boolean; error?: string } {
  let curr = path.dirname(path.resolve(filePath));
  const toCheck: string[] = [];
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(curr)) {
      if (isWritable(curr)) {
        return { ok: true };
      }
      return { ok: false, error: `Directory "${curr}" is not writable.` };
    }
    toCheck.push(curr);
    curr = path.dirname(curr);
  }
  return { ok: false, error: `Cannot find existing writable ancestor directory for "${filePath}".` };
}

/**
 * Parse config file lines into pairs of paths
 */
export function parseConfigFile(content: string, baseDir: string): ParsedPair[] {
  const lines = content.split(/\r?\n/);
  const pairs: ParsedPair[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }
    // Match: left \s+->\s+ right
    const match = trimmed.match(/^(.*?)\s+->\s+(.*)$/);
    if (match) {
      const rawA = extractPathString(match[1]);
      const rawB = extractPathString(match[2]);

      const expandedA = expandHome(rawA);
      const expandedB = expandHome(rawB);

      const resolvedA = path.resolve(baseDir, expandedA);
      const resolvedB = path.resolve(baseDir, expandedB);

      pairs.push({
        rawLine: line,
        rawA,
        rawB,
        resolvedA,
        resolvedB,
      });
    }
  }

  return pairs;
}

/**
 * Update gitignore file to include target paths
 */
export function updateGitignore(
  gitignoreFilePath: string,
  relativePathsToAdd: string[]
): { changed: boolean; added: string[] } {
  let content = "";
  if (fs.existsSync(gitignoreFilePath)) {
    content = fs.readFileSync(gitignoreFilePath, "utf-8");
  }

  const startMarker = "# hardlink.ts vvv";
  const endMarker = "# hardlink.ts ^^^";

  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex((l) => l.trim() === startMarker);
  const endIndex = lines.findIndex((l) => l.trim() === endMarker);

  const hasDelimiters = startIndex !== -1 && endIndex !== -1 && startIndex < endIndex;
  const added: string[] = [];

  if (hasDelimiters) {
    const insideLines = lines.slice(startIndex + 1, endIndex).map((l) => l.trim());
    const toInsert: string[] = [];
    for (const relPath of relativePathsToAdd) {
      if (!insideLines.includes(relPath)) {
        toInsert.push(relPath);
        added.push(relPath);
      }
    }
    if (toInsert.length > 0) {
      lines.splice(endIndex, 0, ...toInsert);
      fs.writeFileSync(gitignoreFilePath, lines.join("\n"), "utf-8");
      return { changed: true, added };
    }
    return { changed: false, added: [] };
  } else {
    // Append to end
    const existingLines = lines.map((l) => l.trim());
    const toAppend: string[] = [];
    for (const relPath of relativePathsToAdd) {
      if (!existingLines.includes(relPath)) {
        toAppend.push(relPath);
        added.push(relPath);
      }
    }
    if (toAppend.length > 0) {
      let newContent = content;
      if (newContent.length > 0 && !newContent.endsWith("\n")) {
        newContent += "\n";
      }
      newContent += toAppend.join("\n") + "\n";
      fs.writeFileSync(gitignoreFilePath, newContent, "utf-8");
      return { changed: true, added };
    }
    return { changed: false, added: [] };
  }
}

/**
 * Main runner function
 */
export async function run(args: string[]): Promise<void> {
  const options = parseArgs(args);

  if (options.help || !options.configFile) {
    showHelp();
  }

  const rawConfigPath = options.configFile;
  const configPath = path.resolve(process.cwd(), expandHome(rawConfigPath));

  // Check if config.md exists, is file, and is readable
  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file "${rawConfigPath}" does not exist.`);
    process.exit(1);
  }

  let configStat: fs.Stats;
  try {
    configStat = fs.statSync(configPath);
  } catch (err) {
    console.error(`Error: Cannot access config file "${rawConfigPath}": ${(err as Error).message}`);
    process.exit(1);
  }

  if (!configStat.isFile()) {
    console.error(`Error: Config path "${rawConfigPath}" is not a file.`);
    process.exit(1);
  }

  if (!isReadable(configPath)) {
    console.error(`Error: Config file "${rawConfigPath}" is not readable.`);
    process.exit(1);
  }

  // Determine resolution base directory
  const { baseDir, reason } = resolveBaseDir(rawConfigPath, options);
  console.log(`Resolved paths relative to: ${baseDir} (reason: ${reason})`);

  // If --gitignore specified, validate parent exists and is writable
  let resolvedGitignore: string | undefined;
  if (options.gitignorePath) {
    resolvedGitignore = path.resolve(process.cwd(), expandHome(options.gitignorePath));
    const parent = path.dirname(resolvedGitignore);
    if (!fs.existsSync(parent) || !isWritable(parent)) {
      console.error(`Error: Gitignore directory "${parent}" does not exist or is not writable.`);
      process.exit(1);
    }
    if (fs.existsSync(resolvedGitignore) && !isWritable(resolvedGitignore)) {
      console.error(`Error: Gitignore file "${resolvedGitignore}" is not writable.`);
      process.exit(1);
    }
  }

  const content = fs.readFileSync(configPath, "utf-8");
  const pairs = parseConfigFile(content, baseDir);

  // # validation phase
  const errors: string[] = [];

  for (const pair of pairs) {
    // - we will check if something exist under path A (it has to exist, if nothing is there then error)
    if (!fs.existsSync(pair.resolvedA)) {
      errors.push(`File A [${pair.rawA}] error:\n   File does not exist: "${pair.resolvedA}"`);
      continue;
    }

    // - check the thing under path A is a file
    const statA = fs.statSync(pair.resolvedA);
    if (!statA.isFile()) {
      errors.push(`File A [${pair.rawA}] error:\n   Path is not a regular file: "${pair.resolvedA}"`);
      continue;
    }

    // - check if file A is readable
    if (!isReadable(pair.resolvedA)) {
      errors.push(`File A [${pair.rawA}] error:\n   File is not readable: "${pair.resolvedA}"`);
      continue;
    }

    // if all checks about file A are ok only then continue all checks for path B:
    if (fs.existsSync(pair.resolvedB)) {
      // - check if file B is a file
      const statB = fs.statSync(pair.resolvedB);
      if (!statB.isFile()) {
        errors.push(`File B [${pair.rawB}] error:\n   Path is not a regular file: "${pair.resolvedB}"`);
        continue;
      }

      // - VERY IMPORTANT: check if file A and file B are hardlinks to the same inode if yes then skip further checking and move on to next line in config.md - all is good
      if (statA.dev === statB.dev && statA.ino === statB.ino) {
        continue;
      }

      // - check if file B is readable
      if (!isReadable(pair.resolvedB)) {
        errors.push(`File B [${pair.rawB}] error:\n   File is not readable: "${pair.resolvedB}"`);
        continue;
      }

      // - check if file B is writable (if I have rights to remove it and create new hardlink in its place)
      if (!isWritable(pair.resolvedB)) {
        errors.push(`File B [${pair.rawB}] error:\n   File is not writable: "${pair.resolvedB}"`);
        continue;
      }

      // - check if file A and file B have the same content (if they don't then error)
      const contentA = fs.readFileSync(pair.resolvedA);
      const contentB = fs.readFileSync(pair.resolvedB);
      if (!contentA.equals(contentB)) {
        errors.push(`File B [${pair.rawB}] error:\n   Content of file B does not match content of file A`);
        continue;
      }
    } else {
      // when file B doesn't exist:
      const parentB = path.dirname(pair.resolvedB);
      if (fs.existsSync(parentB)) {
        // - check if parent directory of file B is writable (if I have rights to create new hardlink in this directory)
        if (!isWritable(parentB)) {
          errors.push(`File B [${pair.rawB}] error:\n   Parent directory "${parentB}" is not writable`);
          continue;
        }
      } else {
        // if directory doesn't exist then check if we have rights to create it
        const parentCheck = canCreateInParent(pair.resolvedB);
        if (!parentCheck.ok) {
          errors.push(`File B [${pair.rawB}] error:\n   Cannot create parent directory for "${pair.resolvedB}": ${parentCheck.error}`);
          continue;
        }
      }
    }
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(err + "\n");
    }
    process.exit(1);
  }

  // # execution phase
  const isTTY = process.stdout.isTTY;
  const green = isTTY ? "\x1b[32m" : "";
  const reset = isTTY ? "\x1b[0m" : "";

  for (const pair of pairs) {
    console.log(pair.rawLine);

    const statA = fs.statSync(pair.resolvedA);

    if (fs.existsSync(pair.resolvedB)) {
      const statB = fs.statSync(pair.resolvedB);
      // - check if file A and file B are hardlinks to the same inode if yes, then just skip this line form config.md and move on to next line in config.md
      if (statA.dev === statB.dev && statA.ino === statB.ino) {
        console.log(`   Already linked (inode A: ${statA.ino}, inode B: ${statB.ino})`);
        continue;
      }

      // - if file A and file B are not hardlinks to the same inode then we know from validation phase that contents of file A and file B are the same because we wouldn't reach this point if they were not the same. in that case remove file B and create hardlink from file A to file B
      fs.unlinkSync(pair.resolvedB);
      fs.linkSync(pair.resolvedA, pair.resolvedB);
      const newStatB = fs.statSync(pair.resolvedB);
      console.log(`   ${green}CHANGED${reset}: Replaced file B with hardlink to file A (inode A: ${statA.ino}, inode B: ${newStatB.ino})`);
    } else {
      // if file B doesn't exist:
      // - make sure parent directory of file B exist, if not then create it
      const parentB = path.dirname(pair.resolvedB);
      if (!fs.existsSync(parentB)) {
        fs.mkdirSync(parentB, { recursive: true });
      }
      // - create hardlink from file A to file B
      fs.linkSync(pair.resolvedA, pair.resolvedB);
      const newStatB = fs.statSync(pair.resolvedB);
      console.log(`   ${green}CHANGED${reset}: Created hardlink from file A to file B (inode A: ${statA.ino}, inode B: ${newStatB.ino})`);
    }
  }

  // Gitignore update phase
  if (resolvedGitignore) {
    const gitignoreDir = path.dirname(resolvedGitignore);
    const relPathsToAdd = pairs.map((p) => {
      let rel = path.relative(gitignoreDir, p.resolvedB);
      // normalize Windows backslashes if any to forward slashes for gitignore consistency
      rel = rel.split(path.sep).join("/");
      return rel;
    });

    console.log(`Gitignore check: "${resolvedGitignore}"`);
    const { changed, added } = updateGitignore(resolvedGitignore, relPathsToAdd);
    if (changed) {
      console.log(`   ${green}CHANGED${reset}: Added to gitignore:`);
      for (const entry of added) {
        console.log(`      + ${entry}`);
      }
    } else {
      console.log(`   No changes: all target paths already present in gitignore`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  run(process.argv.slice(2)).catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}

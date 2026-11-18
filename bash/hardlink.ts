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
 *   node bash/hardlink.ts ./path/to/config.md --absolute-symlink-dir   # directory pairs get absolute symlinks
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
 *     - If it exists: must be a file; if same inode as A, skip; must be readable; its parent directory must be writable
 *       (replacing B is a directory operation); must be on the same filesystem as A; content must match file A.
 *     - If it does not exist: parent directory must exist (and be a writable directory) or nearest existing ancestor
 *       must be a writable directory; it must be on the same filesystem as A (hardlinks cannot cross filesystems).
 *
 * Execution phase:
 *   - If same inode, skip.
 *   - If file B exists (and content matches), replace file B atomically with hardlink to A
 *     (link A under temporary name next to B, then rename over B - B is never missing).
 *   - If file B does not exist, ensure parent directory exists and create hardlink from A to B.
 *   - Update .gitignore if --gitignore was specified.
 *
 * Directory pairs (path A ends with "/", e.g. "./lib/ -> ./bin/lib"):
 *   - Hardlinks to directories are not possible, so path B becomes a symlink to directory A.
 *   - Symlink target is relative to the directory of B by default, absolute with --absolute-symlink-dir.
 *   - Validation: A must be an existing directory; B must be missing (parent checks as for files),
 *     or a symlink resolving to A. B pointing elsewhere, B being a real directory or a file -> error.
 *   - Execution: create symlink (creating parent dirs), skip when symlink is exactly as expected,
 *     replace atomically when it resolves to A but in other form (relative vs absolute).
 *   - --gitignore adds B like for files (no trailing "/" - git sees symlink as a file, "link/" would not match it).
 *   - --unlink skips directory pairs.
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
  // true when path A ends with "/" - pair of directories, B becomes symlink to A
  isDir: boolean;
  // only for directory pairs: what symlink B should contain (relative or absolute path to A)
  symlinkTarget: string;
}

export interface CliOptions {
  configFile?: string;
  pwdOverride?: string;
  useCwd?: boolean;
  gitignorePath?: string;
  unlink?: boolean;
  absoluteSymlinkDir?: boolean;
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
  --unlink                  Unlink existing hardlinked pairs (cannot be used with --gitignore)
                            (directory pairs are skipped)
  --absolute-symlink-dir    Directory pairs: create symlinks with absolute target path
                            (default: target relative to the directory of symlink B)
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

Directory pairs:
  When path A ends with "/" the pair links directories. Directory hardlinks are not possible,
  so path B becomes a symlink to directory A:
    [lib dir](./lib/) -> [link](./bin/lib)
    ./lib/ -> ./bin/lib
  - A must be an existing directory
  - B must be missing (symlink is created) or already a symlink resolving to A
    (if its form differs - relative vs absolute - it is replaced)
  - B pointing elsewhere, B being a real directory or a file -> error (nothing is changed)
  - path B ending with "/" while path A doesn't -> error
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
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
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
    } else if (arg === "--unlink") {
      options.unlink = true;
    } else if (arg === "--absolute-symlink-dir") {
      options.absoluteSymlinkDir = true;
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
export function resolveBaseDir(configFilePath: string, options: CliOptions): { baseDir: string; reason: string } {
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
 * Find nearest existing ancestor of given path (the path itself if it exists).
 * Used to validate the place where file B will land when its parent directories still have to be created
 * (that ancestor has to be a writable directory and has to be on the same filesystem as file A).
 */
function findExistingAncestor(p: string): string {
  let curr = path.resolve(p);
  while (!fs.existsSync(curr) && curr !== path.dirname(curr)) {
    curr = path.dirname(curr);
  }
  return curr;
}

// lstat (does not follow symlinks) returning null when nothing exists under the path
function lstatOrNull(p: string): fs.Stats | null {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

/**
 * Validate the place where missing path B will be created (shared by file and directory pairs).
 * statA given -> also check B lands on the same filesystem as A (needed for hardlinks).
 * statA null  -> skip filesystem check (symlinks can cross filesystems).
 * Returns error message or null when all good.
 */
function validateMissingBParent(resolvedB: string, statA: fs.Stats | null): string | null {
  const parentB = path.dirname(resolvedB);

  // - check if parent directory of file B exist
  //   ancestor === parentB when parent exists, otherwise it is the first existing path above it
  const ancestor = findExistingAncestor(parentB);
  const statAncestor = fs.statSync(ancestor);

  // - parent (or nearest existing ancestor) has to be a directory - if it is a file then neither mkdir nor link can succeed
  if (!statAncestor.isDirectory()) {
    return `Parent path "${ancestor}" is not a directory`;
  }

  if (ancestor === parentB) {
    // - check if parent directory of file B is writable (if I have rights to create new hardlink in this directory)
    if (!isWritable(parentB)) {
      return `Parent directory "${parentB}" is not writable`;
    }
  } else {
    // if directory doesn't exist then check if we have rights to create it
    if (!isWritable(ancestor)) {
      return `Cannot create parent directory for "${resolvedB}": Directory "${ancestor}" is not writable.`;
    }
  }

  // - hardlinks cannot cross filesystems - file B will land on the filesystem of its nearest existing ancestor
  if (statA !== null && statAncestor.dev !== statA.dev) {
    return `File A and file B are on different filesystems (hardlinks cannot cross filesystems): file B would land on "${ancestor}"`;
  }

  return null;
}

/**
 * Replace path B atomically: create new entry under temporary name next to B (via create callback)
 * and rename it over B. rename is atomic, so B is never missing even if something fails midway.
 */
function replaceAtomically(resolvedB: string, create: (tmpB: string) => void): void {
  const tmpB = `${resolvedB}.hardlink_tmp_${process.pid}`;
  fs.rmSync(tmpB, { force: true });
  create(tmpB);
  try {
    fs.renameSync(tmpB, resolvedB);
  } catch (err) {
    fs.rmSync(tmpB, { force: true });
    throw err;
  }
}

/**
 * Validation of directory pair (path A ends with "/").
 * Directory A has to exist, path B has to be missing (symlink will be created)
 * or be a symlink resolving to directory A.
 * Returns error message (already formatted with "Directory A"/"Symlink B" header) or null when all good.
 */
function validateDirPair(pair: ParsedPair): string | null {
  const errA = (msg: string) => `Directory A [${pair.rawA}] error:\n   ${msg}`;
  const errB = (msg: string) => `Symlink B [${pair.rawB}] error:\n   ${msg}`;

  // - directory A has to exist
  if (!fs.existsSync(pair.resolvedA)) {
    return errA(`Directory does not exist: "${pair.resolvedA}"`);
  }

  // - thing under path A has to be a directory (trailing "/" in config.md promises that)
  if (!fs.statSync(pair.resolvedA).isDirectory()) {
    return errA(`Path is not a directory (path A ends with "/"): "${pair.resolvedA}"`);
  }

  const lstatB = lstatOrNull(pair.resolvedB);

  // - path B doesn't exist: symlink will be created, check its parent (no filesystem check - symlinks can cross filesystems)
  if (lstatB === null) {
    const parentError = validateMissingBParent(pair.resolvedB, null);
    if (parentError === null) {
      return null;
    }
    return errB(parentError);
  }

  if (lstatB.isSymbolicLink()) {
    const current = fs.readlinkSync(pair.resolvedB);

    // - symlink B points exactly where it should - all is good, skip
    if (current === pair.symlinkTarget) {
      return null;
    }

    // - symlink B resolves to directory A but in different form (relative vs absolute, e.g. after toggling --absolute-symlink-dir)
    //   it will be replaced, so parent directory has to be writable
    if (path.resolve(path.dirname(pair.resolvedB), current) === pair.resolvedA) {
      const parentB = path.dirname(pair.resolvedB);
      if (isWritable(parentB)) {
        return null;
      }
      return errB(`Parent directory "${parentB}" is not writable (needed to replace symlink B)`);
    }

    // - symlink B points somewhere else - don't touch it, operator has to decide
    return errB(
      `Symlink points to "${current}" but expected "${pair.symlinkTarget}" (directory A: "${pair.resolvedA}")`
    );
  }

  // - path B is a real directory - we have no way to compare it with directory A
  if (lstatB.isDirectory()) {
    return errB(
      `Path is a real directory, not a symlink - no way to compare it with directory A, remove it manually if it should become a symlink: "${pair.resolvedB}"`
    );
  }

  // - anything else under path B (regular file, socket, ...)
  return errB(`Path exists but is not a symlink: "${pair.resolvedB}"`);
}

/**
 * Execution of directory pair. Validation phase guarantees path B is missing
 * or is a symlink resolving to directory A.
 *   - B missing                      -> create parent dirs and symlink
 *   - B exactly as expected          -> skip
 *   - B resolves to A in other form  -> replace atomically
 * Prints final proof: where B resolves to vs directory A.
 */
function executeDirPair(pair: ParsedPair, changedLabel: string): void {
  const lstatB = lstatOrNull(pair.resolvedB);

  if (lstatB === null) {
    // - make sure parent directory of symlink B exist, if not then create it
    fs.mkdirSync(path.dirname(pair.resolvedB), { recursive: true });
    // - create symlink B -> A
    fs.symlinkSync(pair.symlinkTarget, pair.resolvedB, "dir");
    console.log(`   ${changedLabel}: Created symlink B -> "${pair.symlinkTarget}"`);
  } else {
    const current = fs.readlinkSync(pair.resolvedB);
    if (current === pair.symlinkTarget) {
      console.log(`   Already linked (symlink B -> "${current}")`);
    } else {
      // - symlink resolves to A but has different form - replace it atomically
      replaceAtomically(pair.resolvedB, (tmpB) => fs.symlinkSync(pair.symlinkTarget, tmpB, "dir"));
      console.log(`   ${changedLabel}: Replaced symlink B "${current}" -> "${pair.symlinkTarget}"`);
    }
  }

  console.log(
    `   (B resolves to: ${fs.realpathSync(pair.resolvedB)}, directory A: ${fs.realpathSync(pair.resolvedA)})`
  );
}

/**
 * Parse config file lines into pairs of paths
 */
export function parseConfigFile(content: string, baseDir: string, absoluteSymlinkDir = false): ParsedPair[] {
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

      // path A ending with "/" marks pair of directories (path.resolve above already stripped that "/")
      const isDir = rawA.endsWith("/");

      // symlink content for directory pairs: absolute path to A, or path to A relative to the directory of B
      let symlinkTarget = "";
      if (isDir) {
        symlinkTarget = absoluteSymlinkDir ? resolvedA : path.relative(path.dirname(resolvedB), resolvedA) || ".";
      }

      pairs.push({
        rawLine: line,
        rawA,
        rawB,
        resolvedA,
        resolvedB,
        isDir,
        symlinkTarget,
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

  if (options.unlink && options.gitignorePath) {
    console.error("Error: --unlink flag cannot be used together with --gitignore flag.");
    process.exit(1);
  }

  const rawConfigPath = options.configFile;
  const configPath = path.resolve(process.cwd(), expandHome(rawConfigPath));

  // Determine resolution base directory
  const { baseDir, reason } = resolveBaseDir(rawConfigPath, options);
  console.log(`Resolved paths relative to: ${baseDir} (reason: ${reason})`);

  // Check if --gitignore exists immediately after determining base directory
  let resolvedGitignore: string | undefined;
  if (options.gitignorePath) {
    resolvedGitignore = path.resolve(process.cwd(), expandHome(options.gitignorePath));
    if (!fs.existsSync(resolvedGitignore)) {
      console.error(`Error: Gitignore file "${options.gitignorePath}" does not exist: "${resolvedGitignore}"`);
      process.exit(1);
    }
    const gitignoreStat = fs.statSync(resolvedGitignore);
    if (!gitignoreStat.isFile()) {
      console.error(`Error: Gitignore path "${options.gitignorePath}" is not a file: "${resolvedGitignore}"`);
      process.exit(1);
    }
    if (!isWritable(resolvedGitignore)) {
      console.error(`Error: Gitignore file "${resolvedGitignore}" is not writable.`);
      process.exit(1);
    }
  }

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

  const content = fs.readFileSync(configPath, "utf-8");
  const pairs = parseConfigFile(content, baseDir, options.absoluteSymlinkDir === true);

  const isTTY = process.stdout.isTTY;
  const green = isTTY ? "\x1b[32m" : "";
  const reset = isTTY ? "\x1b[0m" : "";

  // # unlink mode
  if (options.unlink) {
    for (const pair of pairs) {
      // directory pairs (symlinks) are not handled by --unlink - skip them
      if (pair.isDir) {
        continue;
      }

      // Check if both file A and file B exist
      if (!fs.existsSync(pair.resolvedA) || !fs.existsSync(pair.resolvedB)) {
        continue;
      }

      let statA: fs.Stats;
      let statB: fs.Stats;
      try {
        statA = fs.statSync(pair.resolvedA);
        statB = fs.statSync(pair.resolvedB);
      } catch {
        continue;
      }

      // Check both are regular files
      if (!statA.isFile() || !statB.isFile()) {
        continue;
      }

      // Check if they are hardlinks to the same inode
      if (statA.dev === statB.dev && statA.ino === statB.ino) {
        try {
          const tempPath = `${pair.resolvedB}.unlink_tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          fs.copyFileSync(pair.resolvedA, tempPath);
          fs.unlinkSync(pair.resolvedB);
          fs.renameSync(tempPath, pair.resolvedB);
          const newStatB = fs.statSync(pair.resolvedB);
          console.log(`\n${pair.rawLine}`);
          console.log(
            `   ${green}UNLINKED${reset}: Disconnected hardlink, preserved independent file B (inode A: ${statA.ino}, inode B: ${newStatB.ino})`
          );
        } catch (err) {
          console.error(`Error unlinking "${pair.resolvedB}": ${(err as Error).message}`);
        }
      }
    }
    return;
  }

  // # validation phase
  const errors: string[] = [];

  for (const pair of pairs) {
    // directory pair (path A ends with "/") - path B has to be (or become) a symlink to directory A
    if (pair.isDir) {
      const dirError = validateDirPair(pair);
      if (dirError !== null) {
        errors.push(dirError);
      }
      continue;
    }

    // - path B ends with "/" (directory) but path A doesn't - mixed pair, most likely "/" is missing at the end of path A
    if (pair.rawB.endsWith("/")) {
      errors.push(
        `File B [${pair.rawB}] error:\n   Path B ends with "/" (directory) but path A doesn't - add "/" to the end of path A to link directories`
      );
      continue;
    }

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
      //   removing/replacing file B is an operation on its parent directory, so it is the parent directory
      //   which has to be writable - write permission on file B itself doesn't matter
      const parentOfB = path.dirname(pair.resolvedB);
      if (!isWritable(parentOfB)) {
        errors.push(
          `File B [${pair.rawB}] error:\n   Parent directory "${parentOfB}" is not writable (needed to replace file B)`
        );
        continue;
      }

      // - hardlinks cannot cross filesystems - check it upfront so file B is never touched when linking would fail anyway
      if (statA.dev !== statB.dev) {
        errors.push(
          `File B [${pair.rawB}] error:\n   File A and file B are on different filesystems (hardlinks cannot cross filesystems): "${pair.resolvedA}" vs "${pair.resolvedB}"`
        );
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
      //   parent directory checks (exists / is directory / writable / can be created / same filesystem as A)
      //   live in validateMissingBParent() since directory pairs use them too
      const parentError = validateMissingBParent(pair.resolvedB, statA);
      if (parentError !== null) {
        errors.push(`File B [${pair.rawB}] error:\n   ${parentError}`);
        continue;
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
  for (const pair of pairs) {
    console.log(`\n${pair.rawLine}`);

    // directory pair - symlink B -> A
    if (pair.isDir) {
      executeDirPair(pair, `${green}CHANGED${reset}`);
      continue;
    }

    const statA = fs.statSync(pair.resolvedA);

    if (fs.existsSync(pair.resolvedB)) {
      const statB = fs.statSync(pair.resolvedB);
      // - check if file A and file B are hardlinks to the same inode if yes, then just skip this line form config.md and move on to next line in config.md
      if (statA.dev === statB.dev && statA.ino === statB.ino) {
        console.log(`   Already linked (inode A: ${statA.ino}, inode B: ${statB.ino})`);
        continue;
      }

      // - if file A and file B are not hardlinks to the same inode then we know from validation phase that contents of file A and file B are the same because we wouldn't reach this point if they were not the same. in that case remove file B and create hardlink from file A to file B
      /**
       * Replace atomically: hardlink A under temporary name next to B and rename it over B.
       * rename is atomic, so B is never missing even if something fails midway
       * (unlink B + link A -> B would leave B removed when link fails).
       */
      replaceAtomically(pair.resolvedB, (tmpB) => fs.linkSync(pair.resolvedA, tmpB));
      const newStatB = fs.statSync(pair.resolvedB);
      console.log(
        `   ${green}CHANGED${reset}: Replaced file B with hardlink to file A (inode A: ${statA.ino}, inode B: ${newStatB.ino})`
      );
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
      console.log(
        `   ${green}CHANGED${reset}: Created hardlink from file A to file B (inode A: ${statA.ino}, inode B: ${newStatB.ino})`
      );
    }
  }

  // Gitignore update phase
  if (resolvedGitignore) {
    const gitignoreDir = path.dirname(resolvedGitignore);
    const relPathsToAdd = pairs.map((p) => {
      // for directory pairs B is a symlink - no trailing "/" on purpose, git sees symlink as a file and "link/" would not match it
      let rel = path.relative(gitignoreDir, p.resolvedB);
      // normalize Windows backslashes if any to forward slashes for gitignore consistency
      rel = rel.split(path.sep).join("/");
      return rel;
    });

    console.log(`\nGitignore check: "${resolvedGitignore}"`);
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

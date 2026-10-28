/*!
 * First look into the top comment of
 * scripts/sync/transform.ts
 *
 * That script transforms fswatch output like:
 *
 *   /path/to/scripts/sync/transform.ts AttributeModified,IsFile,Updated
 *   /path/to/lab/ui/types.sh AttributeModified,IsFile,Updated
 *   /path/to/lab/ui/pnpm-lock.yaml AttributeModified,IsFile,Updated
 *   /path/to/lab/ui/log.log Created,IsFile
 *
 * into:
 *
 *   update scripts/sync/transform.ts
 *   update lab/ui/types.sh
 *   update lab/ui/pnpm-lock.yaml
 *   create lab/ui/log.log
 *
 * This script then applies gitignore rules from the specified ignore file.
 *
 * For example, assuming .myignore ignores:
 *
 *   lab/ui/types.sh
 *   lab/ui/pnpm-lock.yaml
 *
 * we pipe the output of transform.ts to this script:
 *
 *   .... | NODE_OPTIONS= node scripts/sync/transform.ts \
 *     | NODE_OPTIONS= node scripts/sync/filter-gitignored.ts .syncignore \
      > >(sed 's/^/[stdout] /') \
      2> >(sed 's/^/[stderr] /' >&2)
 *
 * and get the following output.
 *
 * stdout:
 *
 *   update scripts/sync/transform.ts
 *   create lab/ui/log.log
 *
 * stderr:
 *
 *   ignored lab/ui/types.sh
 *   ignored lab/ui/pnpm-lock.yaml
 * 
 * So generally use it like this:
  fswatch -r -x --event-flag-separator=, . |
  NODE_OPTIONS= node scripts/sync/transform.ts | NODE_OPTIONS= node scripts/sync/filter-gitignored.ts .syncignore \
      > >(sed 's/^/[stdout] /') \
      2> >(sed 's/^/[stderr] /' >&2)
 */

import fs from "fs";
import readline from "readline";
import gitignoreParser from "gitignore-parser";

const gitignorePath = process.argv[2];

// Handle EPIPE error (e.g. when piping to head)
process.stdout.on("error", (err: any) => {
  if (err.code === "EPIPE") process.exit(0);
});

// 1. Help / Validation
if (!gitignorePath || process.stdin.isTTY) {
  console.error(
    "Usage: fswatch ... | node filter-gitignored.ts <path_to_gitignore>",
  );
  process.exit(1);
}

if (!fs.existsSync(gitignorePath)) {
  console.error(
    `filter-gitignored.ts error: ignore file not found: ${gitignorePath}`,
  );
  process.exit(1);
}

// 2. Initialize ignore library
let ig: any;

try {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  ig = gitignoreParser.compile(gitignoreContent);
} catch (e: any) {
  console.error(
    `filter-gitignored.ts error: failed to read or parse ignore file: ${e.message}`,
  );
  process.exit(1);
}

// 3. Process stdin line by line
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Split the event action from the file path.
  // Example: "update lab/ui/types.sh"
  const match = trimmed.match(/^(\S+)\s+(.+)$/);

  if (!match) {
    // Preserve lines that do not match the expected format.
    process.stdout.write(trimmed + "\n");
    return;
  }

  const [, action, rawPath] = match;

  // Strip leading ./ if present
  const cleanPath = rawPath.replace(/^\.\//, "");

  if (ig.accepts(cleanPath)) {
    process.stdout.write(`${action} ${cleanPath}\n`);
  } else {
    process.stderr.write(`ignored ${cleanPath}\n`);
  }
});

rl.on("close", () => {
  process.exit(0);
});

/**
 * Implementation of the technique called
 * "progressive path disambiguation" or "contextual path shortening".
 *
 * Reads list of paths from stdin (one per line) and for each prints the shortest
 * tail of the path which is still unique in the whole list.
 * Created for pages/ai/ai_report.sh (linkrepo) - short labels are shown in the picker
 * and are used as names of links, original paths are used as targets of links.
 *
 * Output: one line per unique input path, two columns separated by TAB:
 *   [original path][TAB][shortened path]
 *
 * Steps:
 *   1. every path starts with its last segment only (basename)
 *   2. paths with not unique label get one more parent segment
 *   3. label which is also a parent directory of other label gets one more segment too
 *      ("abc" and "abc/cde" can't be both created as links on disk)
 *   4. repeat 2 and 3 until nothing changes
 *
 * Example:
 *   printf '/w/a/api\n/w/b/api\n/w/web\n' | NODE_OPTIONS= node bash/file/progressivePaths.ts
 *     /w/a/api    a/api
 *     /w/b/api    b/api
 *     /w/web      web
 *
 * In bash:
 *   while IFS=$'\t' read -r ORIGINAL SHORT; do ... done <<< "${PAIRS}"
 */

import fs from "node:fs";

interface Item {
  original: string;
  parts: string[];
  depth: number;
}

// label = last "depth" segments of the path
function label(item: Item): string {
  return item.parts.slice(-item.depth).join("/");
}

const lines = fs
  .readFileSync(0, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const items: Item[] = [...new Set(lines)]
  .map((original) => ({ original, parts: original.split("/").filter((p) => p.length > 0), depth: 1 }))
  .filter((item) => item.parts.length > 0);

let changed = true;

while (changed) {
  changed = false;

  const count = new Map<string, number>();

  // all proper parent directories of all labels: for "a/b/c" these are "a" and "a/b"
  const ancestors = new Set<string>();

  for (const item of items) {
    const l = label(item);

    count.set(l, (count.get(l) || 0) + 1);

    const parts = l.split("/");

    for (let i = 1; i < parts.length; i++) {
      ancestors.add(parts.slice(0, i).join("/"));
    }
  }

  for (const item of items) {
    const l = label(item);

    const conflict = (count.get(l) || 0) > 1 || ancestors.has(l);

    if (conflict && item.depth < item.parts.length) {
      item.depth += 1;

      changed = true;
    }
  }
}

process.stdout.write(items.map((item) => `${item.original}\t${label(item)}\n`).join(""));

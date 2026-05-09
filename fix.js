// fix.ts
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
var rl = createInterface({
  input: process.stdin,
  terminal: false,
});
rl.on("line", (line) => {
  const filePath = line.trim();
  if (!filePath) return;
  try {
    let content = readFileSync(filePath, "utf8");
    let changed = false;
    content = content.replace(/\/dist\/([^"]+)\.bundle\.js/g, (match, name) => {
      if (name.endsWith(".entry")) {
        return match;
      }
      changed = true;
      return `/dist/${name}.entry.bundle.js`;
    });
    content = content.replace(/\/dist\/([^"]+)\.bundle\.css/g, (match, name) => {
      if (name.endsWith(".entry")) {
        return match;
      }
      changed = true;
      return `/dist/${name}.entry.bundle.css`;
    });
    if (changed) {
      writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
});

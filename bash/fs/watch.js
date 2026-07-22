import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(process.argv[2] ?? ".");
let __filename = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(path.dirname(path.dirname(__filename)));
__filename = path.relative(projectRoot, __filename);
const debug = process.argv.includes("--debug");
if (debug) {
  console.log(`${__filename} watching: ${root}`);
}
const watcher = fs.watch(
  root,
  {
    recursive: true,
  },
  (_event, filename) => {
    if (!filename) {
      return;
    }
    console.log(filename.toString());
    watcher.close();
    process.exit(0);
  }
);
process.on("SIGINT", () => {
  watcher.close();
  process.exit(130);
});

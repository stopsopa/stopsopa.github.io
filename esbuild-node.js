// used by esbuild-node.sh

import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

const log = (...args) => console.log("esbuild-node.js:", ...args);

const file = process.argv[2];

const th = (msg) => new Error(`esbuild-node.js error: ${msg}`);

if (typeof file !== "string" || !file.trim()) {
  throw th(`file is not provided`);
}

if (!fs.existsSync(file)) {
  throw th(`file >${file}< doesn't exist`);
}

const content = fs.readFileSync(file, "utf8").toString();

log(`>${content}<`);

const entryPoints = content
  .split("\n")
  .map((t) => t.trim())
  .filter(Boolean)
  .map((t) => path.resolve(t));

log("entryPoints", entryPoints);

let renameFiles = entryPoints.map((t) => {
  const p = t.match(/^(.*?)\.([mc]{0,1}js)$/);
  return {
    source: `${p[1]}.bundled.gitignored.js`,
    target: `${p[1]}.bundled.gitignored.${p[2]}`,
  };
});

log("renameFiles", renameFiles);

const watch = process.argv.includes("--watch");

function watchFiles(watch) {
  log("watchFiles");
  renameFiles.forEach((r) => {
    function go() {
      const copy = r.source !== r.target;
      log(`${copy ? "COPY" : "NOT COPY"} ${r.target}`);
      if (copy) {
        fs.copyFile(r.source, r.target, (err) => {
          if (err) {
            log(`refresh error:`, err);
          }
        });
      }
    }
    if (watch) {
      fs.watch(r.source, go);
    }

    go();
  });
}

// Define a list of packages that need special handling
const problematicPackages = [
  // Node.js built-ins
  "node:*",
  "tty",
  "fs",
  "path",
  "util",
  "events",
  "stream",
  "os",
  "crypto",
  "buffer",
  "assert",
  "url",
  "http",
  "https",
  "zlib",
  "querystring",
  "net",
  "dns",
  "tls",
  "readline",
  "module",

  // Problematic packages
  "yoctocolors-cjs",
  "cli-width",
  "@inquirer/*",
];

log("Using esbuild for bundling");
let ctx = await esbuild[watch ? "context" : "build"]({
  entryPoints,
  bundle: true,
  outdir: ".",
  outbase: ".",
  entryNames: "[dir]/[name].bundled.gitignored", // https://esbuild.github.io/api/#entry-names

  platform: "node",
  target: "node24.3.0",
  format: "esm", // Ensure output is in native ESM format

  // Mark problematic modules as external
  external: problematicPackages,

  // Ensure proper handling of dynamic imports
  mainFields: ["module", "main"],

  // Avoid injecting Node.js polyfills
  inject: [],

  // Allow default exports from CJS modules
  allowOverwrite: true,

  // More detailed error logging for debugging
  logLevel: "warning",
  logOverride: {
    // more about logOverride: https://github.com/evanw/esbuild/releases/tag/v0.14.42
    "direct-eval": "silent", // require('core-js/actual/structured-clone'); to stop error: [WARNING] Using direct eval with a bundler is not recommended and may cause problems [direct-eval]
  },
});

log("exbuilddone1");

if (watch) {
  log(`watch mode: ${watch}`, ctx);
  ctx.watch(); //https://esbuild.github.io/api/#serve-proxy

  setTimeout(() => watchFiles(true), 1000);
} else {
  log(`no watch mode: ${watch}`, ctx);
  watchFiles(false);
}

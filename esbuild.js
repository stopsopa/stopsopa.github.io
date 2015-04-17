import * as esbuild from "esbuild";

import fs from "fs";

import path from "path";

const log = (...args) => console.log("esbuild.js:", ...args);

const file = process.argv[2];

const th = (msg) => new Error(`esbuild.js error: ${msg}`);

if (typeof file !== "string" || !file.trim()) {
  throw th(`file is not provided`);
}

if (!fs.existsSync(file)) {
  throw th(`file >${file}< doesn't exist`);
}

const w = Boolean(process.argv[3]); // watch

const content = fs.readFileSync(file, "utf8").toString();

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

let ctx = await esbuild[w ? "context" : "build"]({
  entryPoints,
  bundle: true,
  outdir: ".",
  outbase: ".",
  entryNames: "[dir]/[name].bundled.gitignored", // https://esbuild.github.io/api/#entry-names

  platform: "node",
  target: "node12.16.3",

  logLevel: "info",
  logOverride: {
    // more about logOverride: https://github.com/evanw/esbuild/releases/tag/v0.14.42
    "direct-eval": "silent", // require('core-js/actual/structured-clone'); to stop error: [WARNING] Using direct eval with a bundler is not recommended and may cause problems [direct-eval]
  },
});

if (w) {
  log(`watch mode: ${w}`, ctx);
  ctx.watch(); //https://esbuild.github.io/api/#serve-proxy

  setTimeout(() => watchFiles(true), 1000);
} else {
  log(`no watch mode: ${w}`, ctx);
  watchFiles(false);
}

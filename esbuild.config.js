// For transpiling all "/**/*.entry.{js,jsx}" files
// for react pages mainly

import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { sassPlugin } from "esbuild-sass-plugin";
import utils from "./libs/utils.js";

const log = (...args) => console.log("esbuild.config.js:", ...args);

const root = path.dirname("");

const app = path.resolve(root, "pages");

utils.setup({
  js: {
    entries: [app],
  },
});

const entryPoints = await utils.entries();

log("entryPoints", entryPoints);

const watch = process.argv.includes("--watch");

let ctx = await esbuild[watch ? "context" : "build"]({
  entryPoints,
  outdir: "dist",
  bundle: true,
  minify: false,
  sourcemap: true,
  target: "esnext",
  plugins: [sassPlugin()],
  loader: {
    ".js": "jsx",
    ".jsx": "jsx",
    ".scss": "css",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  entryNames: "[name].bundle",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
});

log("exbuilddone2");

if (watch) {
  log(`watch mode: ${watch}`, ctx);
  ctx.watch(); //https://esbuild.github.io/api/#serve-proxy
} else {
  log(`no watch mode: ${watch}`, ctx);
}

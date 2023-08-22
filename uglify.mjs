/**
 * Read more: https://github.com/maxmilton/esbuild-minify-templates
 *
 * I'm using it because uglify.js was messing up argument preferCurrentTab in
 * pages/bookmarklets/periscope.uglify.min.old.js
 *
 * so I've switched from uglify.js to esbuild
 * 
 * but esbuild natively is not comporessing template strings
 */

import esbuild from "esbuild";

import { minifyTemplates, writeFiles } from "esbuild-minify-templates";

import fs from "fs";

const args = (function (obj, tmp) {
  process.argv.slice(2).map((a) => {
    if (a.indexOf("--") === 0) {
      tmp = a.substring(2).replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");

      if (tmp) {
        obj[tmp] = typeof obj[tmp] === "undefined" ? true : obj[tmp];
      }

      return;
    }

    if (a === "true") {
      a = true;
    }

    if (a === "false") {
      a = false;
    }

    if (tmp !== null) {
      if (obj[tmp] === true) {
        return (obj[tmp] = [a]);
      }

      try {
        obj[tmp].push(a);
      } catch (e) {}
    }
  });

  Object.keys(obj).map((k) => {
    obj[k] !== true && obj[k].length === 1 && (obj[k] = obj[k][0]);
    obj[k] === "false" && (obj[k] = false);
  });

  return {
    count: () => Object.keys(obj).length,
    all: () => JSON.parse(JSON.stringify(obj)),
    get: (key, def) => {
      var t = JSON.parse(JSON.stringify(obj));

      if (typeof def === "undefined") return t[key];

      return typeof t[key] === "undefined" ? def : t[key];
    },
    string: (key, def) => {
      var t = JSON.parse(JSON.stringify(obj));

      return typeof t[key] === "string" ? t[key] : def;
    },
  };
})({});

const input = args.get("input");

const output = args.get("output");

const th = (msg) => new Error(`uglify.mjs error: ${msg}`);

if (!input) {
  throw th(`--input not specified`);
}
if (!output) {
  throw th(`--output not specified`);
}

if (!fs.existsSync(input)) {
  throw th(`--input file >${input}< doesn't exist`);
}

await esbuild.build({
  entryPoints: [input],
  outfile: output,
  minify: true,
  plugins: [minifyTemplates(), writeFiles()], // <--
  bundle: true,
  sourcemap: false,
  write: false, // <-- important!
});

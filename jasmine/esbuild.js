// find . -type f \( -name '*.jasmine.unit.js' -o -name '*.jasmine.js' \) | node jasmine/esbuild.js

// find . -type f \( -name '*.jasmine.unit.js' -o -name '*.jasmine.js' \) | node jasmine/esbuild.js watch

// find . \( -type d -name node_modules -prune -o -type d -name .git -prune -o -type d -name coverage -prune \) -o -type f \( -name '*.jasmine.unit.js' -o -name '*.jasmine.js' \) -print | node jasmine/esbuild.js

// echo ./tests/nlab/each.jasmine.unit.js | node jasmine/esbuild.js

// esbuild@0.19.12
// const readline = require("readline");
import readline from "readline";

// const esbuild = require("esbuild");
import esbuild from "esbuild";

function promiseStdin() {
  return new Promise((resolve, reject) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    let buff = "";

    rl.on("line", (line) => {
      if (buff !== "") {
        buff += "\n";
      }
      buff += line; // Append a newline character to each line
    });

    rl.on("close", () => {
      resolve(buff);
    });
  });
}

(async function () {
  const data = await promiseStdin();

  const entryPoints = data.split("\n");

  const config = {
    entryPoints,
    entryNames: "[dir]/[name].jasmine-esbuild", // Ensures unique output file names by appending a hash
    outdir: ".",
    bundle: true,
    target: "chrome80", // Updated target to chrome80
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    loader: { ".js": "jsx" },
    metafile: true,
    allowOverwrite: true, // Added allowOverwrite option
  };

  if (typeof process.argv[2] === "string") {
    if (process.argv[2] !== "watch") {
      console.log('invalid argument - should be "watch"');

      process.exit(1);
    }

    let ctx = await esbuild.context(config);

    await ctx.watch();

    console.log("watching...");
  } else {
    try {
      const result = await esbuild.build(config);

      const stats = await esbuild.analyzeMetafile(result.metafile, {
        verbose: true,
      });

      console.log(stats);

      console.log("finished building");
    } catch (e) {
      console.error(`general esbuild error: ${e}`);

      process.exit(1);
    }
  }
})();

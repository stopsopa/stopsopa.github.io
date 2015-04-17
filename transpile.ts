/**
 * see TRANSPILATION.md
 */
import * as esbuild from "esbuild";
import readline from "readline";
import path from "path";
// import fs from "node:fs/promises";
// import { filenameRelative } from "./root.ts";

// const relativeFilename = filenameRelative(import.meta.url);

const cleanStdout = process.argv.includes("--forward-stdin-to-stdout");

const log = (...args: any) => {
  if (!cleanStdout) {
    console.log("transpile.ts:", ...args);
  }
};

const watch = process.argv.includes("--watch");

async function getEntryPointsFromStdin(): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const entries: string[] = [];
  for await (const line of rl) {
    const trimmed = line.trim().replace(/^\.\//, "");
    if (trimmed) {
      entries.push(trimmed);
    }
  }
  return entries;
}

const entryPoints = await getEntryPointsFromStdin();
log("Entry points count:", entryPoints.length);

if (entryPoints.length === 0) {
  log("No entry points found. Exiting.");
  process.exit(0);
}

/**
 * This is specially formatted for transpile_prettier_pipe.ts
 */
if (!cleanStdout) {
  const buff = [...entryPoints];
  buff.unshift("");
  const files = buff.join("\ntranspiled ");

  console.log(`

${files}

`);
}

const options: esbuild.BuildOptions = {
  entryPoints,
  bundle: false,
  outdir: ".",
  outbase: ".",
  entryNames: "[dir]/[name]",
  allowOverwrite: true,
  platform: "node",
  format: "esm",
  target: "node20",
  logLevel: "warning",
  logOverride: {
    "direct-eval": "silent",
  },
  plugins: [
    {
      name: "watch-reporter",
      setup(build) {
        let processedFiles = new Set<string>();

        build.onLoad({ filter: /\.ts$/ }, (args) => {
          processedFiles.add(path.relative(process.cwd(), args.path));
          return undefined;
        });

        build.onEnd((result) => {
          if (result.errors.length > 0) {
            if (!cleanStdout) {
              console.error("transpile.ts: errors:", result.errors);
            }

            return;
          }

          processedFiles.forEach((file) => {
            const outputFile = file.replace(/\.ts$/, ".js");

            if (cleanStdout) {
              console.log(outputFile);
            } else {
              console.log(`transpiled ${outputFile}`);
            }
          });

          processedFiles.clear();
        });
      },
    },
    //     {
    //    INFO: now this is done with bash/node/preamble.ts
    //    INFO: now this is done with bash/node/preamble.ts
    //    INFO: now this is done with bash/node/preamble.ts
    //    INFO: now this is done with bash/node/preamble.ts
    //    INFO: now this is done with bash/node/preamble.ts
    //       name: "transpilation-banner",
    //       setup(build) {
    //         build.onEnd(async (result) => {
    //           if (result.errors.length > 0) {
    //             return;
    //           }

    //           await Promise.all(
    //             entryPoints.map(async (tsFile) => {
    //               const jsFile = tsFile.replace(/\.ts$/, ".js");

    //               const source = await fs.readFile(jsFile, "utf8");

    //               const banner = `/**
    //  * =================
    //  * Transpiled with ${relativeFilename}
    //  * =================
    //  */
    // `;

    //               const updated = source.startsWith("#!") ? source.replace(/^([^\n]*\n)/, `$1${banner}`) : banner + source;

    //               await fs.writeFile(jsFile, updated);
    //             })
    //           );
    //         });
    //       },
    //     },
  ],
};

if (watch) {
  const ctx = await esbuild.context(options);
  log(`watch mode: ON`);
  await ctx.watch();
} else {
  const result = await esbuild.build(options);

  if (result.errors.length > 0) {
    if (!cleanStdout) {
      console.error("transpile.ts: build failed", result.errors);
    }

    process.exitCode = 1;
  } else {
    log(`no watch mode: DONE`);
  }
}

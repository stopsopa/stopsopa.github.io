/**
 * see TRANSPILATION.md
 */
import * as esbuild from "esbuild";
import readline from "readline";
import path from "path";

const log = (...args: any) => console.log("transpile.ts:", ...args);

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
 * This is specially formatted for transpile_pipe.ts
 */
const buff = [...entryPoints];
buff.unshift('');
const files = buff.join("\ntranspiled ");

console.log(`

${files}

`)

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
          if (result.errors.length > 0) return;
          processedFiles.forEach((file) => console.log(`transpiled ${file}`));
          processedFiles.clear();
        });
      },
    },
  ],
};

if (watch) {
  const ctx = await esbuild.context(options);
  log(`watch mode: ON`);
  await ctx.watch();
} else {
  const result = await esbuild.build(options);
  log(`no watch mode: DONE`);
}

import * as esbuild from "esbuild";
import fs from "fs";
import gitignore from "gitignore-parser";
import readline from "readline";

const log = (...args: any) => console.log("transpile.ts:", ...args);

const th = (msg: string) => new Error(`transpile.ts error: ${msg}`);

const watch = process.argv.includes("--watch");

const ignoreFileArg = process.argv[2];

let ignore: any = { accepts: () => true };

if (ignoreFileArg) {
  if (!fs.existsSync(ignoreFileArg)) {
    throw th(`${ignoreFileArg} doesn't exist`);
  }
  ignore = gitignore.compile(fs.readFileSync(ignoreFileArg, "utf8"));
}

async function getEntryPointsFromStdin(): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const entries: string[] = [];
  for await (const line of rl) {
    const trimmed = line.trim().replace(/^\.\//, "");
    if (trimmed && ignore.accepts(trimmed)) {
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

log(`

    entryPoints: 
    ${entryPoints.join("\n    ")}
`);

const options: esbuild.BuildOptions = {
  entryPoints,
  bundle: true,
  outdir: ".",
  outbase: ".",
  entryNames: "[dir]/[name]",
  allowOverwrite: true,
  platform: "node",
  format: "esm",
  target: "node20",
  logLevel: "info",
  logOverride: {
    "direct-eval": "silent",
  },
};

if (watch) {
  const ctx = await esbuild.context(options);
  log(`watch mode: ON`);
  await ctx.watch();
} else {
  const result = await esbuild.build(options);
  log(`no watch mode: DONE`);
}

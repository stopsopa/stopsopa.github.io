import * as esbuild from "esbuild";
import readline from "readline";
import { sassPlugin } from "esbuild-sass-plugin";

const log = (...args: any) => console.log("bundle.ts:", ...args);

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

log(`
    ${entryPoints.join("\n    ")}
`);

const options: esbuild.BuildOptions = {
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
};

if (watch) {
  const ctx = await esbuild.context(options);
  log(`watch mode: ON`);
  await ctx.watch();
} else {
  const result = await esbuild.build(options);
  log(`no watch mode: DONE`);
}

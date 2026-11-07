// see TRANSPILATION.md

import * as esbuild from "esbuild";
import readline from "readline";
import { sassPlugin } from "esbuild-sass-plugin";

const log = (...args: any) => console.log("bundle.ts:", ...args);

/**
 * esbuild plugin that tracks rebuilt inputs in watch mode and logs changed files
 */
const watchNotifyPlugin: esbuild.Plugin = {
  name: "watch-notify",
  setup(build) {
    let prevInputs: Record<string, number> = {};
    let isInitialBuild = true;

    build.onEnd((result) => {
      const meta = result.metafile;
      const currentInputs: Record<string, number> = {};

      if (meta) {
        for (const [file, info] of Object.entries(meta.inputs)) {
          currentInputs[file] = info.bytes;
        }
      }

      if (isInitialBuild) {
        isInitialBuild = false;
        prevInputs = currentInputs;
        return;
      }

      if (meta) {
        const changedFiles = Object.keys(currentInputs).filter(
          (file) => !(file in prevInputs) || prevInputs[file] !== currentInputs[file]
        );

        if (changedFiles.length > 0) {
          for (const file of changedFiles) {
            log(`rebuilt (changed): ${file}`);
          }
        } else {
          log("rebuild triggered");
        }
      } else {
        log("rebuild triggered");
      }

      prevInputs = currentInputs;
    });
  },
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
  format: "esm",
  plugins: [sassPlugin(), ...(watch ? [watchNotifyPlugin] : [])],
  metafile: watch,
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

  log("exbuilddone2");
  await ctx.watch();
} else {
  await esbuild.build(options);

  log(`no watch mode: DONE`);
}

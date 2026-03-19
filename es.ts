/** @es.ts 
{
   mode: "bundle",
   extension: ".mjs",
   options: {
   }
}
@es.ts */

import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, basename, resolve, relative } from "node:path";
import { stdin, env } from "node:process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import Semaphore from "./pages/node/semaphore/Semaphore.ts";

const th = (msg: string) => new Error(`es.ts error: ${msg}`);

interface Config {
  target: string;
  loader: esbuild.Loader;
  charset: "utf8" | "ascii" | undefined;
  minify: boolean;
  bundle: boolean;
  extension: string;
}

const CONFIG: Config = {
  target: "esnext",
  loader: "ts",
  charset: "utf8",
  minify: false,
  bundle: false,
  extension: ".js",
};

const ES_PARALLEL_RAW = env.ES_PARALLEL || "2";

if (!/^\d+$/.test(ES_PARALLEL_RAW)) {
  throw th(`Invalid ES_PARALLEL value: "${ES_PARALLEL_RAW}". It must be a numeric string. Default is 2.`);
}

const ES_PARALLEL = parseInt(ES_PARALLEL_RAW, 10);

const args = process.argv.slice(2);
const PRODUCE_GITIGNORE = args.includes("--produce-gitignore");
const UPDATE_GITIGNORE = args.includes("--update");

if (UPDATE_GITIGNORE && !PRODUCE_GITIGNORE) {
  throw th("--update flag requires --produce-gitignore flag");
}

let gitRoot = "";
let startMarker = "";
let endMarker = "";
if (PRODUCE_GITIGNORE) {
  const findGitRoot = (startDir: string): string => {
    let currentDir = resolve(startDir);
    while (true) {
      if (existsSync(join(currentDir, ".git"))) {
        return currentDir;
      }
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        throw th("Could not find .git directory up to the root /");
      }
      currentDir = parentDir;
    }
  };
  gitRoot = findGitRoot(process.cwd());

  const scriptPath = fileURLToPath(import.meta.url);
  const scriptPathTs = scriptPath.replace(/\.(m|c)?js$/, ".ts");
  const relativeScriptPath = relative(process.cwd(), scriptPathTs);
  startMarker = `# ${relativeScriptPath} vvv don't remove`;
  endMarker = `# ${relativeScriptPath} ^^^ don't remove`;
}

if (!PRODUCE_GITIGNORE) {
  console.log(`ES_PARALLEL: ${ES_PARALLEL}`);
}

async function stripTypes(filePath: string): Promise<string | undefined> {
  try {
    const source = readFileSync(filePath, "utf8");
    const startMarker = "/** @es.ts";
    const endMarker = "@es.ts *" + "/";

    let buildMode: "bundle" | "transform" = CONFIG.bundle ? "bundle" : "transform";
    let localOptions: any = { ...CONFIG };

    const startIndex = source.indexOf(startMarker);
    const endIndex = source.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const configStr = source.substring(startIndex + startMarker.length, endIndex).trim();
      try {
        // Using Function to safely parse the object literal (allows unquoted keys)
        const config = new Function(`return (${configStr})`)();
        if (config.mode) {
          if (config.mode !== "bundle" && config.mode !== "transform") {
            throw th(`Invalid mode "${config.mode}" in ${filePath}. Only "bundle" or "transform" are allowed.`);
          }
          buildMode = config.mode;
        }
        if (config.extension) {
          localOptions.extension = config.extension;
        }
        if (config.options) {
          localOptions = { ...localOptions, ...config.options };
        }
      } catch (e: any) {
        if (e.message.includes('Invalid mode "')) {
          throw e;
        }
        console.error(`Error parsing @es.ts config in ${filePath}: ${e.message}`);
      }
    }

    const outPath: string = join(dirname(filePath), basename(filePath).replace(/\.ts$/, localOptions.extension));

    const options: esbuild.BuildOptions = {
      entryPoints: [filePath],
      bundle: buildMode === "bundle",
      write: false,
      target: localOptions.target as any,
      charset: localOptions.charset,
      minify: localOptions.minify,
      legalComments: "inline",
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "protect-comments",
          setup(build) {
            build.onLoad({ filter: /\.ts$/ }, async (args) => {
              const content = readFileSync(args.path, "utf8");
              const contents = content
                .replace(/\/\*\*/g, "/*!") // JSDoc -> Legal block
                .replace(/\/\/ /g, "//! "); // Single line -> Legal line
              return { contents, loader: "ts" };
            });
          },
        },
      ],
    };

    if (env.DEBUG) {
      console.log(JSON.stringify(options, null, 2));
    }

    const result = await esbuild.build(options);

    if (result.outputFiles && result.outputFiles[0]) {
      let outputText: string = result.outputFiles[0].text;

      // Restore protected comments
      outputText = outputText
        .replace(/\/\*\!/g, "/**")
        .replace(/\/\/! /g, "// ")
        .replace(/(@es\.ts \*\/\s*)/g, "@es.ts */\n");

      writeFileSync(outPath, outputText);
    }

    if (!PRODUCE_GITIGNORE) {
      console.log(`${buildMode === "bundle" ? "Bundled" : "Transpiled"} (esbuild): ${filePath} -> ${outPath}`);
    }
    return outPath;
  } catch (err: unknown) {
    hasError = true;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error processing ${filePath}: ${message}`);
    return undefined;
  }
}

function showHelp(): void {
  console.log(`
Usage:
  find . -path './node_modules' -prune -o -path './.git' -prune -o -type f -name '*.ts' -print | NODE_OPTIONS="" node es.mjs

  wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
  touch .esignore # add ignores
  find . -path './node_modules' -prune -o -path './.git' -prune -o -type f -name '*.ts' -print \\
    | NODE_OPTIONS="" node gitignore.js .esignore \\
    | NODE_OPTIONS="" DEBUG=true /bin/bash ts.sh es.ts --produce-gitignore --update

Description:
  Transpiles TypeScript files to JavaScript using esbuild, stripping types 
  and applying custom formatting (2-space indentation, unjamming braces).
  It accepts a newline-separated list of files from stdin.

  --produce-gitignore
    Instead of normal output, produce a block of paths for .gitignore, 
    prefixed and suffixed with a comment containing the relative path to 
    the script es.ts from where it is executed.
  
  --update
    Only works with --produce-gitignore. Automatically updates the block 
    in .gitignore between '# es.ts vvv' and '# es.ts ^^^' markers.

  Per-file configuration:
    Add this block to a .ts file to override default behavior:
/** @es.ts 
{
    mode: "bundle|transform",
    extension: ".js|.mjs",
    options: {
      target: "esnext", loader: "ts", 
      charset: "utf8", minify: false
    }
}
@es.ts */
  
  DEBUG=true
    When this environment variable is set, the parameters passed 
    to esbuild.transform (input and options) are dumped to the 
    console for each processed file.
  
Built-in Config:
${JSON.stringify(CONFIG, null, 2)}
`);
}

if (stdin.isTTY) {
  showHelp();
  process.exit(0);
}

const rl = createInterface({
  input: stdin,
  terminal: false,
});

let processedCount: number = 0;
let hasError: boolean = false;
const gitignorePaths: string[] = [];
const semaphore = new Semaphore(ES_PARALLEL);
const activeTasks = new Set<Promise<void>>();

for await (const line of rl) {
  const file: string = line.trim();
  if (file) {
    processedCount++;
    await semaphore.acquire();

    // Start the task and keep track of it in the activeTasks Set
    const task: Promise<void> = (async () => {
      try {
        const outPath = await stripTypes(file);
        if (PRODUCE_GITIGNORE && outPath) {
          gitignorePaths.push(outPath);
        }
      } finally {
        semaphore.release();
        // @ts-ignore - 'task' is assigned before this finally block runs
        activeTasks.delete(task);
      }
    })();

    activeTasks.add(task);
  }
}

// Wait for any remaining active tasks to finish
await Promise.all(activeTasks);

if (PRODUCE_GITIGNORE && gitignorePaths.length > 0) {
  const content = [startMarker, ...gitignorePaths.sort(), endMarker].join("\n");

  if (UPDATE_GITIGNORE) {
    const gitignorePath = join(gitRoot, ".gitignore");
    if (!existsSync(gitignorePath)) {
      throw th(`.gitignore not found in ${gitRoot}`);
    }
    const gitignoreContent = readFileSync(gitignorePath, "utf8");

    const startIndex = gitignoreContent.indexOf(startMarker);
    const endIndex = gitignoreContent.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      let missing = [];
      if (startIndex === -1) missing.push(`'${startMarker}'`);
      if (endIndex === -1) missing.push(`'${endMarker}'`);
      throw th(
        `.gitignore is missing markers: ${missing.join(
          " and "
        )} HELP: run first time without --update parameter, take the output and put into .gitignore and then run again with --update`
      );
    }

    if (startIndex > endIndex) {
      throw th(`.gitignore markers are in wrong order: '${startMarker}' appears after '${endMarker}'`);
    }

    const before = gitignoreContent.substring(0, startIndex);
    const after = gitignoreContent.substring(endIndex + endMarker.length);
    const updated = before + content + after;

    writeFileSync(gitignorePath, updated);
    console.log(`.gitignore updated in ${gitRoot}`);
  }

  console.log(content);
}

if (processedCount === 0 && !PRODUCE_GITIGNORE) {
  showHelp();
}

if (hasError) {
  process.exit(1);
}

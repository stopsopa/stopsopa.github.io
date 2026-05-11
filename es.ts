/** @es.ts 
{
   mode: "bundle",
   extension: ".mjs",
   options: {
   }
}
@es.ts */

// see TRANSPILATION.md

import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, basename, resolve, relative } from "node:path";
import { stdin, env } from "node:process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

class Semaphore {
  private permits: number;
  private maxPermits: number;
  private waiters: (() => void)[] = [];
  constructor(permits: number) {
    this.maxPermits = this.permits = permits;
  }
  acquire() {
    return new Promise<void>((resolve) => {
      if (this.permits > 0) {
        this.permits -= 1;
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
  }
  release() {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      if (this.permits !== this.maxPermits) {
        this.permits += 1;
      }
    }
  }
}

const th = (msg: string) => new Error(`es.ts error: ${msg}`);

interface InternalConfig {
  target: string;
  loader: esbuild.Loader;
  format: "esm" | "cjs" | "iife";
  charset: "utf8" | "ascii";
  minify: boolean;
  bundle: boolean;
  extension: string;
}

const CONFIG: InternalConfig = {
  target: "esnext",
  loader: "ts",
  format: "esm",
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

/**
 * function to trick es.ts to don't introduce extra \n
 */

var SLASH = "/";

async function stripTypes(filePath: string): Promise<{ outPath: string | undefined; config: any } | undefined> {
  try {
    const source = readFileSync(filePath, "utf8");
    const startMarker = "/** @es.ts";
    const endMarker = `@es.ts *${SLASH}`;

    let config: any = {};

    const startIndex = source.indexOf(startMarker);
    const endIndex = source.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const configStr = source.substring(startIndex + startMarker.length, endIndex).trim();
      try {
        // Using Function to safely parse the object literal (allows unquoted keys)
        config = new Function(`return (${configStr})`)();
      } catch (e: any) {
        console.error(`Error parsing @es.ts config in ${filePath}: ${e.message}`);
      }
    }

    const buildMode = config.mode || (CONFIG.bundle ? "bundle" : "transform");
    const extension = config.extension || CONFIG.extension;
    const loader = config.loader || CONFIG.loader;

    // 1. Prepare base options from defaults
    let baseOptions: esbuild.BuildOptions = {
      target: CONFIG.target as any,
      charset: CONFIG.charset,
      minify: CONFIG.minify,
      bundle: buildMode === "bundle",
      format: CONFIG.format,
      platform: "node",
      legalComments: "inline",
    };

    // 2. If 'setup' is provided, it replaces the base options
    if (config.setup) {
      baseOptions = { ...config.setup };
    }

    // 3. Merge top-level config fields (excluding tool-specific ones)
    const { mode, extension: _ext, setup, options, cliarguments, ...rest } = config;
    const mergedOptions: any = {
      ...baseOptions,
      ...rest,
    };

    // Allow unsetting defaults by passing undefined
    Object.keys(mergedOptions).forEach((key) => {
      if (mergedOptions[key] === undefined) {
        delete mergedOptions[key];
      }
    });

    // 4. Force essential options and inject plugin
    const finalOptions: esbuild.BuildOptions = {
      ...mergedOptions,
      entryPoints: [filePath],
      write: false,
      plugins: [
        ...(mergedOptions.plugins || []),
        {
          name: "protect-comments",
          setup(build) {
            build.onLoad({ filter: /\.ts$/ }, async (args) => {
              const content = readFileSync(args.path, "utf8");
              const contents = content
                .replace(/\/\*\*/g, "/*!") // JSDoc -> Legal block
                .replace(/\/\/ /g, "//! "); // Single line -> Legal line
              return { contents, loader };
            });
          },
        },
      ],
    };

    // 5. Handle output path defaulting if not specified
    if (!finalOptions.outfile && !finalOptions.outdir) {
      finalOptions.outfile = join(dirname(filePath), basename(filePath).replace(/\.ts$/, extension));
    }

    if (env.DEBUG) {
      console.log(`Final esbuild options for ${filePath}:`);
      console.log(JSON.stringify(finalOptions, null, 2));
    }

    const result = await esbuild.build(finalOptions);

    let firstOutPath: string | undefined;

    if (result.outputFiles) {
      for (const file of result.outputFiles) {
        let outputText: string = file.text;

        // Restore protected comments
        outputText = outputText
          .replace(/\/\*\!/g, "/**")
          .replace(/\/\/! /g, "// ")
          .replace(/(@es\.ts \*\/\s*)/g, `@es.ts *${SLASH}`);

        writeFileSync(file.path, outputText);

        if (!firstOutPath) {
          firstOutPath = file.path;
        }
      }
    }

    return {
      outPath: firstOutPath,
      config,
    };
  } catch (err: unknown) {
    hasError = true;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error processing ${filePath}: ${message}`);
    return undefined;
  }
}

/**
 * Updates the .gitignore file by merging newly found paths with existing ones in the marker block.
 * We merge instead of replacing because es.ts might only process a subset of files in a given run,
 * and we don't want to lose existing transpilation outputs from previous different runs.
 */
function updateGitignoreFile(
  gitRoot: string,
  startMarker: string,
  endMarker: string,
  gitignorePaths: string[]
): string[] {
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

  // Extract existing paths between markers
  const existingBlock = gitignoreContent.substring(startIndex + startMarker.length, endIndex);
  const existingPaths = existingBlock
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  // Merge with newly found paths and deduplicate
  const allPaths = Array.from(new Set([...existingPaths, ...gitignorePaths])).sort();

  const content = [startMarker, ...allPaths, endMarker].join("\n");
  const updated = before + content + after;

  writeFileSync(gitignorePath, updated);
  console.log(`.gitignore updated in ${gitRoot}`);

  return allPaths;
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
    // Tool-specific keys:
    mode: "bundle|transform", // optional, shorthand for bundle: true/false
    extension: ".js|.mjs",    // optional, default output extension
    setup: { ... },           // optional, if present replaces all default esbuild options

    // Any other keys are treated as esbuild BuildOptions and merged with defaults:
    target: "esnext", 
    minify: false,
    platform: "node",
    // ...
    
    // Use 'undefined' to unset a default and let esbuild decide:
    minify: undefined,

    // Overriding command line arguments:
    "cliarguments": ["--produce-gitignore"], // override global arguments for this file
}
@es.ts *${SLASH}
  
  DEBUG=true
    When this environment variable is set, the parameters passed 
    to esbuild.transform (input and options) are dumped to the 
    console for each processed file.
  
Built-in Config (generated internally - so it is true setup which will be really used):
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
const gitignorePaths: string[] = []; // paths to produce in stdout
const updatePaths: string[] = []; // paths to actually update in .gitignore
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
        const result = await stripTypes(file);
        if (result && result.outPath) {
          const { outPath, config } = result;
          const buildMode = config.mode || (CONFIG.bundle ? "bundle" : "transform");
          if (!PRODUCE_GITIGNORE) {
            console.log(`${buildMode === "bundle" ? "Bundled" : "Transpiled"} (esbuild): ${file} -> ${outPath}`);
          }

          const localArgs = Array.isArray(config.cliarguments) ? config.cliarguments : args;

          const localProduceGitignore = localArgs.includes("--produce-gitignore");
          const localUpdateGitignore = localArgs.includes("--update");

          if (localProduceGitignore) {
            const relPath = relative(gitRoot, outPath);
            gitignorePaths.push(relPath);
            if (localUpdateGitignore) {
              updatePaths.push(relPath);
            }
          }
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
  let pathsToLog = gitignorePaths;

  if (UPDATE_GITIGNORE) {
    pathsToLog = updateGitignoreFile(gitRoot, startMarker, endMarker, updatePaths);
  }

  const content = [startMarker, ...pathsToLog.sort(), endMarker].join("\n");
  console.log(content);
}

if (processedCount === 0 && !PRODUCE_GITIGNORE) {
  showHelp();
}

if (hasError) {
  process.exit(1);
}

import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { stdin } from "node:process";

const CONFIG = {
  target: "esnext",
  indentSize: 2,
  loader: "ts",
  charset: "utf8",
  minify: false,
};

async function stripTypes(filePath) {
  try {
    const source = readFileSync(filePath, "utf8");

    // Protection Hack: esbuild's transform API strips non-legal comments.
    // We temporarily turn standard comments into "legal" ones to preserve them.
    const protectedSource = source
      .replace(/\/\*\*/g, "/*!") // JSDoc -> Legal block
      .replace(/\/\/ /g, "//! "); // Single line -> Legal line

    const result = await esbuild.transform(protectedSource, {
      target: CONFIG.target,
      loader: CONFIG.loader,
      charset: CONFIG.charset,
      minify: CONFIG.minify,
      legalComments: "inline", // Ensure legal comments are kept in place
    });

    let outputText = result.code;

    // Restore protected comments
    outputText = outputText
      .replace(/\/\*\!/g, "/**")
      .replace(/\/\/! /g, "// ");

    // Respect the indentSize setting from our configuration
    if (CONFIG.indentSize === 2) {
      // Unjam "} else {" and "} catch {" which usually come out on separate lines
      outputText = outputText.replace(/\}\s*\n\s*(else|catch|finally)/g, "} $1");
    }

    const outPath = join(
      dirname(filePath),
      basename(filePath).replace(/\.ts$/, ".js")
    );

    writeFileSync(outPath, outputText);
    console.log(outPath);
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

function showHelp() {
  console.log(`
Usage:
  find public -name "*.ts" | NODE_OPTIONS="" node es.mjs

Description:
  Transpiles TypeScript files to JavaScript using esbuild, stripping types 
  and applying custom formatting (2-space indentation, unjamming braces).
  It accepts a newline-separated list of files from stdin.
  
Built-in Config:
${JSON.stringify(CONFIG, null, 2)}
`);
}

async function main() {
  if (stdin.isTTY) {
    showHelp();
    process.exit(0);
  }

  let input = "";
  stdin.setEncoding("utf8");

  for await (const chunk of stdin) {
    input += chunk;
  }

  const files = input
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  if (files.length === 0) {
    showHelp();
    process.exit(0);
  }

  // Process files sequentially or in parallel? 
  // For simplicity and to match transpile.mjs behavior, we'll do them as they come.
  for (const file of files) {
    await stripTypes(file);
  }
}

main();

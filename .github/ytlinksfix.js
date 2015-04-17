import path from "path";

import fs from "fs";

import readline from "readline";

import iterateStreamLineByLine from "nlab/iterateStreamLineByLine";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const relative = path.relative(process.cwd(), __filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Create a queue to process files sequentially
let processingPromise = Promise.resolve();

rl.on("line", (file) => {
  // Chain the promises to ensure sequential processing
  processingPromise = processingPromise
    .then(async () => {
      process.stdout.write(`${relative} processing: ${file}\n`);

      const { inputFile, outputFile } = await replaceInFile(file);

      fs.unlinkSync(inputFile);
      fs.renameSync(outputFile, inputFile);

      process.stdout.write(`${relative} completed: ${file}\n`);
    })
    .catch((error) => {
      process.stderr.write(`Error processing ${file}: ${error.message}\n`);
    });
});

async function replaceInFile(inputFile) {
  const outputFile = `${inputFile}.tmp`;

  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  const stream = fs.createReadStream(inputFile, { encoding: "utf8" });

  const writeStream = fs.createWriteStream(outputFile);

  await iterateStreamLineByLine(stream, (line) => {
    if (line.length > 2) {
      const youtubeUrlRegex = /(?:https?:\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)(?:\/)[0-9a-z?=&_-]+/gi;

      const modifiedLine = line.replace(youtubeUrlRegex, (match) => {
        try {
          const url = new URL(match);
          url.searchParams.delete("si");

          const newUrl = url.toString();

          if (newUrl !== match) {
            process.stdout.write(`Replaced: ${match} -> ${newUrl}\n`);
          }

          return newUrl;
        } catch {
          return match; // fallback if URL parsing fails
        }
      });

      writeStream.write(modifiedLine);
    } else {
      writeStream.write(line);
    }
  });

  writeStream.close();

  stream.close();

  return { inputFile, outputFile };
}

import path from "path";

import fs from "fs";

import readline from "readline";

const AES256_KEY_PREV = process.argv[2];

if (!AES256_KEY_PREV) {
  console.error("reencode.js error: AES256_KEY_PREV is not set");
  process.exit(1);
}

import {
  all,
  get,
  has,
  getDefault,
  getThrow,
  getIntegerThrowInvalid, // equivalent to get
  getIntegerDefault,
  getIntegerThrow,
} from "envprocessor";

import { encryptMessage, decryptMessage } from "../pages/encryptor/aes-cbc-node.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const relative = path.relative(process.cwd(), __filename);

if (!has("AES256_KEY")) {
  console.error("reencode.js error: AES256_KEY is not set");
  process.exit(1);
}

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

      if (outputFile) {

        fs.unlinkSync(inputFile);
        fs.renameSync(outputFile, inputFile);

        process.stdout.write(`${relative} completed: ${file}\n`);
      }
      else {
        process.stdout.write(`${relative} no changes: ${file}\n`);
      }


    })
    .catch((error) => {
      process.stderr.write(`Error processing ${file}: ${error.message}\n`);
    });
});

async function replaceInString(content) {
  // Regular expression to match encrypted content
  const regex = /:\[v1:[a-z0-9]{5}::[a-z0-9+\/=]+::(?:[\n\r\s\t]+[a-z0-9+\/=]+)+:\]:/gi;

  // Find all matches
  const matches = Array.from(content.matchAll(regex));
  let replacedContent = content;

  // Process each match sequentially
  for (const match of matches) {
    const fetched = match[0];

    const spaces = messageCountSpaces(fetched);

    const decrypted = await decryptMessage(AES256_KEY_PREV, fetched);
    const encoded = await encryptMessage(get("AES256_KEY"), decrypted);
    const decryptedCheck = await decryptMessage(get("AES256_KEY"), encoded);

    if (decrypted !== decryptedCheck) {
      throw new Error(`reencode.js error: decrypted content does not match original content`);
    }

    const spaced = formatSpaces(encoded, spaces);

    // Replace the match with the newly encoded content
    replacedContent = replacedContent.replace(fetched, spaced);
  }

  return replacedContent;
}

async function replaceInFile(inputFile) {
  let outputFile;

  if (has("RUN")) {
    outputFile = `${inputFile}.tmp`;

    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  }

  const content = await fs.promises.readFile(inputFile, "utf8");

  let replacedContent = replaceInString(content);

  if (outputFile) {
    // Write the modified content to the output file
    await fs.promises.writeFile(outputFile, replacedContent, "utf8");
  }

  return { inputFile, outputFile };
}

function countLeadingSpaces(str) {
  const match = str.match(/^ */);
  return match ? match[0].length : 0;
}

function messageCountSpaces(message) {
  const lines = message.split("\n");
  let max = 0;
  lines.forEach((line) => {
    const spaces = countLeadingSpaces(line);
    if (spaces > max) {
      max = spaces;
    }
  });
  return max;
}
function formatSpaces(message, spaces) {
  const lines = message.split("\n").map((line, i) => {
    if (i === 0) {
      return line;
    }
    return " ".repeat(spaces) + line;
  });

  return lines.join("\n");
}

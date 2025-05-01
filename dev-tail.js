/**
 * node dev-tail.js var/tail.log var/server_js_https.log var/server_js_http.log
 *
 * This script will attach and do 'tail -f var/tail.log' continuously
 * and also on every keystroke will dumpt to process.stdout.write() content of any file after the first argument
 * in our case these are:
 *    var/server_js_https.log
 *    var/server_js_http.log
 *
 */

import readline from "readline";
import { promises as fsPromises, watch, createReadStream, statSync } from "fs";
import fss from "fs";
import { resolve } from "path";

import path from "path";
import { fileURLToPath } from "url";

// handle live 'tail'ing file
// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath || !fss.existsSync(filePath)) {
  console.error("Please provide a file path as an argument");
  console.error("Usage: node wait2.js <file_path>");
  process.exit(1);
}

// Resolve to absolute path
const absolutePath = resolve(filePath);

// Variables to track file position
let fileSize = 0;

// Function to read and print file content from a specific position
const readFromPosition = (position) => {
  try {
    const stats = statSync(absolutePath);
    const currentSize = stats.size;

    if (currentSize > position) {
      const stream = createReadStream(absolutePath, {
        start: position,
        end: currentSize - 1,
      });

      stream.on("data", (chunk) => process.stdout.write(chunk));

      stream.on("end", () => {
        fileSize = currentSize;
      });

      stream.on("error", (err) => {
        console.error(`Error reading file: ${err.message}`);
      });
    }
  } catch (err) {
    console.error(`Error accessing file: ${err.message}`);
  }
};

// Main function to handle file watching
const tailFile = async () => {
  // Initial read of the entire file
  console.log(`Monitoring file: ${absolutePath}`);

  readFromPosition(0);

  // Watch for changes
  const watcher = watch(absolutePath, (eventType, filename) => {
    if (eventType === "change") {
      readFromPosition(fileSize);
    }
  });

  return watcher;
};

// Start monitoring
const watcher = tailFile();

// now let's handle stdin
// now let's handle stdin
// now let's handle stdin

const __filename = fileURLToPath(import.meta.url);
const rel_script = path.relative(process.cwd(), __filename);

let i = 0;
function keypressed(key) {
  i += 1;
  const files = process.argv.slice(3);

  process.stdout.write(`\n${rel_script}: ${i}`);

  files.forEach((file) => {
    const content = fss.readFileSync(file, "utf8");
    process.stdout.write(content);
  });
}

// Configure stdin
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// Set up event listener for keypress events
process.stdin.on("keypress", (str, key) => {
  // Exit on ctrl+c
  if (key.ctrl && key.name === "c") {
    watcher.close();
    process.exit();
  }

  // Call the keypressed function with the key information
  keypressed(str);
});

console.log(`${rel_script}: Keyboard listener activated. Press any key to trigger the keypressed function.`);
console.log("Press Ctrl+C to exit.");

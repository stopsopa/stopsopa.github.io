// transpile
// if [ $# -eq 0 ]; then
//     echo "Usage: $0 <file1> [file2 ...]"
//     exit 1
// fi

// FILES=("$@")

// while true; do
//     echo "Running transpilation for ${FILES[*]}..."
//     printf "%s\n" "${FILES[@]}" | NODE_OPTIONS="" DEBUG=true node es.ts

//     echo "Waiting for changes..."
//     node bash/fs/watch.cjs "${FILES[@]}"
//     STATUS=$?
//     if [ $STATUS -eq 130 ]; then
//         exit 0
//     fi
// done
// then use /bin/bash transpile.sh file1 file2 ...

/**
 * Above code works actually pretty well
 * - it will wait for file to be created - and triggers ACTION immediately
 *   in both cases: when file exist on start of after it will be created after delay
 *
 * - it will execut on each file change after
 * - and once file will be deleted it will wait for it to be created again to trigger ACTION again
 *
 */

const fs = require("fs");

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("No files specified to watch");
  process.exit(1);
}

const existingFiles = files.filter(f => {
  if (fs.existsSync(f)) {
    return true;
  }
  console.error(`Warning: file ${f} doesn't exist`);
  return false;
});

if (existingFiles.length === 0) {
  console.error("None of the specified files exist");
  process.exit(1);
}

console.log(`waiting for changes in:
${existingFiles.map(f => `  - ${f}`).join('\n')}
... (any key to force restart)`);

existingFiles.forEach(file => {
  try {
    fs.watch(file, function () {
      process.exit(0);
    });
  } catch (e) {
    console.error(`Error watching ${file}: ${e.message}`);
  }
});

// Setup stdin to react to any keypress
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (key) {
    // Ctrl+C or Ctrl+D pressed
    if (key === '\u0003' || key === '\u0004') {
      process.exit(130); 
    }
    // For any other key, exit with 2 to indicate manual interruption
    process.exit(2);
  });
} else {
  process.stdin.resume();
  process.stdin.on('data', function () {
    process.exit(2);
  });
}


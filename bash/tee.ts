/**
 * Custom tee implementation that supports -n <number> to limit lines written to files.
 * Always duplicates all input to stdout immediately.
 *
 * Usage examples:
 *
 * 1. Basic usage (like standard tee):
 *    cat file.txt | /bin/bash ts.sh bash/tee.ts output.txt
 *
 * 2. Limit lines written to the file (capture first 10 lines):
 *    some_command | /bin/bash ts.sh bash/tee.ts -n 10 output.txt
 *
 * 3. Append to files:
 *    some_command | /bin/bash ts.sh bash/tee.ts -a output.txt
 *
 * 4. Advanced usage as seen in dev.sh (with piping to dlogger):
 *    node server.js 2>&1 | NODE_OPTIONS="" CHECK=false /bin/bash ts.sh bash/tee.ts -n 10 log.txt | /bin/bash bash/dlogger.sh " " "tag" >> combined.log
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let lineLimit = Infinity;
let append = false;
const filenames: string[] = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-n') {
    const val = args[++i];
    if (val) {
      lineLimit = parseInt(val, 10);
    }
  } else if (arg === '-a') {
    append = true;
  } else if (!arg.startsWith('-')) {
    filenames.push(arg);
  }
}

// Ensure first the directory for each file exists
filenames.forEach(file => {
  const dir = path.dirname(file);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const streams = filenames.map(file => fs.createWriteStream(file, { flags: append ? 'a' : 'w' }));

let linesCount = 0;
let continueWritingToFiles = true;

process.stdin.on('data', (chunk: Buffer) => {
  // 1. Always write everything to stdout immediately
  process.stdout.write(chunk);

  // 2. Write to files only if we haven't reached the line limit
  if (continueWritingToFiles) {
    let chunkToWrite: Buffer = chunk;
    
    // Count newlines in this chunk
    const str = chunk.toString('utf8');
    let newlinesInChunk = 0;
    for (const char of str) {
      if (char === '\n') newlinesInChunk++;
    }

    if (linesCount + newlinesInChunk >= lineLimit) {
      // We hit the limit in this chunk. Find the exact position of the last allowed newline.
      let count = 0;
      let splitIndex = -1;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '\n') {
          count++;
          if (linesCount + count === lineLimit) {
            splitIndex = i;
            break;
          }
        }
      }
      
      if (splitIndex !== -1) {
        // Only write up to this line
        chunkToWrite = chunk.subarray(0, Buffer.byteLength(str.substring(0, splitIndex + 1)));
        continueWritingToFiles = false;
      }
    }
    
    streams.forEach(stream => stream.write(chunkToWrite));
    linesCount += newlinesInChunk;
    
    if (!continueWritingToFiles) {
      streams.forEach(stream => stream.end());
    }
  }
});

process.stdin.on('end', () => {
  if (continueWritingToFiles) {
    streams.forEach(stream => stream.end());
  }
});

// node producer_unsafe_demo.js | node consumer_demo.js

import { Buffer } from "node:buffer";

const TOTAL_LINES = 15000;
const CHUNK_SIZE = 1024 * 1024 * 1; // 1MB
// const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB
const chunk = Buffer.alloc(CHUNK_SIZE, "x").toString();

process.stderr.write("Starting UNSAFE producer. Tracking all memory fields.\n");

for (let count = 1; count <= TOTAL_LINES; count++) {
  // We concatenate to make it "unique" each time
  process.stdout.write(chunk);

  if (count % 10 === 0) {
    const m = process.memoryUsage();
    const heap = Math.round(m.heapUsed / 1024 / 1024);
    const external = Math.round(m.external / 1024 / 1024);
    const rss = Math.round(m.rss / 1024 / 1024);

    // This log will reveal the truth: RSS and External will grow, while Heap stays small.
    process.stderr.write(`producer [${count}] - Heap: ${heap}MB, External: ${external}MB, RSS: ${rss}MB\n`);
  }
}

process.stderr.write("producer end\n");

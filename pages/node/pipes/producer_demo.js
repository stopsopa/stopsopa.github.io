// node producer_demo.js | node consumer_demo.js

import { Buffer } from "node:buffer";

const TOTAL_LINES = 1000;
// const CHUNK_SIZE = 1024 * 16;   // 16KB (Common Node.js default highWaterMark)
const CHUNK_SIZE = 1024 * 64; // 64KB (Common OS pipe buffer size)
// const CHUNK_SIZE = 1024 * 512;  // 0.5MB
// const CHUNK_SIZE = 1024 * 1024;    // 1MB
// const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB
const chunk = Buffer.alloc(CHUNK_SIZE, "x").toString() + "\n";

for (let count = 1; count <= TOTAL_LINES; count++) {
  // 1. Attempt to write to stdout.
  // process.stdout.write() returns FALSE if the internal buffer is FULL.
  // This is the signal that the consumer (or the OS pipe) can't keep up.
  const canWrite = process.stdout.write(chunk);

  process.stderr.write(`producer [${count}]\n`);

  if (!canWrite) {
    // 2. If we are here, it means we must STOP writing immediately.
    // If we keep writing while canWrite is false, Node.js will buffer the data
    // in RAM, which eventually leads to a crash (Out Of Memory).
    process.stderr.write(
      `producer !! THROTTLED !! Waiting for consumer to catch up...\n`,
    );

    // 3. Wait for the 'drain' event.
    // This event is emitted by the stream when the buffer is finally empty
    // and it's safe to resume writing.
    await new Promise((resolve) => process.stdout.once("drain", resolve));

    process.stderr.write(`producer >> RESUMED >>\n`);
  }
}
process.stderr.write("producer end\n");

// node producer_generator_demo.js | node consumer_demo.js

import { Readable } from "node:stream";
import { Buffer } from "node:buffer";

const TOTAL_LINES = 1000;
const CHUNK_SIZE = 1024 * 64; // 64KB (Matching the manual producer example)
const chunk = Buffer.alloc(CHUNK_SIZE, "x").toString() + "\n";

/**
 * SECOND VERSION: Using Async Generators (Natural Backpressure)
 *
 * In producer_demo.js, we had to manually check if (process.stdout.write(chunk) === false).
 *
 * Here, we use an Async Generator. This is the modern "for await" way of producing data.
 * Even though we don't explicitly write "for await" here, Node's Readable.from()
 * uses it internally to pull data from our generator as the pipe has space.
 */
async function* dataProducer() {
  for (let count = 1; count <= TOTAL_LINES; count++) {
    // 1. Yielding data.
    // This generator will PAUSE here automatically if the stream it's
    // piped to (stdout) is full. You don't need to manually await any condition.
    // The "for await" mechanism in the stream consumer handles the timing.
    yield chunk;

    // We can still log to stderr for diagnostics
    process.stderr.write(`producer [${count}]\n`);
  }
}

/**
 * 2. Readable.from() converts our generator into a real Node.js stream.
 * It is essentially a "for await" loop that pushes yielded chunks into the stream.
 */
const producerStream = Readable.from(dataProducer());

/**
 * 3. .pipe() handles the actual backpressure signal.
 * When the consumer is slow, the OS pipe fills up. Node.js detects this
 * and tells 'producerStream' to stop pulling from the generator.
 *
 * This creates the same effect as producer_demo.js but with much cleaner code.
 */
producerStream.pipe(process.stdout);

producerStream.on("end", () => {
  process.stderr.write("producer end\n");
});

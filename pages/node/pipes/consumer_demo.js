process.stderr.write("consumer: Starting. Natural backpressure via async iterator.\n");

let count = 0;

// This async loop handles backpressure AUTOMATICALLY.
// If this loop is slow, Node.js stops reading from the underlying 
// system pipe once the internal buffers are full.
for await (const _chunk of process.stdin) {
  // Simulate heavy processing (1 second)
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  count++;
  process.stderr.write(`consumer [${count}]\n`);
}

process.stderr.write("consumer end\n");

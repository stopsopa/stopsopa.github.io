import { testString, transformedString, iterations } from './data.js';

export async function runBenchmark(name, flipget, logFn, getMemoryFn) {
    logFn(`--- Testing module: ${name} ---`);
    
    // Verification
    const flipped1 = flipget(testString);
    const flipped2 = flipget(flipped1);
    const flipped3 = flipget(flipped2);
    const flipped4 = flipget(flipped3);

    let pass = true;
    if (flipped4 !== testString) {
        logFn(`❌ FAILED: 4 flips did not return to original string.`);
        pass = false;
    }
    if (flipped3 !== transformedString) {
        logFn(`❌ FAILED: 3 flips did not match the expected transformed string.`);
        pass = false;
    }

    if (pass) {
        logFn(`✅ Verification passed.`);
    }

    logFn(`Running ${iterations} iterations...`);
    
    // Let UI update if in browser
    if (typeof window !== 'undefined') {
        await new Promise(r => setTimeout(r, 10));
    }

    let currentString = testString;
    const startMem = getMemoryFn ? getMemoryFn() : 0;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        currentString = flipget(currentString);
    }

    const endTime = performance.now();
    const endMem = getMemoryFn ? getMemoryFn() : 0;

    const time = endTime - startTime;
    const memDiff = getMemoryFn ? (endMem - startMem) : null;

    logFn(`Time: ${time.toFixed(2)} ms`);
    if (memDiff !== null) {
        logFn(`Memory Diff: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);
    } else {
        logFn(`Memory Diff: N/A`);
    }
    logFn(`\n`);
    
    return { name, time, memory: memDiff, pass };
}

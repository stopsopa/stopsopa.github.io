// node --experimental-strip-types --test --experimental-test-coverage --test-reporter=tap pages/node/builtin-test-runner.test.ts

import assert from "node:assert";
import { describe, it } from "node:test";

function add(a: number, b: number): number {
  return a + b;
}

// can't use done() - it's not available in node:test
describe("first", async () => {
  try {
    assert.strictEqual(add(1, 2), 3);
  } catch (e) {
    throw new Error(`General error: ${e}`);
  }
});

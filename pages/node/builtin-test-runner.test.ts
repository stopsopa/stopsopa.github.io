// node --experimental-strip-types --test --experimental-test-coverage --test-reporter tap --import ./loader-register.js pages/node/builtin-test-runner.test.ts

// or
// node --experimental-strip-types --test --experimental-test-coverage --test-reporter lcov --import ./loader-register.js pages/node/builtin-test-runner.test.ts > coverage/lcov.info

import assert from "node:assert";
import { describe, it } from "node:test";

import add, { libs } from "./libs/tstest";
// above would require .ts
// but thanks to the loader-register.js it's fine

// can't use done() - it's not available in node:test
describe("first", async () => {
  it("should return 3", async () => {
    assert.strictEqual(add(1, 2), 3);
  });

  it("two", async () => {
    try {
      assert.strictEqual(add(1, 2), 3);
    } catch (e) {
      throw new Error(`General error: ${e}`);
    }
  });
});

describe("libs function", async () => {
  it("should return formatted libs string", async () => {
    const result = libs();
    assert.strictEqual(result, "libs: [lib: >l1<] [lib2: >l2<]");
  });

  it("should include lib1 and lib2 in the result", async () => {
    const result = libs();
    assert.ok(result.includes("l1"));
    assert.ok(result.includes("l2"));
  });
});

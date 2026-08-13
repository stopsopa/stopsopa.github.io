import { test } from "node:test";
import assert from "node:assert/strict";

import { encode, decode } from "./lineEncoding.ts";

/**
 * node --test bash/socket/libs/lineEncoding.test.ts
 */
test("lineEncoding - encode", () => {
  assert.strictEqual(encode("hello"), "hello");
  assert.strictEqual(encode("hello\nworld"), "hello\\nworld");
  assert.strictEqual(encode("hello\nworld\n"), "hello\\nworld\\n");
  assert.strictEqual(encode("\n"), "\\n");
  assert.strictEqual(encode("hello\\world"), "hello\\\\world");
  assert.strictEqual(encode("hello\\nworld"), "hello\\\\nworld");
  assert.strictEqual(encode("hello\\\nworld"), "hello\\\\\\nworld");
});

test("lineEncoding - decode", () => {
  assert.strictEqual(decode("hello"), "hello");
  assert.strictEqual(decode("hello\\nworld"), "hello\nworld");
  assert.strictEqual(decode("hello\\nworld\\n"), "hello\nworld\n");
  assert.strictEqual(decode("\\n"), "\n");
  assert.strictEqual(decode("hello\\\\world"), "hello\\world");
  assert.strictEqual(decode("hello\\\\nworld"), "hello\\nworld");
  assert.strictEqual(decode("hello\\\\\\nworld"), "hello\\\nworld");
});

test("lineEncoding - preserve literal escape sequences", () => {
  const values = ["\\n", "\\x", "\\anything", "hello\\nworld", "hello\\xworld", "hello\\\\world", "\\\\n"];

  for (const value of values) {
    assert.strictEqual(decode(encode(value)), value);
  }
});

test("lineEncoding - round trip", () => {
  const values = [
    "",
    "hello",
    "hello\nworld",
    "\n",
    "\n\n",
    "before\nmiddle\nafter",
    "hello\\world",
    "hello\\nworld",
    "\\n",
    "\\\\",
    "\\\\n",
    "hello\\\nworld",
    "hello\\nworld\nagain",
  ];

  for (const value of values) {
    assert.strictEqual(decode(encode(value)), value);
  }
});

test("custom", () => {
  const input = `
abc

def\\x

ghi`;

  const encoded = encode(input);

  const expected = `\\nabc\\n\\ndef\\\\x\\n\\nghi`;

  assert.strictEqual(encoded, expected);

  const decoded = decode(encoded);

  assert.strictEqual(decoded, input);
});

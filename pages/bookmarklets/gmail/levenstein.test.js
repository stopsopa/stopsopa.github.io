import test from "node:test";
import assert from "node:assert";
import levenshtein from "./levenstein.js";

test("levenshtein distance tests", (t) => {
  t.test("identical strings should have distance 0", () => {
    assert.strictEqual(levenshtein("test", "test"), 0);
    assert.strictEqual(levenshtein("", ""), 0);
  });

  t.test("empty strings", () => {
    assert.strictEqual(levenshtein("abc", ""), 3);
    assert.strictEqual(levenshtein("", "abc"), 3);
  });

  t.test("single character difference (substitution)", () => {
    assert.strictEqual(levenshtein("abc", "axc"), 1);
    assert.strictEqual(levenshtein("kitten", "sitten"), 1);
  });

  t.test("single character missing/added (deletion/insertion)", () => {
    assert.strictEqual(levenshtein("abc", "ab"), 1); // delete c
    assert.strictEqual(levenshtein("abc", "ac"), 1); // delete b
    assert.strictEqual(levenshtein("ab", "abc"), 1); // insert c
  });

  t.test("different lengths and multiple changes", () => {
    // kitten -> sitting:
    // 1. kitten -> sitten (sub k -> s)
    // 2. sitten -> sittin (sub e -> i)
    // 3. sittin -> sitting (insert g)
    // Total: 3
    assert.strictEqual(levenshtein("kitten", "sitting"), 3);

    // flaw -> lawn:
    // 1. flaw -> law (delete f)
    // 2. law -> lawn (insert n)
    // Total: 2
    assert.strictEqual(levenshtein("flaw", "lawn"), 2);
  });

  t.test("case sensitivity", () => {
    assert.strictEqual(levenshtein("Hello", "hello"), 1);
  });

  t.test("one character missing or different on both sides", () => {
    // One character different on both sides at same position
    assert.strictEqual(levenshtein("abc", "adc"), 1);

    // One character different on both sides at different positions
    // 'abc' -> 'abd' (1 sub)
    // 'abc' -> 'gbc' (1 sub)
    assert.strictEqual(levenshtein("abc", "abd"), 1);

    // One character missing on one side, different on other
    // 'abcd' vs 'abd' -> distance 1 (delete c)
    // 'abcd' vs 'axce' -> distance 2 (sub b->x, insert e)
    assert.strictEqual(levenshtein("abcd", "abd"), 1);
  });
});

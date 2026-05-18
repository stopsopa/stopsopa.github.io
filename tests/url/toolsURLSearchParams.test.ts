import assert from "node:assert";
import { describe, it } from "node:test";

import { mergeURLSearchParams, cloneSearchParams, normalizeSearchParams, compareNormalizedSearchParams, sortSearchParamsByKeyThenValue } from "./toolsURLSearchParams.ts";

/**
 * node --test tests/url/toolsURLSearchParams.test.ts
 */
describe("mergeURLSearchParams", () => {
  it("should merge two URLSearchParams with distinct keys", () => {
    const a = new URLSearchParams("a=1&b=2");
    const b = new URLSearchParams("d=44&c=3&d=4");
    const merged = mergeURLSearchParams(a, b);
    assert.strictEqual(merged.toString(), "a=1&b=2&c=3&d=44&d=4");
  });

  it("should merge two URLSearchParams overwriting older keys and sorting", () => {
    const a = new URLSearchParams("a=1&b=2&d=99");
    const b = new URLSearchParams("d=44&c=3");
    const merged = mergeURLSearchParams(a, b);
    assert.strictEqual(merged.toString(), "a=1&b=2&c=3&d=44");
  });

  it("should merge three URLSearchParams where the last one wins", () => {
    const a = new URLSearchParams("a=1&b=1");
    const b = new URLSearchParams("b=2&c=2");
    const c = new URLSearchParams("c=3&d=3&b=3&c=33");
    const merged = mergeURLSearchParams(a, b, c);

    // a=1 (from a)
    // b=3 (from c)
    // c=3&c=33 (from c)
    // d=3 (from c)
    assert.strictEqual(merged.toString(), "a=1&b=3&c=3&c=33&d=3");
  });

  it("should correctly handle interleaving keys in multiple URLSearchParams", () => {
    const a = new URLSearchParams("z=9&x=1");
    const b = new URLSearchParams("y=2&x=22");
    const c = new URLSearchParams("a=5");
    const merged = mergeURLSearchParams(a, b, c);

    // Expected sorted: a=5, x=22, y=2, z=9
    assert.strictEqual(merged.toString(), "a=5&x=22&y=2&z=9");
  });

  it("should overwrite keys from earlier arguments with later ones", () => {
    const a = new URLSearchParams("a=1&b=2");
    const b = new URLSearchParams("b=3&c=4");
    const merged = mergeURLSearchParams(a, b);
    assert.strictEqual(merged.get("a"), "1");
    assert.strictEqual(merged.get("b"), "3");
    assert.strictEqual(merged.get("c"), "4");
    assert.strictEqual(merged.toString(), "a=1&b=3&c=4");
  });

  it("should handle empty arguments", () => {
    const merged = mergeURLSearchParams();
    assert.strictEqual(merged.toString(), "");
  });

  it("should merge more than two URLSearchParams", () => {
    const a = new URLSearchParams("a=1");
    const b = new URLSearchParams("b=2");
    const c = new URLSearchParams("c=3");
    const d = new URLSearchParams("a=4");
    const merged = mergeURLSearchParams(a, b, c, d);
    assert.strictEqual(merged.toString(), "a=4&b=2&c=3");
  });

  it("should merge two URLSearchParams with distinct keys", () => {
    const a = new URLSearchParams("a=1&b=2&d=99");
    const b = new URLSearchParams("d=44&c=3");
    const merged = mergeURLSearchParams(a, b);
    merged.sort();
    assert.strictEqual(merged.toString(), "a=1&b=2&c=3&d=44");
  });

  it("should only copy keys specified in the string array from subsequent URLSearchParams", () => {
    const a = new URLSearchParams("a=1&b=2");
    const b = new URLSearchParams("b=99&c=3&d=4");
    const merged = mergeURLSearchParams(a, ["b", "c"], b);

    // a=1 (from a, kept because a is first)
    // b=99 (from b, allowed by filter)
    // c=3 (from b, allowed by filter)
    // d=4 is IGNORED because it's not in the filter
    assert.strictEqual(merged.toString(), "a=1&b=99&c=3");
  });

  it("empty on start", () => {
    const z = new URLSearchParams("");
    const a = new URLSearchParams("a=1&b=2");
    const b = new URLSearchParams("b=99&c=3&d=4");
    const merged = mergeURLSearchParams(z, a, ["b", "c"], b);

    // a=1 (from a, kept because a is first)
    // b=99 (from b, allowed by filter)
    // c=3 (from b, allowed by filter)
    // d=4 is IGNORED because it's not in the filter
    assert.strictEqual(merged.toString(), "b=99&c=3");
  });

  it("repack multipe", () => {
    const z = new URLSearchParams("");
    const a = new URLSearchParams("a=a1&b=2&a=a2&z=zzz");
    const b = new URLSearchParams("b=99&n=nn&a=3&d=4&a=5");
    const merged = mergeURLSearchParams(z, a, ["a", "b", "c"], b);

    assert.strictEqual(merged.toString(), "a=3&a=5&b=99");
  });

  it("repack multipe - keep z", () => {
    const z = new URLSearchParams("z=zzz");
    const a = new URLSearchParams("a=a1&b=2&a=a2&");
    const b = new URLSearchParams("b=99&n=nn&a=3&d=4&a=5");
    const merged = mergeURLSearchParams(z, a, ["a", "b", "c"], b);

    assert.strictEqual(merged.toString(), "a=3&a=5&b=99&z=zzz");
  });

  it("repack multipe - without filter", () => {
    const z = new URLSearchParams("z=zzz");
    const a = new URLSearchParams("a=a1&b=2&a=a2&");
    const b = new URLSearchParams("b=99&n=nn&a=3&d=4&a=5");
    const merged = mergeURLSearchParams(z, a, b);

    assert.strictEqual(merged.toString(), "a=3&a=5&b=99&d=4&n=nn&z=zzz");
  });
});

describe("cloneSearchParams", () => {
  it("should create a new URLSearchParams instance with identical parameters", () => {
    const original = new URLSearchParams("a=1&b=2&a=3");
    const cloned = cloneSearchParams(original);

    // Verify it contains the exact same data
    assert.strictEqual(cloned.toString(), original.toString());
    assert.strictEqual(cloned.get("a"), "1");
    assert.deepStrictEqual(cloned.getAll("a"), ["1", "3"]);
    
    // Verify it is NOT the same object reference
    assert.notStrictEqual(cloned, original);

    // Verify mutation of clone does not affect original
    cloned.set("c", "4");
    assert.strictEqual(cloned.has("c"), true);
    assert.strictEqual(original.has("c"), false);
  });
});

describe("normalizeSearchParams", () => {
  it("should return a new sorted URLSearchParams instance", () => {
    const original = new URLSearchParams("z=1&a=2&m=3");
    const normalized = normalizeSearchParams(original);

    assert.strictEqual(normalized.toString(), "a=2&m=3&z=1");
    assert.notStrictEqual(normalized, original);
  });
});

describe("compareNormalizedSearchParams", () => {
  it("should return true for identical unsorted URLSearchParams", () => {
    const a = new URLSearchParams("z=1&a=2");
    const b = new URLSearchParams("a=2&z=1");
    
    assert.strictEqual(compareNormalizedSearchParams(a, b), true);
  });

  it("should return false for different URLSearchParams", () => {
    const a = new URLSearchParams("a=1&b=2");
    const b = new URLSearchParams("a=1&b=3");
    
    assert.strictEqual(compareNormalizedSearchParams(a, b), false);
  });

  it("should return true for complex overlapping search params", () => {
    const a = new URLSearchParams("foo=bar&baz=qux&foo=baz");
    const b = new URLSearchParams("baz=qux&foo=bar&foo=baz");
    assert.strictEqual(compareNormalizedSearchParams(a, b), true);
  });
});

describe("sortSearchParamsByKeyThenValue", () => {
  it("should sort parameters primarily by key, and secondarily by value", () => {
    const original = new URLSearchParams("b=2&a=3&a=1");
    const sorted = sortSearchParamsByKeyThenValue(original);

    // 'a' comes before 'b', and 'a=1' comes before 'a=3'
    assert.strictEqual(sorted.toString(), "a=1&a=3&b=2");
  });

  it("should correctly sort values lexicographically for identical keys", () => {
    const original = new URLSearchParams("x=zebra&x=apple&y=test&x=banana");
    const sorted = sortSearchParamsByKeyThenValue(original);

    // Keys sorted: x, x, x, y
    // x values sorted: apple, banana, zebra
    assert.strictEqual(sorted.toString(), "x=apple&x=banana&x=zebra&y=test");
  });

  it("should preserve empty URLSearchParams", () => {
    const original = new URLSearchParams("");
    const sorted = sortSearchParamsByKeyThenValue(original);

    assert.strictEqual(sorted.toString(), "");
  });
});

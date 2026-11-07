/**
 * Tests for Firebase Admin library.
 * Uses native node:test runner and section = 'stopsopa_web_tests'.
 * 
 * node --env-file .env --test pages/databases/firebase/lib.test.ts
 */

import assert from "node:assert";
import { it, describe, after } from "node:test";
import { getFirebase, deleteApp, normalizeUser, resolvePath } from "./lib.ts";

const SECTION = "stopsopa_web_tests";
const RAW_USER = process.env.FB_EMAIL;
if (!RAW_USER) {
  throw new Error("FB_EMAIL environment variable is required for tests");
}
const NORMALIZED_USER = normalizeUser(RAW_USER);

const fb = getFirebase();
const sec = fb.getSection(SECTION);

describe("Firebase library", () => {
  after(async () => {
    try {
      // Clean up test section in Firebase
      await sec.del();
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }

    // Delete Firebase app to release background listeners/connections
    await deleteApp(fb.app);
  });

  it("normalizeUser replaces dots with commas", () => {
    assert.strictEqual(normalizeUser("test.user@gmail.com"), "test,user@gmail,com");
    assert.strictEqual(sec.user, NORMALIZED_USER);
  });

  it("resolvePath uses FB_EMAIL when user is omitted", () => {
    assert.strictEqual(resolvePath(SECTION), `users/${NORMALIZED_USER}/${SECTION}`);
    assert.strictEqual(
      resolvePath(SECTION, "todos"),
      `users/${NORMALIZED_USER}/${SECTION}/todos`
    );
  });

  it("getroot resolves correct database path without passing user to getSection", () => {
    assert.strictEqual(sec.getroot(), `users/${NORMALIZED_USER}/${SECTION}`);
    assert.strictEqual(sec.getroot("todos"), `users/${NORMALIZED_USER}/${SECTION}/todos`);
    assert.strictEqual(
      sec.getroot(["todos", "item1"]),
      `users/${NORMALIZED_USER}/${SECTION}/todos/item1`
    );
  });

  it("unbound getSection() demands section and throws when not given", async () => {
    const unboundSec = fb.getSection();

    assert.throws(() => unboundSec.getroot("todos"), /section is not specified/);

    await assert.rejects(
      async () => {
        await unboundSec.get("todos");
      },
      /section is not specified/
    );

    await assert.rejects(
      async () => {
        await unboundSec.set({ key: "todos", data: { a: 1 } });
      },
      /section is not specified/
    );

    await assert.rejects(
      async () => {
        await unboundSec.push({ key: "todos", data: { a: 1 } });
      },
      /section is not specified/
    );

    await assert.rejects(
      async () => {
        await unboundSec.del("todos");
      },
      /section is not specified/
    );

    // When section is provided per-call, it succeeds
    const rootPath = unboundSec.getroot({ section: SECTION, key: "todos" });
    assert.strictEqual(rootPath, `users/${NORMALIZED_USER}/${SECTION}/todos`);
  });

  it("getFirebase throws when email is not given and FB_EMAIL is unset", () => {
    const origFbEmail = process.env.FB_EMAIL;
    try {
      delete process.env.FB_EMAIL;
      assert.throws(
        () => {
          getFirebase({ email: "" });
        },
        /getFirebase: email is required/
      );
    } finally {
      process.env.FB_EMAIL = origFbEmail;
    }
  });

  it("complete section CRUD lifecycle: push -> get -> set -> del", async () => {
    // 1. push
    const newPath = await sec.push({
      key: "todos",
      data: { text: "Buy bread", done: false },
    });
    assert.ok(typeof newPath === "string");
    assert.ok(newPath.startsWith(`users/${NORMALIZED_USER}/${SECTION}/todos/`));

    const itemId = newPath.split("/").pop()!;
    assert.ok(itemId.length > 0);

    // 2. get single item
    const item = await sec.get<{ text: string; done: boolean }>(`todos/${itemId}`);
    assert.ok(item);
    assert.strictEqual(item.text, "Buy bread");
    assert.strictEqual(item.done, false);

    // 3. get collection
    const collection = await sec.get<Record<string, { text: string; done: boolean }>>("todos");
    assert.ok(collection);
    assert.ok(collection[itemId]);
    assert.strictEqual(collection[itemId].text, "Buy bread");

    // 4. set (update)
    await sec.set({
      key: ["todos", itemId],
      data: { text: "Buy sourdough bread", done: true },
    });
    const updated = await sec.get<{ text: string; done: boolean }>([
      "todos",
      itemId,
    ]);
    assert.ok(updated);
    assert.strictEqual(updated.text, "Buy sourdough bread");
    assert.strictEqual(updated.done, true);

    // 5. del
    await sec.del(`todos/${itemId}`);
    const removed = await sec.get(`todos/${itemId}`);
    assert.strictEqual(removed, null);
  });
});

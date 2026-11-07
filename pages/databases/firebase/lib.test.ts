/**
 * Tests for Firebase Admin library and endpoints.
 * Uses native node:test runner and section = 'stopsopa_web_tests'.
 * 
 * node --env-file .env --test pages/databases/firebase/lib.test.ts
 */

import assert from "node:assert";
import { it, describe, after } from "node:test";
import { getFirebase, deleteApp, normalizeUser, resolvePath } from "./lib.ts";
import { createApp } from "./server.ts";
import type { Server } from "node:http";

const SECTION = "stopsopa_web_tests";
const RAW_USER = process.env.FB_EMAIL;
if (!RAW_USER) {
  throw new Error("FB_EMAIL environment variable is required for tests");
}
const NORMALIZED_USER = normalizeUser(RAW_USER);

const fb = getFirebase();
const sec = fb.getSection(SECTION);

describe("Firebase library & API endpoints", () => {
  let createdItemId = "";
  let server: Server;
  let serverBaseUrl = "";

  after(async () => {
    try {
      // Clean up test section in Firebase
      await sec.del();
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
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

  it("push adds a new item and returns full path", async () => {
    const newPath = await sec.push({
      key: "todos",
      data: { text: "Buy bread", done: false },
    });

    assert.ok(typeof newPath === "string");
    assert.ok(newPath.startsWith(`users/${NORMALIZED_USER}/${SECTION}/todos/`));

    createdItemId = newPath.split("/").pop()!;
    assert.ok(createdItemId.length > 0);
  });

  it("get reads individual item by sub-path", async () => {
    const item = await sec.get<{ text: string; done: boolean }>(
      `todos/${createdItemId}`
    );

    assert.ok(item);
    assert.strictEqual(item.text, "Buy bread");
    assert.strictEqual(item.done, false);
  });

  it("get reads collection mapping itemIds", async () => {
    const collection = await sec.get<Record<string, { text: string; done: boolean }>>(
      "todos"
    );

    assert.ok(collection);
    assert.ok(collection[createdItemId]);
    assert.strictEqual(collection[createdItemId].text, "Buy bread");
  });

  it("set overwrites item data", async () => {
    await sec.set({
      key: ["todos", createdItemId],
      data: { text: "Buy sourdough bread", done: true },
    });

    const updated = await sec.get<{ text: string; done: boolean }>([
      "todos",
      createdItemId,
    ]);

    assert.ok(updated);
    assert.strictEqual(updated.text, "Buy sourdough bread");
    assert.strictEqual(updated.done, true);
  });

  it("del removes item from database", async () => {
    await sec.del(`todos/${createdItemId}`);

    const removed = await sec.get(`todos/${createdItemId}`);
    assert.strictEqual(removed, null);
  });

  it("server HTTP endpoints test (push, get, set, del, getroot)", async () => {
    const testApp = createApp(SECTION);

    await new Promise<void>((resolve) => {
      server = testApp.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address === "object") {
          serverBaseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });

    // 0. GET /getroot
    const getrootRes = await fetch(`${serverBaseUrl}/getroot/http_todos`);
    const getrootJson = (await getrootRes.json()) as { success: boolean; path: string };
    assert.strictEqual(getrootJson.success, true);
    assert.strictEqual(getrootJson.path, `users/${NORMALIZED_USER}/${SECTION}/http_todos`);

    // 1. POST /push/http_todos
    const pushRes = await fetch(`${serverBaseUrl}/push/http_todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "From HTTP", completed: false }),
    });
    const pushJson = (await pushRes.json()) as { success: boolean; path: string; itemId: string };
    assert.strictEqual(pushJson.success, true);
    assert.ok(pushJson.itemId);
    assert.ok(pushJson.path.includes(NORMALIZED_USER));

    const httpItemId = pushJson.itemId;

    // 2. GET /get/http_todos/${httpItemId}
    const getRes = await fetch(`${serverBaseUrl}/get/http_todos/${httpItemId}`);
    const getJson = (await getRes.json()) as { success: boolean; data: { title: string; completed: boolean } };
    assert.strictEqual(getJson.success, true);
    assert.strictEqual(getJson.data.title, "From HTTP");

    // 3. POST /set/http_todos/${httpItemId}
    const setRes = await fetch(`${serverBaseUrl}/set/http_todos/${httpItemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "From HTTP Updated", completed: true }),
    });
    const setJson = (await setRes.json()) as { success: boolean };
    assert.strictEqual(setJson.success, true);

    // Verify updated
    const verifyRes = await fetch(`${serverBaseUrl}/get/http_todos/${httpItemId}`);
    const verifyJson = (await verifyRes.json()) as { success: boolean; data: { title: string; completed: boolean } };
    assert.strictEqual(verifyJson.data.title, "From HTTP Updated");
    assert.strictEqual(verifyJson.data.completed, true);

    // 4. DELETE /del/http_todos/${httpItemId}
    const delRes = await fetch(`${serverBaseUrl}/del/http_todos/${httpItemId}`, {
      method: "DELETE",
    });
    const delJson = (await delRes.json()) as { success: boolean };
    assert.strictEqual(delJson.success, true);

    // Verify deleted
    const verifyDelRes = await fetch(`${serverBaseUrl}/get/http_todos/${httpItemId}`);
    const verifyDelJson = (await verifyDelRes.json()) as { success: boolean; data: unknown };
    assert.strictEqual(verifyDelJson.data, null);
  });
});

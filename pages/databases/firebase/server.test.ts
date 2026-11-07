/**
 * Tests for Firebase Express server HTTP endpoints.
 * 
 * node --env-file .env --test pages/databases/firebase/server.test.ts
 */

import assert from "node:assert";
import { it, describe, after } from "node:test";
import { getFirebase, deleteApp, normalizeUser } from "./lib.ts";
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

describe("Firebase Express server endpoints", () => {
  let server: Server;
  let serverBaseUrl = "";

  after(async () => {
    try {
      await sec.del();
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    await deleteApp(fb.app);
  });

  it("server with pre-bound section: push -> get -> set -> del -> getroot without specifying section in request", async () => {
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

    // 1. GET /getroot
    const getrootRes = await fetch(`${serverBaseUrl}/getroot/http_todos`);
    const getrootJson = (await getrootRes.json()) as { success: boolean; path: string };
    assert.strictEqual(getrootJson.success, true);
    assert.strictEqual(getrootJson.path, `users/${NORMALIZED_USER}/${SECTION}/http_todos`);

    // 2. POST /push/http_todos
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

    // 3. GET /get/http_todos/${httpItemId}
    const getRes = await fetch(`${serverBaseUrl}/get/http_todos/${httpItemId}`);
    const getJson = (await getRes.json()) as { success: boolean; data: { title: string; completed: boolean } };
    assert.strictEqual(getJson.success, true);
    assert.strictEqual(getJson.data.title, "From HTTP");

    // 4. POST /set/http_todos/${httpItemId}
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

    // 5. DELETE /del/http_todos/${httpItemId}
    const delRes = await fetch(`${serverBaseUrl}/del/http_todos/${httpItemId}`, {
      method: "DELETE",
    });
    const delJson = (await delRes.json()) as { success: boolean };
    assert.strictEqual(delJson.success, true);

    // Verify deleted
    const verifyDelRes = await fetch(`${serverBaseUrl}/get/http_todos/${httpItemId}`);
    const verifyDelJson = (await verifyDelRes.json()) as { success: boolean; data: unknown };
    assert.strictEqual(verifyDelJson.data, null);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("server without pre-bound section demands section on each request and throws 400 when missing", async () => {
    const unboundApp = createApp(undefined);

    await new Promise<void>((resolve) => {
      server = unboundApp.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address === "object") {
          serverBaseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });

    // Request without section -> 400
    const failRes = await fetch(`${serverBaseUrl}/get/http_todos`);
    assert.strictEqual(failRes.status, 400);
    const failJson = (await failRes.json()) as { error: string };
    assert.ok(failJson.error.includes("section is not specified"));

    // Request with query ?section=... -> 200
    const successRes = await fetch(`${serverBaseUrl}/get/http_todos?section=${SECTION}`);
    assert.strictEqual(successRes.status, 200);
    const successJson = (await successRes.json()) as { success: boolean };
    assert.strictEqual(successJson.success, true);

    // Request with body { section: ... } -> 200
    const pushRes = await fetch(`${serverBaseUrl}/push/unbound_test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: SECTION, data: { ok: true } }),
    });
    assert.strictEqual(pushRes.status, 200);
    const pushJson = (await pushRes.json()) as { success: boolean; itemId: string };
    assert.strictEqual(pushJson.success, true);

    // Clean up
    await sec.del("unbound_test");
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});

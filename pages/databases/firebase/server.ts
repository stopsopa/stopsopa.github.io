/**
 * Express server providing HTTP endpoints for Firebase CRUD operations from getSection().
 *
 * User is set at getFirebase() level (via FB_EMAIL).
 * Section can be set via FB_SECTION env var:
 *   PORT=4398 HOST=0.0.0.0 FB_SECTION=test node --env-file .env pages/databases/firebase/server.ts
 *
 * If FB_SECTION is not set, section is required on every request:
 *   - Query param: ?section=my_section
 *   - Request body: { "section": "my_section", ... }
 *   - Header: x-section: my_section
 *
 * Endpoints:
 * - POST /push, POST /push/*key
 * - GET /get, GET /get/*key, POST /get
 * - POST /set, POST /set/*key, PUT /*key
 * - POST /del, DELETE /del, DELETE /del/*key, DELETE /*key
 * - GET /getroot, GET /getroot/*key
 */

import express, { type Request, type Response } from "express";
import { getFirebase } from "./lib.ts";

const PORT = Number(process.env.PORT || process.env.NODE_API_PORT || 7898);
const HOST = process.env.HOST || "0.0.0.0";

const getEnvSection = (): string | undefined => {
  const val = process.env.FB_SECTION?.trim();
  if (val) {
    return val;
  }
  return undefined;
};

/**
 * Creates and configures the Express application.
 * If sectionName is provided (or FB_SECTION env var), requests use it automatically.
 * Otherwise, each request must specify section via body, query (?section=...), or header (x-section).
 */
export function createApp(sectionName: string | undefined = getEnvSection()) {
  const cleanSection = sectionName?.trim() || undefined;
  const app = express();
  app.use(express.json());

  const fb = getFirebase();
  const sec = fb.getSection(cleanSection);

  /**
   * Helper to extract section from request or fall back to pre-bound section
   */
  const extractSection = (req: Request): string | undefined => {
    return (
      (req.body?.section as string) ||
      (req.query.section as string) ||
      (req.headers["x-section"] as string) ||
      undefined
    );
  };

  /**
   * Root overview and Firebase Console link
   */
  app.get("/", (_req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
<html>
<head><title>Firebase REST Gateway</title></head>
<body>
  <h1>Firebase RTDB Server</h1>
  <p>User: <code>${sec.user}</code></p>
  <p>Section: <code>${
    sec.section || "NOT CONFIGURED (required per-request via ?section=, body, or x-section)"
  }</code></p>
  <ul>
    <li><code>POST /push</code>, <code>POST /push/*key</code> - Insert child with push ID</li>
    <li><code>GET /get</code>, <code>GET /get/*key</code>, <code>POST /get</code> - Read item/tree</li>
    <li><code>POST /set</code>, <code>POST /set/*key</code>, <code>PUT /*key</code> - Overwrite item/tree</li>
    <li><code>POST /del</code>, <code>DELETE /del</code>, <code>DELETE /del/*key</code>, <code>DELETE /*key</code> - Delete item/tree</li>
    <li><code>GET /getroot</code>, <code>GET /getroot/*key</code> - Show resolved path</li>
  </ul>
  <p><a href="https://console.firebase.google.com/">https://console.firebase.google.com/</a></p>
</body>
</html>`);
  });

  /**
   * Handler for GET method (sec.get)
   */
  const handleGet = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const section = extractSection(req);
      const data = await sec.get({ key, section });
      res.json({ success: true, data });
    } catch (error: any) {
      const isClientError = error?.message?.includes("section is not specified");
      res.status(isClientError ? 400 : 500).json({ error: String(error?.message || error) });
    }
  };

  /**
   * Handler for SET method (sec.set)
   */
  const handleSet = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const section = extractSection(req);
      const data = req.body?.data !== undefined ? req.body.data : req.body;
      await sec.set({ key, data, section });
      const path = sec.getroot({ key, section });
      res.json({ success: true, path });
    } catch (error: any) {
      const isClientError = error?.message?.includes("section is not specified");
      res.status(isClientError ? 400 : 500).json({ error: String(error?.message || error) });
    }
  };

  /**
   * Handler for PUSH method (sec.push)
   */
  const handlePush = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const section = extractSection(req);
      const data = req.body?.data !== undefined ? req.body.data : req.body;
      const newPath = await sec.push({ key, data, section });
      const itemId = newPath.split("/").pop() || "";
      res.json({ success: true, path: newPath, itemId });
    } catch (error: any) {
      const isClientError = error?.message?.includes("section is not specified");
      res.status(isClientError ? 400 : 500).json({ error: String(error?.message || error) });
    }
  };

  /**
   * Handler for DEL method (sec.del)
   */
  const handleDel = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const section = extractSection(req);
      await sec.del({ key, section });
      const path = sec.getroot({ key, section });
      res.json({ success: true, path });
    } catch (error: any) {
      const isClientError = error?.message?.includes("section is not specified");
      res.status(isClientError ? 400 : 500).json({ error: String(error?.message || error) });
    }
  };

  /**
   * Handler for GETROOT method (sec.getroot)
   */
  const handleGetroot = (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const section = extractSection(req);
      const path = sec.getroot({ key, section });
      res.json({ success: true, path });
    } catch (error: any) {
      const isClientError = error?.message?.includes("section is not specified");
      res.status(isClientError ? 400 : 500).json({ error: String(error?.message || error) });
    }
  };

  // CRUD endpoints representing methods from getSection()
  app.get("/get", handleGet);
  app.get("/get/*key", handleGet);
  app.post("/get", handleGet);

  app.post("/set", handleSet);
  app.post("/set/*key", handleSet);
  app.put("/set/*key", handleSet);
  app.put("/*key", handleSet);

  app.post("/push", handlePush);
  app.post("/push/*key", handlePush);

  app.post("/del", handleDel);
  app.delete("/del", handleDel);
  app.delete("/del/*key", handleDel);
  app.delete("/*key", handleDel);

  app.get("/getroot", handleGetroot);
  app.get("/getroot/*key", handleGetroot);

  return app;
}

const defaultApp = createApp();

if (process.env.NODE_ENV !== "test") {
  defaultApp.listen(PORT, HOST, () => {
    console.log(`Firebase server running on http://${HOST}:${PORT}`);
  });
}

export default defaultApp;

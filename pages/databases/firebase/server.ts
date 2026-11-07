/**
 * Express server providing HTTP endpoints for Firebase CRUD operations from getSection().
 * User is set at the getFirebase() level (via FB_EMAIL) and section via getSection().
 *
 * Each express endpoint represents a CRUD method returned from getSection():
 * - sec.push()    -> POST /push, POST /push/*key
 * - sec.get()     -> GET /get, GET /get/*key, POST /get
 * - sec.set()     -> POST /set, POST /set/*key, PUT /*key
 * - sec.del()     -> POST /del, DELETE /del, DELETE /del/*key, DELETE /*key
 * - sec.getroot() -> GET /getroot, GET /getroot/*key
 *
 * Examples:
 *
 * 1. Insert new item (push):
 *    curl -X POST http://localhost:7898/push \
 *      -H "Content-Type: application/json" \
 *      -d '{"key":"todos","data":{"text":"Buy bread","done":false}}'
 *    # or
 *    curl -X POST http://localhost:7898/push/todos \
 *      -H "Content-Type: application/json" \
 *      -d '{"text":"Buy bread","done":false}'
 *
 * 2. Read collection or item (get):
 *    curl "http://localhost:7898/get?key=todos"
 *    # or
 *    curl "http://localhost:7898/get/todos"
 *
 * 3. Update/overwrite item (set):
 *    curl -X POST http://localhost:7898/set \
 *      -H "Content-Type: application/json" \
 *      -d '{"key":"todos/-Nxi98AbCdEf12345","data":{"text":"Buy bread","done":true}}'
 *
 * 4. Delete item or branch (del):
 *    curl -X POST http://localhost:7898/del \
 *      -H "Content-Type: application/json" \
 *      -d '{"key":"todos/-Nxi98AbCdEf12345"}'
 */

import express, { type Request, type Response } from "express";
import { getFirebase } from "./lib.ts";

const PORT = Number(process.env.PORT || process.env.NODE_API_PORT || 7898);
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Creates and configures the Express application bound to a specific section.
 */
export function createApp(sectionName: string = process.env.FB_SECTION || "antigravity_cli") {
  const app = express();
  app.use(express.json());

  const fb = getFirebase();
  const sec = fb.getSection(sectionName);

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
  <p>Section: <code>${sec.section}</code></p>
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
      const data = await sec.get(key);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  /**
   * Handler for SET method (sec.set)
   */
  const handleSet = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const data = req.body?.data !== undefined ? req.body.data : req.body;
      await sec.set({ key, data });
      res.json({ success: true, path: sec.getroot(key) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  /**
   * Handler for PUSH method (sec.push)
   */
  const handlePush = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      const data = req.body?.data !== undefined ? req.body.data : req.body;
      const newPath = await sec.push({ key, data });
      const itemId = newPath.split("/").pop() || "";
      res.json({ success: true, path: newPath, itemId });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  /**
   * Handler for DEL method (sec.del)
   */
  const handleDel = async (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      await sec.del(key);
      res.json({ success: true, path: sec.getroot(key) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  /**
   * Handler for GETROOT method (sec.getroot)
   */
  const handleGetroot = (req: Request, res: Response) => {
    try {
      const key = (req.params as Record<string, any>).key || req.body?.key || (req.query.key as string) || "";
      res.json({ success: true, path: sec.getroot(key) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
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

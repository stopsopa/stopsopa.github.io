/**
 * Express server providing HTTP endpoints replicating Firebase operations from USAGE.md (get, set, push, del).
 *
 * Examples:
 *
 * 1. Insert new item (push):
 *    curl -X POST http://localhost:7898/push \
 *      -H "Content-Type: application/json" \
 *      -d '{"user":"john,doe@gmail,com","section":"my_namespace","key":"todos","data":{"text":"Buy bread","done":false}}'
 *
 * 2. Read collection or item (get):
 *    curl "http://localhost:7898/get?user=john,doe@gmail,com&section=my_namespace&key=todos"
 *
 * 3. Update/overwrite item (set):
 *    curl -X POST http://localhost:7898/set \
 *      -H "Content-Type: application/json" \
 *      -d '{"user":"john,doe@gmail,com","section":"my_namespace","key":"todos/-Nxi98AbCdEf12345","data":{"text":"Buy bread","done":true}}'
 *
 * 4. Delete item or branch (del):
 *    curl -X POST http://localhost:7898/del \
 *      -H "Content-Type: application/json" \
 *      -d '{"user":"john,doe@gmail,com","section":"my_namespace","key":"todos/-Nxi98AbCdEf12345"}'
 */

import express, { type Request, type Response } from "express";
import { getFirebase } from "./lib.ts";

const app = express();
app.use(express.json());

const fb = getFirebase();

const PORT = Number(process.env.PORT || process.env.NODE_API_PORT || 7898);
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Root endpoint - usage overview and Firebase Console link
 */
app.get("/", (_req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html>
<head><title>Firebase REST Gateway</title></head>
<body>
  <h1>Firebase RTDB Server</h1>
  <p>Available endpoints replicating USAGE.md methods:</p>
  <ul>
    <li><code>POST /push</code> or <code>POST /api/:user/:section/*</code> - Insert child with push ID</li>
    <li><code>GET /get</code>, <code>POST /get</code> or <code>GET /api/:user/:section/*</code> - Read collection/item</li>
    <li><code>POST /set</code> or <code>PUT /api/:user/:section/*</code> - Overwrite item/tree</li>
    <li><code>POST /del</code>, <code>DELETE /del</code> or <code>DELETE /api/:user/:section/*</code> - Delete item/tree</li>
  </ul>
  <p><a href="https://console.firebase.google.com/">https://console.firebase.google.com/</a></p>
</body>
</html>`);
});

/**
 * Handler for GET operation
 */
async function handleGet(req: Request, res: Response) {
  try {
    const user = (req.body?.user || req.query.user) as string;
    const section = (req.body?.section || req.query.section) as string;
    const key = (req.body?.key ?? req.query.key) as string | string[] | undefined;

    if (user && section) {
      const data = await fb.getPath(user, section, key);
      res.json({ success: true, data });
    } else {
      res.status(400).json({ error: "Missing required 'user' or 'section' parameter" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

/**
 * Handler for SET operation
 */
async function handleSet(req: Request, res: Response) {
  try {
    const { user, section, key, data } = req.body || {};

    if (user && section && key !== undefined) {
      const path = await fb.setPath(user, section, key, data);
      res.json({ success: true, path });
    } else {
      res.status(400).json({ error: "Missing required 'user', 'section', or 'key' parameter" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

/**
 * Handler for PUSH operation
 */
async function handlePush(req: Request, res: Response) {
  try {
    const { user, section, key, data } = req.body || {};

    if (user && section) {
      const result = await fb.pushPath(user, section, key || "", data);
      res.json({ success: true, ...result });
    } else {
      res.status(400).json({ error: "Missing required 'user' or 'section' parameter" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

/**
 * Handler for DEL operation
 */
async function handleDel(req: Request, res: Response) {
  try {
    const user = (req.body?.user || req.query.user) as string;
    const section = (req.body?.section || req.query.section) as string;
    const key = (req.body?.key ?? req.query.key) as string | string[];

    if (user && section && key !== undefined) {
      const path = await fb.delPath(user, section, key);
      res.json({ success: true, path });
    } else {
      res.status(400).json({ error: "Missing required 'user', 'section', or 'key' parameter" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

// Direct method endpoints matching USAGE.md names
app.get("/get", handleGet);
app.post("/get", handleGet);
app.post("/set", handleSet);
app.post("/push", handlePush);
app.post("/del", handleDel);
app.delete("/del", handleDel);

// RESTful route handlers: /api/:user/:section/*
app.get("/api/:user/:section", (req, res) => {
  req.query.user = req.params.user;
  req.query.section = req.params.section;
  req.query.key = "";
  return handleGet(req, res);
});

app.get("/api/:user/:section/*", (req, res) => {
  const wildcard = (req.params as Record<string, any>)[0] || "";
  req.query.user = req.params.user;
  req.query.section = req.params.section;
  req.query.key = wildcard;
  return handleGet(req, res);
});

app.post("/api/:user/:section", (req, res) => {
  req.body = req.body || {};
  req.body.user = req.params.user;
  req.body.section = req.params.section;
  req.body.key = "";
  return handlePush(req, res);
});

app.post("/api/:user/:section/*", (req, res) => {
  const wildcard = (req.params as Record<string, any>)[0] || "";
  req.body = req.body || {};
  req.body.user = req.params.user;
  req.body.section = req.params.section;
  req.body.key = wildcard;
  return handlePush(req, res);
});

app.put("/api/:user/:section/*", (req, res) => {
  const wildcard = (req.params as Record<string, any>)[0] || "";
  req.body = req.body || {};
  req.body.user = req.params.user;
  req.body.section = req.params.section;
  req.body.key = wildcard;
  return handleSet(req, res);
});

app.delete("/api/:user/:section/*", (req, res) => {
  const wildcard = (req.params as Record<string, any>)[0] || "";
  req.body = req.body || {};
  req.body.user = req.params.user;
  req.body.section = req.params.section;
  req.body.key = wildcard;
  return handleDel(req, res);
});

app.listen(PORT, HOST, () => {
  console.log(`Firebase server running on http://${HOST}:${PORT}`);
});

export default app;

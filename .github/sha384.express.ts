/**
 * Local (server.js) counterpart of .github/sha384.sh - see .github/sha384.md
 *
 * .github/sha384.sh replaces markers "sha384.sh::path/to/file" in html files only during the build in CI,
 * so pages served by local server.js still contain raw markers.
 * This router provides hashes on demand, so .github/sha384.browser.ts can replace markers in the browser.
 *
 * Mount in server.js (before express.static):
 *
 *   import sha384Express from "./.github/sha384.express.js";
 *
 *   app.use("/sha384", sha384Express(web));
 *
 * Endpoints (relative to the mount point):
 *
 *   POST /hash   (all paths found on the page in one request)
 *     body: {"paths":["pages/node/curl.js","pages/not/existing.js"]}
 *     200 {
 *       "hashes": {"pages/node/curl.js":"sha384-OdBGfw1BV7BWBiuVl5BDC5KREOG6aHeoK9kCLSvM7rczqmRDoc/u2ViiBp6LmeDy"},
 *       "errors": {"pages/not/existing.js":"file doesn't exist, resolved to >/abs/path/pages/not/existing.js<"}
 *     }
 *     always 200 when body is valid - what can be hashed lands in "hashes", the rest in "errors" with exact reason
 *     400 {"error":"..."}   body is not {"paths": string[]}
 *
 *   GET /hash?path=pages/node/curl.js   (single file, handy for manual testing)
 *     200 {"path":"pages/node/curl.js","hash":"sha384-..."}
 *     400 {"error":"..."}   path not given or not allowed
 *     404 {"error":"..."}   file doesn't exist
 *
 *   GET /browser.js
 *     serves transpiled .github/sha384.browser.js
 *     (express.static ignores directories starting with a dot, so it can't be loaded directly)
 */
import path from "node:path";

import fs from "node:fs";

import crypto from "node:crypto";

import { fileURLToPath } from "node:url";

import express from "express";

import type { Request, Response, Router } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browserModule = path.resolve(__dirname, "sha384.browser.js");

/**
 * the same result as:
 *   openssl dgst -sha384 -binary FILE | base64
 * and the same as .github/sha384.cjs is generating
 */
export function sha384(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha384");

    const stream = fs.createReadStream(file);

    stream.on("data", (data) => hash.update(data));

    stream.on("end", () => resolve(`sha384-${hash.digest("base64")}`));

    stream.on("error", reject);
  });
}

/**
 * Resolves path from the marker (relative to the root of the repository) to absolute path.
 * Returns null if path is trying to escape root directory or is pointing to hidden file/directory (.env, .git ...)
 */
export function resolveSafe(root: string, relative: string): string | null {
  const absolute = path.resolve(root, relative);

  const back = path.relative(root, absolute);

  if (!back || back.startsWith("..") || path.isAbsolute(back)) {
    return null;
  }

  if (back.split(path.sep).some((segment) => segment.startsWith("."))) {
    return null;
  }

  return absolute;
}

type Result = { hash: string } | { error: string; status: number };

/**
 * Never throws - returns hash or exact reason why hash can't be generated
 */
export async function hashRelative(root: string, relative: unknown): Promise<Result> {
  if (typeof relative !== "string" || !relative.trim()) {
    return { status: 400, error: `path is not defined or is not a string` };
  }

  const absolute = resolveSafe(root, relative);

  if (!absolute) {
    return {
      status: 400,
      error: `path is not allowed (outside of the repository or hidden file/directory), resolved to >${path.resolve(
        root,
        relative
      )}<`,
    };
  }

  if (!fs.existsSync(absolute)) {
    return { status: 404, error: `file doesn't exist, resolved to >${absolute}<` };
  }

  if (!fs.statSync(absolute).isFile()) {
    return { status: 404, error: `path is not a file, resolved to >${absolute}<` };
  }

  try {
    return { hash: await sha384(absolute) };
  } catch (e) {
    return { status: 500, error: `can't read file >${absolute}<: ${e}` };
  }
}

export default function sha384Express(root: string): Router {
  const router = express.Router();

  root = path.resolve(root);

  router.post("/hash", express.json(), async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");

    const paths: unknown = req.body?.paths;

    if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
      res.status(400).json({ error: `sha384.express error: body should be {"paths": string[]}` });

      return;
    }

    const hashes: Record<string, string> = {};

    const errors: Record<string, string> = {};

    await Promise.all(
      Array.from(new Set<string>(paths)).map(async (relative) => {
        const result = await hashRelative(root, relative);

        if ("hash" in result) {
          hashes[relative] = result.hash;
        } else {
          errors[relative] = result.error;
        }
      })
    );

    res.json({ hashes, errors });
  });

  router.get("/hash", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");

    const relative = req.query.path;

    const result = await hashRelative(root, relative);

    if ("hash" in result) {
      res.json({ path: relative, hash: result.hash });

      return;
    }

    res.status(result.status).json({ error: `sha384.express error: >${relative}<: ${result.error}` });
  });

  router.get("/browser.js", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");

    if (!fs.existsSync(browserModule)) {
      res
        .status(404)
        .type("text/plain")
        .send(`sha384.express error: ${browserModule} doesn't exist, run: /bin/bash transpile.sh transpile.ignore`);

      return;
    }

    res.type("application/javascript").send(fs.readFileSync(browserModule, "utf8"));
  });

  return router;
}

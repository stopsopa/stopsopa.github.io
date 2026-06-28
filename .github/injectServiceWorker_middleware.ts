import path from "node:path";
import { readFile } from "node:fs/promises";
import type { Request, Response, NextFunction } from "express";
import { injectHtml } from "./injectServiceWorker.js";

/**
 * Injects service worker script into HTML files as they are served.
 */
export function injectServiceWorkerMiddleware(webRoot: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only care about HTML files
      if (!req.path.endsWith(".html")) {
        return next();
      }

      const filePath = path.join(webRoot, req.path);
      const html = await readFile(filePath, "utf8");
      const updated = injectHtml(html);

      if (updated !== null) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(updated);
      }

      return next();
    } catch (err) {
      console.error("injectServiceWorkerMiddleware error:", err);
      return next(); // never block serving
    }
  };
}

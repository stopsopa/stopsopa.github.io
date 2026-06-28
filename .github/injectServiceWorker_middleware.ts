import path from "node:path";
import { readFile } from "node:fs/promises";
import type { Request, Response, NextFunction } from "express";
import { injectHtml, formatTime } from "./injectServiceWorker.ts";

/**
 * Injects service worker script into HTML files as they are served.
 */
export function injectServiceWorkerMiddleware(webRoot: string) {
  const serverStartTime = formatTime(new Date());

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle dynamic injection in sw.js on-the-fly
      if (req.path === "/sw.js") {
        const filePath = path.join(webRoot, "sw.js");
        const swContent = await readFile(filePath, "utf8");
        const match = swContent.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/);
        if (match) {
          const currentVal = match[1];
          const baseName = currentVal.replace(/-\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$/, "");
          const newVal = `${baseName}-${serverStartTime}`;
          const updated = swContent.replace(
            /const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/,
            `const CACHE_NAME = "${newVal}"`
          );
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          return res.send(updated);
        }
      }

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

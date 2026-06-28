import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import { injectServiceWorker } from "./injectServiceWorker.js";

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

      await injectServiceWorker(filePath);

      return next();
    } catch (err) {
      console.error("injectServiceWorkerMiddleware error:", err);
      return next(); // never block serving
    }
  };
}

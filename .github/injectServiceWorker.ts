/**
 * Purpose:
 *   Injects a Service Worker registration script into HTML files and updates
 *   the cache version (CACHE_NAME) in sw.js based on the execution or server start time.
 *
 * Usage:
 *   1. Build/CLI: Used via .github/injectServiceWorker.sh to inject the service
 *      worker registration script into HTML files in-place on disk, and updates
 *      sw.js on disk with the build timestamp.
 *   2. Express: Used dynamically via .github/injectServiceWorker_middleware.ts in server.js
 *      to inject the registration script into HTML files in-flight (on the fly, without modifying
 *      files on disk) and rewrite the CACHE_NAME in sw.js on the fly with the server start time.
 *
 * Note:
 *   This explanation also exists in .github/injectServiceWorker.ts.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swPath = path.resolve(__dirname, "../sw.js");

/**
 * Formats a Date object to "YYYY_MM_DD_HH_mm_ss" format.
 */
export function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}_${pad(date.getHours())}_${pad(
    date.getMinutes()
  )}_${pad(date.getSeconds())}`;
}

/**
 * Reads sw.js and extracts the CACHE_NAME value.
 */
export async function getCacheName(): Promise<string> {
  try {
    const swContent = await readFile(swPath, "utf8");
    const match = swContent.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/);
    return match ? match[1] : "default-cache";
  } catch {
    return "default-cache";
  }
}

/**
 * Injects the service worker registration script into the HTML string before the first <head>.
 *
 * @returns The updated HTML string, or null if no injection was done.
 */
export function injectHtml(html: string, version: string): string | null {
  // Avoid injecting twice if the script is rerun.
  if (html.includes('navigator.serviceWorker.register("/sw.js')) {
    return null;
  }

  const snippet = `
    <script type="module">
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js?t=${version}");
        }
    </script>`;

  // Insert before the first <head...> only.
  const updated = html.replace(/\s*<head\b[^>]*>/i, `${snippet}$&`);

  if (updated === html) {
    return null;
  }

  return updated;
}

/**
 * Updates sw.js cache name in-place on disk with the provided execution timestamp.
 */
export async function injectServiceWorkerInSwFile(version?: string): Promise<boolean> {
  try {
    const swContent = await readFile(swPath, "utf8");
    const match = swContent.match(/const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/);
    if (!match) {
      return false;
    }
    const currentVal = match[1];
    const baseName = currentVal.replace(/-\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$/, "");
    const activeVersion = version || formatTime(new Date());
    const newVal = `${baseName}-${activeVersion}`;

    if (currentVal === newVal) {
      return false;
    }

    const updated = swContent.replace(
      /const\s+CACHE_NAME\s*=\s*["']([^"']+)["']/,
      `const CACHE_NAME = "${newVal}"`
    );

    await writeFile(swPath, updated);
    return true;
  } catch (err) {
    console.error("Failed to update sw.js:", err);
    return false;
  }
}

/**
 * Injects the service worker registration script before the first <head>.
 *
 * @returns true if the file was modified, false otherwise.
 */
export async function injectServiceWorker(file: string, version?: string): Promise<boolean> {
  const html = await readFile(file, "utf8");
  const activeVersion = version || formatTime(new Date());
  const updated = injectHtml(html, activeVersion);

  if (updated === null) {
    return false;
  }

  await writeFile(file, updated);

  return true;
}

// Execute as a CLI only when this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const version = formatTime(new Date());
    if (await injectServiceWorkerInSwFile(version)) {
      console.log("Updated sw.js");
    }

    const chunks: Buffer[] = [];

    for await (const chunk of process.stdin) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const input = Buffer.concat(chunks).toString("utf8");

    // Support both:
    //   grep -rl  -> newline-separated
    //   grep -Zrl -> NUL-separated
    const files = input
      .split(/\0|\r?\n/)
      .map((file) => file.trim())
      .filter(Boolean);

    for (const file of files) {
      if (await injectServiceWorker(file, version)) {
        console.log(`Updated ${file}`);
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

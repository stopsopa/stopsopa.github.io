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
export function injectHtml(html: string, cacheName: string, version: string): string | null {
  // Avoid injecting twice if the script is rerun.
  if (html.includes('navigator.serviceWorker.register("/sw.js')) {
    return null;
  }

  const snippet = `
    <script type="module">
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js?c=${cacheName}&v=${version}");
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
 * Injects the service worker registration script before the first <head>.
 *
 * @returns true if the file was modified, false otherwise.
 */
export async function injectServiceWorker(file: string): Promise<boolean> {
  const html = await readFile(file, "utf8");
  const cacheName = await getCacheName();
  const version = formatTime(new Date());
  const updated = injectHtml(html, cacheName, version);

  if (updated === null) {
    return false;
  }

  await writeFile(file, updated);

  return true;
}

// Execute as a CLI only when this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
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
      if (await injectServiceWorker(file)) {
        console.log(`Updated ${file}`);
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

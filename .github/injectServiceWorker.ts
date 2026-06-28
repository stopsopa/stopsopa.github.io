import { readFile, writeFile } from "node:fs/promises";

const snippet = `
    <script type="module">
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
        }
    </script>`;

/**
 * Injects the service worker registration script before the first <head>.
 *
 * @returns true if the file was modified, false otherwise.
 */
export async function injectServiceWorker(file: string): Promise<boolean> {
  const html = await readFile(file, "utf8");

  // Avoid injecting twice if the script is rerun.
  if (html.includes('navigator.serviceWorker.register("/sw.js")')) {
    return false;
  }

  // Insert before the first <head...> only.
  const updated = html.replace(/\s*<head\b[^>]*>/i, `${snippet}$&`);

  if (updated === html) {
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

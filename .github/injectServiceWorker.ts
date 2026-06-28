import { readFile, writeFile } from "node:fs/promises";

const snippet = `<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
</script>
`;

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
    const html = await readFile(file, "utf8");

    // Avoid injecting twice if the script is rerun.
    if (html.includes('navigator.serviceWorker.register("/sw.js")')) {
      continue;
    }

    // Insert before the first <head...> only.
    const updated = html.replace(/<head\b[^>]*>/i, `${snippet}$&`);

    if (updated !== html) {
      await writeFile(file, updated);
      console.log(`Updated ${file}`);
    }
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}

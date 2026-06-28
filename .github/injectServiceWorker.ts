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
    chunks.push(chunk);
  }

  const input = Buffer.concat(chunks).toString("utf8");

  // grep -Z emits NUL-separated filenames
  const files = input.split("\0").filter(Boolean);

  for (const file of files) {
    const html = await readFile(file, "utf8");

    // Skip if already injected
    if (html.includes('navigator.serviceWorker.register("/sw.js")')) {
      continue;
    }

    const updated = html.replace(/<head\b[^>]*>/i, `${snippet}$&`);

    if (updated !== html) {
      await writeFile(file, updated);
      console.log(`Updated ${file}`);
    }
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}

import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

import { execSync } from "node:child_process";

let unitFilesRaw: Buffer;
try {
  unitFilesRaw = execSync("/bin/bash vitest.config.sh");
} catch (e: any) {
  throw new Error(
    `vitest.config.ts error: vitest.config.sh failed with status ${e.status}. stderr: ${e.stderr?.toString()}`
  );
}

const unitFiles = unitFilesRaw.toString().trim().split("\n").filter(Boolean);

const coverageInclude = unitFiles.flatMap((f) => {
  const base = f.replace(/\.unit\.ts$/, "");
  for (const ext of [".ts", ".js", ".tsx", ".jsx"]) {
    const file = base + ext;
    if (fs.existsSync(file)) {
      return [file.replace(/^\.\//, "")];
    }
  }
  return [];
});

console.log(`    
============================== vvv
${coverageInclude.join("\n")}
============================== ^^^
  
`);

// https://vitest.dev/guide/#configuring-vitest
export default defineConfig({
  test: {
    name: "test",
    environment: "node", // that is actually default:
    coverage: {
      all: true,
      // provider: "istanbul", // or 'v8'
      // provider: "v8",
      reporter: ["text", "html"],
      include: coverageInclude,
    },
    globals: true,
    include: ["**/*.unit.ts"],
    exclude: [
      // https://vitest.dev/config/#exclude
      "**/node_modules/**",
      "jasmine/**",
      // "pages/encryptor/aes.jasmine.unit.js",
    ],
  },
});

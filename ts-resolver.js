import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * A tiny Node.js loader to resolve .js imports to .ts files.
 * This allows native Node --experimental-strip-types to work with
 * the extension-style required by Vite/TSC.
 */
export async function resolve(specifier, context, nextResolve) {
  // Only intercept relative imports ending in .js
  if (specifier.startsWith(".") && specifier.endsWith(".js")) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err.code === "ERR_MODULE_NOT_FOUND") {
        // Fallback: Check if the .ts version exists
        const tsSpecifier = specifier.replace(/\.js$/, ".ts");
        const parentPath = fileURLToPath(context.parentURL);
        const tsPath = join(dirname(parentPath), tsSpecifier);

        if (existsSync(tsPath)) {
          return nextResolve(tsSpecifier, context);
        }
      }
      throw err;
    }
  }
  return nextResolve(specifier, context);
}

import { stat } from "node:fs/promises";

async function tryExt(specifier, context, nextResolve, ext) {
  try {
    const path = `${specifier}${ext}`;
    await stat(new URL(path, context.parentURL));
    return nextResolve(path, context);
  } catch (e) {
    throw new Error(`Module not found: ${specifier}`);
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("file://")) {
    return nextResolve(specifier, context);
  }

  try {
    return await tryExt(specifier, context, nextResolve, "");
  } catch (e) {
    try {
      return await tryExt(specifier, context, nextResolve, ".ts");
    } catch (e) {
      try {
        return await tryExt(specifier, context, nextResolve, ".js");
      } catch {
        throw new Error(`Module not found: ${specifier}`);
      }
    }
  }
}

import { stat } from "node:fs/promises";

async function resolutionAttempt(specifier, context, nextResolve, ext) {
  try {
    const path = `${specifier}${ext}`;
    await stat(new URL(path, context.parentURL));
    return nextResolve(path, context);
  } catch (e) {
    return false;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("file://")) {
    return nextResolve(specifier, context);
  }

  let loaded;

  loaded = await resolutionAttempt(specifier, context, nextResolve, "");

  if (loaded) {
    return loaded;
  }

  loaded = await resolutionAttempt(specifier, context, nextResolve, ".ts");

  if (loaded) {
    return loaded;
  }

  loaded = await resolutionAttempt(specifier, context, nextResolve, ".js");

  if (loaded) {
    return loaded;
  }

  throw new Error(`Module not found: ${specifier}`);
}

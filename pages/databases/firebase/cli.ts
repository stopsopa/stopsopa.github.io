/**
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts
{
  current: 'eagereuler@gmail,com',
  models: [ 'Gemini 3.8 Flash', 'Claude Sonnet 4.6 (Thinking)' ],
  renewalHours: 168
}
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ 
 */

import { getFirebase, deleteApp } from "./lib.ts";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function parseJsonSafe(str: string): any {
  try {
    return JSON.parse(str);
  } catch (err: any) {
    throw new Error(`Invalid JSON on stdin: ${err.message}`);
  }
}

const { app, getSection } = getFirebase();

try {
  const args = process.argv.slice(2);
  const stdinRaw = await readStdin();
  const stdinJson = stdinRaw ? parseJsonSafe(stdinRaw) : undefined;

  let method = args[0]?.toLowerCase() || "get";
  let key: string | string[] | undefined = args[1];
  let section: string | undefined = process.env.FB_SECTION?.trim() || undefined;
  let data: any;

  // Extract section, key, and data from stdin JSON if present
  if (stdinJson !== undefined) {
    if (typeof stdinJson === "object" && stdinJson !== null && !Array.isArray(stdinJson)) {
      if (stdinJson.section !== undefined) {
        section = String(stdinJson.section).trim() || undefined;
      }
      if (stdinJson.key !== undefined && key === undefined) {
        key = stdinJson.key;
      }
      if (stdinJson.data !== undefined) {
        data = stdinJson.data;
      } else {
        const { section: _s, key: _k, ...rest } = stdinJson;
        if (Object.keys(rest).length > 0 || (stdinJson.section === undefined && stdinJson.key === undefined)) {
          data = stdinJson.section !== undefined || stdinJson.key !== undefined ? rest : stdinJson;
        }
      }
    } else {
      data = stdinJson;
    }
  }

  // Demand section if not specified via env var or stdin JSON
  if (!section) {
    throw new Error(
      'Section is not specified: provide it via FB_SECTION env var or in stdin JSON { "section": "..." }'
    );
  }

  // Demand data for set and push
  if ((method === "set" || method === "push") && data === undefined) {
    throw new Error(`Method "${method}" requires JSON data on stdin`);
  }

  const sec = getSection(section);

  switch (method) {
    case "get": {
      const result = await sec.get(key);
      console.log(JSON.stringify(result));
      break;
    }
    case "set": {
      await sec.set({ key, data, section });
      const path = sec.getroot(key, section);
      console.log(path);
      break;
    }
    case "push": {
      const newPath = await sec.push({ key, data, section });
      console.log(newPath);
      break;
    }
    case "del":
    case "delete": {
      await sec.del(key, section);
      const path = sec.getroot(key, section);
      console.log(path);
      break;
    }
    case "getroot":
    case "root": {
      const path = sec.getroot(key, section);
      console.log(path);
      break;
    }
    default: {
      console.error(`Unknown method "${method}". Available methods: get, set, push, del, getroot`);
      process.exitCode = 1;
    }
  }
} finally {
  await deleteApp(app);
}

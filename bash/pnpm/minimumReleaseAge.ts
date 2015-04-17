#!/usr/bin/env node

/**
 * 
export __MINIMUMRELEASEAGE=@koa/router
export __MINIMUMRELEASEAGE_MODE=dev|prod
NODE_OPTIONS= pnpm view "${__MINIMUMRELEASEAGE}" name time --json | NODE_OPTIONS= node bash/pnpm/minimumReleaseAge.ts ${__MINIMUMRELEASEAGE_MODE}

 * to find version which satisfies 
 * minimumReleaseAge: 43200 from pnpm-workspace.yaml
 * 
 * Assuming file pnpm-workspace.yaml exist with content

vvvvvvv
cat <<EEE > pnpm-workspace.yaml
# 30 days - run    pnpm config get minimumReleaseAge    to see value
minimumReleaseAge: 43200
# to see how to find valid version of given library see bash/pnpm/minimumReleaseAge.ts

EEE
^^^^^^^

 */

type TimeMap = Record<string, string>;

const MIN_AGE_DAYS = Number(process.env.MIN_AGE_DAYS ?? 30);
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

const mode = process.argv[2];
if (!mode || (mode !== "dev" && mode !== "prod")) {
  throw new Error("Parameter 'dev' or 'prod' is required as the first argument.");
}
let pkgName = process.argv[3] || "[library]";
const installCmd = mode === "dev" ? "pnpm install -D" : "pnpm install";

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function error(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

(async () => {
  const raw = await readStdin();

  if (!raw || raw.trim().length === 0) {
    error("No input provided. Expected: pnpm view <pkg> name time --json | node minimumReleaseAge.ts <dev|prod>");
  }

  let data: TimeMap;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (parsed.name && parsed.time && typeof parsed.time === "object") {
        pkgName = parsed.name;
        data = parsed.time;
      } else {
        data = parsed;
      }
    } else {
      throw new Error("Invalid structure");
    }
  } catch (e) {
    error("Invalid JSON input (expected pnpm --json output)");
  }

  const now = Date.now();

  const rows = Object.entries(data).map(([version, time]) => {
    const t = new Date(time).getTime();
    const age = now - t;

    return {
      version,
      time,
      ageDays: +(age / 86400000).toFixed(2),
      ok: age >= MIN_AGE_MS,
    };
  });

  rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const okRows = rows.filter((r) => r.ok);

  console.log(`\nMinimum age: ${MIN_AGE_DAYS} days\n`);
  console.log(`Total versions: ${rows.length}`);
  console.log(`Valid versions: ${okRows.length}\n`);

  for (const r of rows) {
    const mark = r.ok ? "✅" : "❌";
    const versionStr = r.version.padEnd(20);
    const ageStr = `${r.ageDays}d`.padStart(10);
    const cmdStr = r.ok ? `pnpm remove ${pkgName} && ${installCmd} ${pkgName}@${r.version}` : "";
    console.log(`${mark} ${versionStr} | ${ageStr} | ${r.time} | ${cmdStr}`);
  }

  const best = okRows[0];

  if (best) {
    console.log(`\n👉 Best matching version: ${best.version}`);
  } else {
    console.log("\n⚠️ No versions satisfy minimumReleaseAge");
  }
})();

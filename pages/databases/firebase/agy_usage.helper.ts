/**
 * Helper methods for agy_usage.sh
 *
 * Examples:
 *   node agy_usage.helper.ts normalize_time "2026-11-14T18:23:34Z"
 *   agy --print "/usage" --output-format json | node agy_usage.helper.ts transform_usage
 *   node agy_usage.helper.ts print_diff '<beforeJson>' '<afterJson>'
 */

export {};

const mode = process.argv[2];

/**
 * Normalizes ISO date string to full milliseconds format: YYYY-MM-DDTHH:mm:ss.sssZ
 */
function normalizeTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return isoString;
  }
  return d.toISOString();
}

/**
 * Reads all input from standard input as string.
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Maps agy group names to target Firebase model keys.
 * Map definition:
 *   "Gemini Models" -> "Gemini%203%2E8%20Flash"
 *   "Claude and GPT models" -> "Claude%20Sonnet%204%2E6%20(Thinking)"
 */
const DEFAULT_MAP: Record<string, string> = {
  "Gemini Models": "Gemini%203%2E8%20Flash",
  "Claude and GPT models": "Claude%20Sonnet%204%2E6%20(Thinking)",
};

/**
 * Transforms raw agy usage JSON into Firebase models structure.
 */
function transformUsageJson(rawJsonStr: string, mapping: Record<string, string> = DEFAULT_MAP): string {
  const data = JSON.parse(rawJsonStr);
  const groups: Array<{
    name: string;
    buckets?: Array<{
      remaining_fraction?: number;
      reset_time?: string;
    }>;
  }> = data?.command?.data?.groups || [];

  const result: Record<string, { modelPercentage: number; renewsAt: string }> = {};

  for (const group of groups) {
    const targetKey = mapping[group.name];
    if (!targetKey) {
      continue;
    }

    const bucket = group.buckets?.[0];
    if (!bucket) {
      continue;
    }

    const fraction = typeof bucket.remaining_fraction === "number" ? bucket.remaining_fraction : 0;
    const percentage = Math.round(fraction * 100);
    const renewsAt = bucket.reset_time ? normalizeTime(bucket.reset_time) : "";

    result[targetKey] = {
      modelPercentage: percentage,
      renewsAt: renewsAt,
    };
  }

  return JSON.stringify(result, null, 4);
}

interface ModelEntry {
  modelPercentage?: number;
  renewsAt?: string;
}

/**
 * Formats a duration in milliseconds into days and hours (e.g. "6d 19h" or "+1d 2h").
 */
function formatDuration(ms: number, showSign: boolean = false): string {
  if (isNaN(ms)) {
    return "-";
  }
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  const sign = showSign ? (isNegative ? "-" : "+") : isNegative ? "-" : "";
  return `${sign}${days}d ${hours}h`;
}

/**
 * Formats a duration in milliseconds into total hours and minutes only (e.g. "163h 23m").
 */
function formatHoursMinutes(ms: number): string {
  if (isNaN(ms)) {
    return "-";
  }
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const sign = isNegative ? "-" : "";
  return `${sign}${hours}h ${minutes}m`;
}

/**
 * Calculates remaining time from `now` to target ISO date in total hours and minutes only.
 */
function formatRemainingHoursMinutesFromNow(isoStr?: string, now: Date = new Date()): string {
  if (!isoStr) {
    return "-";
  }
  const target = new Date(isoStr);
  if (isNaN(target.getTime())) {
    return "-";
  }
  const diffMs = target.getTime() - now.getTime();
  return formatHoursMinutes(diffMs);
}

/**
 * Calculates remaining time from `now` to target ISO date.
 */
function formatRemainingFromNow(isoStr?: string, now: Date = new Date()): string {
  if (!isoStr) {
    return "-";
  }
  const target = new Date(isoStr);
  if (isNaN(target.getTime())) {
    return "-";
  }
  const diffMs = target.getTime() - now.getTime();
  return formatDuration(diffMs);
}

/**
 * Calculates shift between before and after ISO dates.
 */
function formatTimeShift(beforeIso?: string, afterIso?: string): string {
  if (!beforeIso || !afterIso) {
    return "-";
  }
  const tBefore = new Date(beforeIso).getTime();
  const tAfter = new Date(afterIso).getTime();
  if (isNaN(tBefore) || isNaN(tAfter)) {
    return "-";
  }
  const shiftMs = tAfter - tBefore;
  if (shiftMs === 0) {
    return "0h (no shift)";
  }
  return formatDuration(shiftMs, true);
}

/**
 * Compares before and after Firebase models state and prints two difference tables using console.table.
 * Table 1: State Before Update
 * Table 2: State After Update (including renewsAt shifted)
 */
function printDiff(beforeJsonStr: string, afterJsonStr: string): void {
  let beforeObj: Record<string, ModelEntry> = {};
  let afterObj: Record<string, ModelEntry> = {};

  try {
    beforeObj = JSON.parse(beforeJsonStr || "{}");
  } catch {
    beforeObj = {};
  }

  try {
    afterObj = JSON.parse(afterJsonStr || "{}");
  } catch {
    afterObj = {};
  }

  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
  const now = new Date();

  const beforeRows: Record<string, Record<string, string | number>> = {
    modelPercentage: {},
    renewsAt: {},
    remaining: {},
    "hours and minutes": {},
  };

  const afterRows: Record<string, Record<string, string | number>> = {
    modelPercentage: {},
    renewsAt: {},
    remaining: {},
    "hours and minutes": {},
    "renewsAt shifted": {},
  };

  for (const key of allKeys) {
    const colName = decodeURIComponent(key);
    const beforeItem = beforeObj[key] || {};
    const afterItem = afterObj[key] || {};

    beforeRows["modelPercentage"][colName] =
      beforeItem.modelPercentage !== undefined ? beforeItem.modelPercentage : "-";
    beforeRows["renewsAt"][colName] = beforeItem.renewsAt || "-";
    beforeRows["remaining"][colName] = formatRemainingFromNow(beforeItem.renewsAt, now);
    beforeRows["hours and minutes"][colName] = formatRemainingHoursMinutesFromNow(beforeItem.renewsAt, now);

    afterRows["modelPercentage"][colName] = afterItem.modelPercentage !== undefined ? afterItem.modelPercentage : "-";
    afterRows["renewsAt"][colName] = afterItem.renewsAt || "-";
    afterRows["remaining"][colName] = formatRemainingFromNow(afterItem.renewsAt, now);
    afterRows["hours and minutes"][colName] = formatRemainingHoursMinutesFromNow(afterItem.renewsAt, now);
    afterRows["renewsAt shifted"][colName] = formatTimeShift(beforeItem.renewsAt, afterItem.renewsAt);
  }

  console.log("Before update:");
  console.table(beforeRows);

  console.log("After update:");
  console.table(afterRows);
}

async function main() {
  switch (mode) {
    case "normalize_time": {
      const raw = process.argv[3] || "";
      process.stdout.write(normalizeTime(raw));
      break;
    }
    case "transform_usage": {
      // Optional custom map passed as argument 3 (JSON string)
      let mapping = DEFAULT_MAP;
      if (process.argv[3]) {
        try {
          mapping = JSON.parse(process.argv[3]);
        } catch (e) {
          // fallback to default
        }
      }
      const stdinData = await readStdin();
      const output = transformUsageJson(stdinData, mapping);
      process.stdout.write(output);
      break;
    }
    case "print_diff": {
      const before = process.argv[3] || "{}";
      const after = process.argv[4] || "{}";
      printDiff(before, after);
      break;
    }
    default: {
      console.error(`Unknown mode: ${mode}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

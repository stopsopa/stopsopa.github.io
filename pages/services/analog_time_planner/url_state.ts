/**
 * URL state configuration for the Analog Time Planner.
 * Uses modURLSearchParams to sync events, startHour, startMinute with URL query params.
 */

import modURLSearchParams from "../../../libs/modURLSearchParams.ts";

// Event type definition — a time block with a label, duration in minutes, and color.
export type Event = {
  label: string;
  time: number;
  color: string;
};

// Anchor mode: "start" (default) anchors start time; "end" anchors end time and recalculates start time.
export type AnchorMode = "start" | "end";

// Tab mode: "clock" (default, omitted from url) or "schedule" (represented by presence of get param 't')
export type TabMode = "clock" | "schedule";

/**
 * Compact URL serializer for events:
 * Formats each event as: `<time>~<colorWithoutHash>~<label>`
 * Separates multiple events with `_` (underscore).
 * Underscore and tilde inside label are escaped as `%5F` and `%7E` respectively,
 * so they don't conflict with delimiters.
 *
 * Example:
 * 104~ef4444~New+event_30~f97316~Coffee+break
 */
export function encodeEvents(events: Event[]): string {
  return events
    .map((ev) => {
      const cleanColor = ev.color.replace(/^#/, "");
      const safeLabel = encodeURIComponent(ev.label).replace(/_/g, "%5F").replace(/~/g, "%7E");
      return `${ev.time}~${cleanColor}~${safeLabel}`;
    })
    .join("_");
}

/**
 * Decodes compact URL string back into Event[] array.
 * Includes backward compatibility for old JSON-encoded URLs.
 */
export function decodeEvents(raw: string): Event[] {
  if (!raw || !raw.trim()) {
    return [];
  }
  const trimmed = raw.trim();

  // Backward compatibility: support old JSON format if present in legacy URLs
  if (trimmed.startsWith("[") || trimmed.startsWith("%5B")) {
    try {
      const parsed = JSON.parse(decodeURIComponent(trimmed));
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          label: String(item.label || ""),
          time: Math.max(1, parseInt(item.time, 10) || 30),
          color: String(item.color || "#3b82f6"),
        }));
      }
    } catch {}
  }

  // Parse compact format: "time~color~label_time~color~label"
  // Also tolerate comma or semicolon as event delimiter if edited manually
  const segments = trimmed.split(/[_;,]/).filter(Boolean);
  const result: Event[] = [];

  for (const seg of segments) {
    const parts = seg.split("~");
    if (parts.length >= 2) {
      const time = Math.max(1, parseInt(parts[0], 10) || 30);
      let color = parts[1].trim();
      if (!color.startsWith("#")) {
        color = `#${color}`;
      }
      let label = "";
      if (parts.length >= 3) {
        try {
          label = decodeURIComponent(parts.slice(2).join("~").replace(/\+/g, " "));
        } catch {
          label = parts.slice(2).join("~");
        }
      }
      result.push({ label, time, color });
    }
  }

  return result;
}

const { useQueryParams } = modURLSearchParams<{
  events: Event[];
  startHour: number;
  startMinute: number;
  leftWidth: number;
  anchor: AnchorMode;
  animate: boolean;
  tab: TabMode;
}>({
  events: {
    getParam: "e",
    default: [] as Event[],
    encode: encodeEvents,
    decode: decodeEvents,
  },
  startHour: {
    getParam: "sh",
    default: 9,
    encode: String,
    decode: Number,
  },
  startMinute: {
    getParam: "sm",
    default: 0,
    encode: String,
    decode: Number,
  },
  /*
   * leftWidth — persisted desktop left-panel width in pixels.
   * Written/read on desktop only; preserved in URL when opened on mobile
   * but never applied to layout (CSS media query overrides it).
   */
  leftWidth: {
    getParam: "lw",
    default: 360,
    encode: String,
    decode: Number,
  },
  /*
   * anchor — defines whether "start" time or "end" time is the fixed anchor point.
   * "start" (default): end time is derived from start + sum(events).
   * "end": start time is constantly recalculated as end - sum(events).
   */
  anchor: {
    getParam: "a",
    default: "start" as AnchorMode,
    encode: String,
    decode: (v) => (v === "end" ? "end" : "start"),
  },
  /*
   * animate — toggles continuous sweep animation on the analog clock.
   * true (default): minute hand continuously sweeps and reveals slices.
   * false: static display of full pie slices with no animation.
   */
  animate: {
    getParam: "an",
    default: true,
    encode: (v) => (v ? "1" : "0"),
    decode: (v) => (v === "0" ? false : true),
  },
  /*
   * tab — controls active view ("clock" vs "schedule").
   * Lack of 't' get param in URL means 'clock' tab should be active.
   * Presence of 't' means schedule.
   */
  tab: {
    getParam: "t",
    default: "clock" as TabMode,
    encode: (v) => (v === "schedule" ? "1" : ""),
    decode: (_raw) => "schedule",
  },
});

export { useQueryParams };

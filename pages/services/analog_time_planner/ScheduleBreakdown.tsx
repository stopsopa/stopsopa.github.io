/**
 * ScheduleBreakdown component — presents a chronological breakdown of time intervals.
 *
 * For each event, calculates and displays:
 *  - Absolute time range: [from – to] based on startHour/startMinute
 *  - Relative time range: [+0m – +30m] relative to the start time
 *  - Duration in minutes
 *  - Event color swatch and label
 * Also displays an overall summary (total time, start, and end time).
 */

import React from "react";
import { Event } from "./url_state.ts";

type Props = {
  events: Event[];
  startHour: number;
  startMinute: number;
};

/* Formats minutes from midnight into 24-hour HH:MM string. */
function formatHHMM(minutesFromMidnight: number): string {
  const normalized = ((minutesFromMidnight % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* Formats relative minute offset into human-readable string (e.g. +45m or +2h 15m). */
function formatRelative(minutes: number): string {
  if (minutes === 0) {
    return "+0m";
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return `+${h}h ${m}m`;
  }
  if (h > 0) {
    return `+${h}h`;
  }
  return `+${m}m`;
}

/* Formats total duration nicely (e.g. 2h 30m or 45m). */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  return `${m}m`;
}

export default function ScheduleBreakdown({ events, startHour, startMinute }: Props) {
  const startTotalMinutes = startHour * 60 + startMinute;
  const totalMinutes = events.reduce((sum, e) => sum + e.time, 0);
  const endTotalMinutes = startTotalMinutes + totalMinutes;

  if (events.length === 0) {
    return (
      <div className="atp-schedule-empty" data-testid="atp-schedule-empty">
        <p className="atp-schedule-empty-title">No events planned</p>
        <p className="atp-schedule-empty-subtitle">Add events in the left panel to view their time breakdown here.</p>
      </div>
    );
  }

  // Pre-calculate cumulative time intervals for each event
  let accumulatedMinutes = 0;
  const items = events.map((ev, index) => {
    const itemStartMin = startTotalMinutes + accumulatedMinutes;
    const itemEndMin = itemStartMin + ev.time;
    const relStart = accumulatedMinutes;
    const relEnd = accumulatedMinutes + ev.time;
    accumulatedMinutes += ev.time;

    return {
      index,
      label: ev.label,
      color: ev.color,
      duration: ev.time,
      timeFrom: formatHHMM(itemStartMin),
      timeTo: formatHHMM(itemEndMin),
      relFrom: formatRelative(relStart),
      relTo: formatRelative(relEnd),
    };
  });

  return (
    <div className="atp-schedule-container" data-testid="atp-schedule-list">
      {/* ── Summary card ── */}
      <div className="atp-schedule-summary">
        <div className="atp-summary-item">
          <span className="atp-summary-label">Start Time</span>
          <span className="atp-summary-value">{formatHHMM(startTotalMinutes)}</span>
        </div>
        <div className="atp-summary-item">
          <span className="atp-summary-label">End Time</span>
          <span className="atp-summary-value">{formatHHMM(endTotalMinutes)}</span>
        </div>
        <div className="atp-summary-item">
          <span className="atp-summary-label">Total Duration</span>
          <span className="atp-summary-value">{formatDuration(totalMinutes)}</span>
        </div>
        <div className="atp-summary-item">
          <span className="atp-summary-label">Events</span>
          <span className="atp-summary-value">{events.length}</span>
        </div>
      </div>

      {/* ── Chronological interval items ── */}
      <div className="atp-schedule-items">
        {items.map((item) => (
          <div key={item.index} className="atp-schedule-row" data-testid={`atp-schedule-item-${item.index}`}>
            <div className="atp-schedule-color-bar" style={{ backgroundColor: item.color }} title={item.color} />
            <div className="atp-schedule-time-col">
              <span className="atp-schedule-abs-time">
                {item.timeFrom} – {item.timeTo}
              </span>
              <span className="atp-schedule-rel-time">
                {item.relFrom} → {item.relTo}
              </span>
            </div>
            <div className="atp-schedule-duration-col">
              <span className="atp-schedule-duration-badge">{item.duration}m</span>
            </div>
            <div className="atp-schedule-label-col">
              <span className="atp-schedule-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

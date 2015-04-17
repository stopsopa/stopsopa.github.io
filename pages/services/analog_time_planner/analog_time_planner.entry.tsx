/**
 * Analog Time Planner — entry point.
 *
 * Manages top-level state (events, startHour, startMinute, leftWidth) via URL
 * query params using modURLSearchParams.
 *
 * Two-column layout on desktop (resizable divider), stacked on mobile.
 * leftWidth is always kept in URL state so it survives navigation, but the CSS
 * media query ignores it on mobile — the value is preserved, just not applied.
 *
 * Key fix: location.search is held in React state so history.replaceState
 * changes propagate as re-renders (replaceState alone doesn't trigger React).
 */

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./analog_time_planner.entry.css";
import "../../js/popper/html-vanilla/popover.css";

import { useQueryParams, Event, AnchorMode } from "./url_state.ts";
import EventList from "./EventList.tsx";
import ClockFace from "./ClockFace.tsx";
import ScheduleBreakdown from "./ScheduleBreakdown.tsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEFT_WIDTH_MIN = 200;
const LEFT_WIDTH_MAX = 700;

// ── Root App component ────────────────────────────────────────────────────────

function App() {
  /*
   * Search string held in state so that navigate → replaceState causes a
   * re-render and params are re-derived with fresh URL values.
   */
  const [search, setSearch] = useState(() => location.search);

  // Sync state if user navigates back / forward in browser history
  useEffect(() => {
    const onPopState = () => {
      setSearch(location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = ({ search: newSearch }: { search: string }) => {
    const targetSearch = newSearch ? `?${newSearch}` : "";
    if (location.search !== targetSearch) {
      history.pushState(null, "", targetSearch ? targetSearch : location.pathname);
      setSearch(targetSearch);
    }
  };

  const { params, setParam, setParams } = useQueryParams(search, navigate);

  const events: Event[] = params.events;
  const startHour: number = params.startHour;
  const startMinute: number = params.startMinute;
  const leftWidth: number = params.leftWidth;
  const anchor: AnchorMode = params.anchor;
  const animate: boolean = params.animate;

  // Active view tab in the right panel: "clock" (default) or "schedule"
  const [activeTab, setActiveTab] = useState<"clock" | "schedule">("clock");

  // ── Resize divider ──────────────────────────────────────────────────────────
  // During drag: track live width locally (no URL spam per-frame).
  // On mouseup: commit final width to URL via setParam.

  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const liveWidthRef = useRef<number | null>(null);

  /* The width actually applied to layout — live during drag, URL value otherwise. */
  const effectiveWidth = liveWidth ?? leftWidth;

  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = liveWidthRef.current ?? leftWidth;

    function onMouseMove(ev: MouseEvent) {
      const next = Math.max(LEFT_WIDTH_MIN, Math.min(LEFT_WIDTH_MAX, startWidth + ev.clientX - startX));
      liveWidthRef.current = next;
      setLiveWidth(next);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (liveWidthRef.current !== null) {
        setParam("leftWidth", liveWidthRef.current);
        liveWidthRef.current = null;
      }
      setLiveWidth(null);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // ── State handlers ──────────────────────────────────────────────────────────

  /*
   * When events change (added, deleted, edited, reordered):
   * If anchor is "end": end time is kept fixed and start time is constantly recalculated.
   * If anchor is "start": start time is kept fixed and end time is derived.
   */
  function handleEventsChange(next: Event[]) {
    if (anchor === "end") {
      const currentEndMin = startHour * 60 + startMinute + events.reduce((sum, e) => sum + e.time, 0);
      const nextTotalMin = next.reduce((sum, e) => sum + e.time, 0);
      const newStartTotalMin = (((currentEndMin - nextTotalMin) % 1440) + 1440) % 1440;
      const newStartHour = Math.floor(newStartTotalMin / 60);
      const newStartMinute = newStartTotalMin % 60;
      setParams({
        events: next,
        startHour: newStartHour,
        startMinute: newStartMinute,
      });
    } else {
      setParam("events", next);
    }
  }

  function handleStartChange(hour: number, minute: number) {
    setParams({ startHour: hour, startMinute: minute });
  }

  function handleAnchorChange(nextAnchor: AnchorMode) {
    setParam("anchor", nextAnchor);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    /*
     * --atp-left-width CSS variable drives the left panel flex-basis on desktop.
     * Mobile media query ignores it via overriding flex/max-width.
     */
    <div className="atp-app" style={{ "--atp-left-width": `${effectiveWidth}px` } as React.CSSProperties}>
      {/* ── Left: event list ── */}
      <div className="atp-left">
        <EventList
          events={events}
          startHour={startHour}
          startMinute={startMinute}
          anchor={anchor}
          onEventsChange={handleEventsChange}
          onStartChange={handleStartChange}
          onAnchorChange={handleAnchorChange}
        />
      </div>

      {/* ── Drag divider (desktop only, hidden on mobile via CSS) ── */}
      <div className="atp-divider" data-testid="atp-divider" onMouseDown={handleDividerMouseDown} />

      {/* ── Right panel: tabs header + active view (clock or schedule breakdown) ── */}
      <div className="atp-right">
        <div className="atp-right-inner">
          <div className="atp-right-header">
            <div className="atp-tabs-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "clock"}
                data-testid="atp-tab-clock"
                className={`atp-tab-btn ${activeTab === "clock" ? "active" : ""}`}
                onClick={() => setActiveTab("clock")}
              >
                Clock
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "schedule"}
                data-testid="atp-tab-schedule"
                className={`atp-tab-btn ${activeTab === "schedule" ? "active" : ""}`}
                onClick={() => setActiveTab("schedule")}
              >
                Schedule
              </button>
            </div>

            <label className="atp-animate-toggle" title="Toggle clock animation">
              <input
                data-testid="atp-animate-checkbox"
                type="checkbox"
                checked={animate}
                onChange={(e) => setParam("animate", e.target.checked)}
                className="atp-animate-checkbox"
              />
              <span className="atp-animate-label">Animate</span>
            </label>
          </div>

          <div className="atp-tab-content">
            {activeTab === "clock" ? (
              <div className="atp-clock-wrap">
                <ClockFace events={events} startHour={startHour} startMinute={startMinute} animate={animate} />
              </div>
            ) : (
              <div className="atp-schedule-wrap">
                <ScheduleBreakdown events={events} startHour={startHour} startMinute={startMinute} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────

/**
 * Mount React root safely.
 * Handles early WebKit script execution and fallback element creation.
 */
function mount() {
  let rootEl = document.getElementById("root");
  if (rootEl) {
    createRoot(rootEl).render(<App />);
  } else {
    rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);
    createRoot(rootEl).render(<App />);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}

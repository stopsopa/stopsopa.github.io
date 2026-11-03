/**
 * EventList component — left panel of the Analog Time Planner.
 *
 * Renders:
 *  - Start time input (HH:MM)
 *  - Derived end time display
 *  - Drag-and-drop reorderable list of event rows (supports mouse and touch)
 *  - Inline edit form per row (label, minutes, color)
 *  - Add Event button
 *
 * DnD approach: native HTML5 draggable API for mouse, native Touch Events API for phones/mobile.
 */

import React, { useRef, useState } from "react";
import { Event, AnchorMode } from "./url_state.ts";

// ── Default color palette for new events ──────────────────────────────────────
const DEFAULT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"];

function nextColor(events: Event[]): string {
  return DEFAULT_COLORS[events.length % DEFAULT_COLORS.length];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/* Formats total minutes from a start (hour, minute) into "HH:MM" string. */
function formatTime(hour: number, minute: number): string {
  const totalMin = hour * 60 + minute;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* Computes end time string from start time and list of events. */
function computeEndTime(startHour: number, startMinute: number, events: Event[]): string {
  const totalEventMinutes = events.reduce((sum, e) => sum + e.time, 0);
  return formatTime(startHour, startMinute + totalEventMinutes);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type EditState = {
  index: number;
  label: string;
  time: string;
  color: string;
  initialEvent: Event;
};

type Props = {
  events: Event[];
  startHour: number;
  startMinute: number;
  anchor: AnchorMode;
  onEventsChange: (events: Event[]) => void;
  onStartChange: (hour: number, minute: number) => void;
  onAnchorChange: (anchor: AnchorMode) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EventList({
  events,
  startHour,
  startMinute,
  anchor,
  onEventsChange,
  onStartChange,
  onAnchorChange,
}: Props) {
  const [editState, setEditState] = useState<EditState | null>(null);

  // Drag state refs — no re-render needed for DnD tracking
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchDraggingIndex, setTouchDraggingIndex] = useState<number | null>(null);

  const endTime = computeEndTime(startHour, startMinute, events);

  // ── Step start / end time by delta minutes (e.g. +/-5 min) ───────────────────
  function stepStart(deltaMinutes: number) {
    const currentMin = startHour * 60 + startMinute;
    const newMin = (((currentMin + deltaMinutes) % 1440) + 1440) % 1440;
    onStartChange(Math.floor(newMin / 60), newMin % 60);
  }

  function stepEnd(deltaMinutes: number) {
    const totalEventMinutes = events.reduce((sum, ev) => sum + ev.time, 0);
    const currentEndMin = startHour * 60 + startMinute + totalEventMinutes;
    const targetEndMin = (((currentEndMin + deltaMinutes) % 1440) + 1440) % 1440;
    const newStartTotalMin = (((targetEndMin - totalEventMinutes) % 1440) + 1440) % 1440;
    onStartChange(Math.floor(newStartTotalMin / 60), newStartTotalMin % 60);
  }

  // ── Start time input handler ────────────────────────────────────────────────
  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const [hStr, mStr] = val.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      onStartChange(h, m);
    }
  }

  // ── End time input handler: subtract total events time to update start ──────
  function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const [hStr, mStr] = val.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const totalEventMinutes = events.reduce((sum, ev) => sum + ev.time, 0);
      const targetEndMin = h * 60 + m;
      const newStartTotalMin = (((targetEndMin - totalEventMinutes) % 1440) + 1440) % 1440;
      const newStartHour = Math.floor(newStartTotalMin / 60);
      const newStartMinute = newStartTotalMin % 60;
      onStartChange(newStartHour, newStartMinute);
    }
  }

  // ── Add new event at the end ────────────────────────────────────────────────
  function handleAddEvent() {
    const newEvent = { label: "New event", time: 30, color: nextColor(events) };
    const newEvents = [...events, newEvent];
    onEventsChange(newEvents);
    // Open inline edit for the newly added event
    const idx = newEvents.length - 1;
    setEditState({
      index: idx,
      label: newEvent.label,
      time: String(newEvent.time),
      color: newEvent.color,
      initialEvent: { ...newEvent },
    });
  }

  // ── Delete event ────────────────────────────────────────────────────────────
  function handleDelete(index: number) {
    if (editState && editState.index === index) {
      setEditState(null);
    }
    const next = events.filter((_, i) => i !== index);
    onEventsChange(next);
  }

  // ── Open inline edit ────────────────────────────────────────────────────────
  function handleEditOpen(index: number) {
    const ev = events[index];
    setEditState({
      index,
      label: ev.label,
      time: String(ev.time),
      color: ev.color,
      initialEvent: { ...ev },
    });
  }

  // ── Real-time update for event label ────────────────────────────────────────
  function handleLabelInput(newLabel: string) {
    if (!editState) return;
    setEditState({ ...editState, label: newLabel });
    const next = events.map((ev, i) => (i === editState.index ? { ...ev, label: newLabel } : ev));
    onEventsChange(next);
  }

  // ── Real-time update for event duration ─────────────────────────────────────
  function handleTimeInput(newTimeStr: string) {
    if (!editState) return;
    setEditState({ ...editState, time: newTimeStr });
    const parsed = parseInt(newTimeStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const next = events.map((ev, i) => (i === editState.index ? { ...ev, time: parsed } : ev));
      onEventsChange(next);
    }
  }

  // ── Real-time update for event color ────────────────────────────────────────
  function handleColorInput(newColor: string) {
    if (!editState) return;
    setEditState({ ...editState, color: newColor });
    const next = events.map((ev, i) => (i === editState.index ? { ...ev, color: newColor } : ev));
    onEventsChange(next);
  }

  // ── Finish inline edit (changes were already applied live) ──────────────────
  function handleEditSave() {
    setEditState(null);
  }

  // ── Cancel inline edit (reverts to event values before edit started) ────────
  function handleEditCancel() {
    if (editState) {
      const next = events.map((ev, i) => (i === editState.index ? editState.initialEvent : ev));
      onEventsChange(next);
    }
    setEditState(null);
  }

  /**
   * Reorders event from index 'from' to index 'to'.
   * Updates state, adjusts editState if open, and notifies parent.
   */
  function reorderEvent(from: number, to: number) {
    if (from === to) return;
    const next = [...events];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);

    // Adjust edit index if we are editing something that moved
    if (editState !== null) {
      let newIdx = editState.index;
      if (editState.index === from) {
        newIdx = to;
      } else if (from < to && editState.index > from && editState.index <= to) {
        newIdx = editState.index - 1;
      } else if (from > to && editState.index < from && editState.index >= to) {
        newIdx = editState.index + 1;
      }
      setEditState({ ...editState, index: newIdx });
    }

    onEventsChange(next);
  }

  // ── DnD handlers (Mouse / HTML5 Drag and Drop) ──────────────────────────────

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragOverIndexRef.current = index;
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from !== null && from !== index) {
      reorderEvent(from, index);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
  }

  // ── Touch DnD handlers (Mobile / Phones) ───────────────────────────────────

  /**
   * Starts touch drag on handle touchstart.
   */
  function handleTouchStart(e: React.TouchEvent, index: number) {
    dragIndexRef.current = index;
    dragOverIndexRef.current = index;
    setTouchDraggingIndex(index);
    setDragOverIndex(index);
  }

  /**
   * Updates drag target as touch moves over other event rows.
   */
  function handleTouchMove(e: React.TouchEvent) {
    if (dragIndexRef.current === null) return;

    const touch = e.touches[0];
    if (!touch) return;

    // Identify element directly under finger
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowEl = el?.closest<HTMLElement>("[data-event-row-index]");
    if (rowEl) {
      const targetIdxStr = rowEl.getAttribute("data-event-row-index");
      if (targetIdxStr !== null) {
        const targetIdx = parseInt(targetIdxStr, 10);
        if (!isNaN(targetIdx) && dragOverIndexRef.current !== targetIdx) {
          dragOverIndexRef.current = targetIdx;
          setDragOverIndex(targetIdx);
        }
      }
    }
  }

  /**
   * Finalizes touch reorder when touch ends or cancels.
   */
  function handleTouchEnd() {
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    if (from !== null && to !== null && from !== to) {
      reorderEvent(from, to);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setTouchDraggingIndex(null);
    setDragOverIndex(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const startVal = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;

  return (
    <>
      {/* ── Start / End time with anchor radio buttons and popover info ── */}
      <div className="atp-time-header">
        <div className="atp-time-header-top">
          <span className="atp-time-header-title">Anchor</span>
          <button
            type="button"
            className="atp-info-btn"
            data-testid="atp-anchor-info-btn"
            aria-label="How start and end anchors work"
            popovertarget="atp-anchor-popover"
            interestfor="atp-anchor-popover"
            onMouseEnter={() => {
              const el = document.getElementById("atp-anchor-popover");
              if (el && typeof (el as any).showPopover === "function") {
                try {
                  (el as any).showPopover();
                } catch {}
              }
            }}
            onMouseLeave={() => {
              const el = document.getElementById("atp-anchor-popover");
              if (el && typeof (el as any).hidePopover === "function") {
                try {
                  (el as any).hidePopover();
                } catch {}
              }
            }}
          >
            ⓘ
          </button>
        </div>

        {/* Native popover element using popover-api skill styles */}
        <div
          id="atp-anchor-popover"
          popover=""
          data-popover=""
          className="bottom-left atp-info-popover"
          data-testid="atp-anchor-popover"
        >
          <div className="atp-info-popover-content">
            <p className="atp-info-popover-heading">How Anchors Work</p>
            <p className="atp-info-popover-line">
              <strong>When Start is selected:</strong> End is movable on any edit and Start is constant.
            </p>
            <p className="atp-info-popover-line">
              <strong>When End is selected:</strong> Start is movable on any edit and End is constant.
            </p>
            <p className="atp-info-popover-sub">
              Adding, deleting, or resizing events automatically moves the movable boundary.
            </p>
          </div>
        </div>

        <div className="atp-time-row">
          <label className="atp-anchor-radio-wrap" title="Anchor to Start Time">
            <input
              data-testid="atp-anchor-start-radio"
              type="radio"
              name="atp-time-anchor"
              value="start"
              checked={anchor === "start"}
              onChange={() => onAnchorChange("start")}
              className="atp-anchor-radio"
            />
            <span className="atp-time-label">Start:</span>
          </label>
          <input
            data-testid="atp-start-input"
            type="time"
            className="atp-time-input"
            value={startVal}
            onChange={handleStartChange}
            onInput={handleStartChange}
          />
          <div className="atp-time-step-btns">
            <button
              type="button"
              className="atp-time-step-btn"
              data-testid="atp-start-step-down"
              aria-label="Subtract 5 minutes from start"
              title="-5 minutes"
              onClick={() => stepStart(-5)}
            >
              ▼
            </button>
            <button
              type="button"
              className="atp-time-step-btn"
              data-testid="atp-start-step-up"
              aria-label="Add 5 minutes to start"
              title="+5 minutes"
              onClick={() => stepStart(5)}
            >
              ▲
            </button>
          </div>
          <span
            className={`atp-anchor-badge ${anchor === "start" ? "constant" : "movable"}`}
            title={anchor === "start" ? "Start is constant" : "Start is movable (updates on edit)"}
          >
            {anchor === "start" ? "constant" : "movable"}
          </span>
        </div>

        <div className="atp-time-row">
          <label className="atp-anchor-radio-wrap" title="Anchor to End Time">
            <input
              data-testid="atp-anchor-end-radio"
              type="radio"
              name="atp-time-anchor"
              value="end"
              checked={anchor === "end"}
              onChange={() => onAnchorChange("end")}
              className="atp-anchor-radio"
            />
            <span className="atp-time-label">End:</span>
          </label>
          <input
            data-testid="atp-end-input"
            type="time"
            className="atp-time-input"
            value={endTime}
            onChange={handleEndChange}
            onInput={handleEndChange}
          />
          <div className="atp-time-step-btns">
            <button
              type="button"
              className="atp-time-step-btn"
              data-testid="atp-end-step-down"
              aria-label="Subtract 5 minutes from end"
              title="-5 minutes"
              onClick={() => stepEnd(-5)}
            >
              ▼
            </button>
            <button
              type="button"
              className="atp-time-step-btn"
              data-testid="atp-end-step-up"
              aria-label="Add 5 minutes to end"
              title="+5 minutes"
              onClick={() => stepEnd(5)}
            >
              ▲
            </button>
          </div>
          <span
            className={`atp-anchor-badge ${anchor === "end" ? "constant" : "movable"}`}
            title={anchor === "end" ? "End is constant" : "End is movable (updates on edit)"}
          >
            {anchor === "end" ? "constant" : "movable"}
          </span>
        </div>

        <div className="atp-anchor-hint" data-testid="atp-anchor-hint">
          {anchor === "start"
            ? "End is movable (will update on its own when editing/adding/deleting events)"
            : "Start is movable (will update on its own when editing/adding/deleting events)"}
        </div>
      </div>

      {/* ── Event list ── */}
      <div className="atp-event-list">
        {events.map((ev, i) => {
          const isEditing = editState !== null && editState.index === i;

          if (isEditing) {
            return (
              <div key={i} className="atp-inline-edit" data-testid={`atp-event-edit-${i}`}>
                <div className="atp-inline-edit-row">
                  <input
                    data-testid={`atp-edit-label-${i}`}
                    className="atp-inline-input"
                    type="text"
                    placeholder="Label"
                    value={editState.label}
                    onChange={(e) => handleLabelInput(e.target.value)}
                    onInput={(e) => handleLabelInput((e.target as HTMLInputElement).value)}
                    autoFocus
                  />
                </div>
                <div className="atp-inline-edit-row">
                  <input
                    data-testid={`atp-edit-time-${i}`}
                    className="atp-inline-input-sm"
                    type="number"
                    min={1}
                    placeholder="min"
                    value={editState.time}
                    onChange={(e) => handleTimeInput(e.target.value)}
                    onInput={(e) => handleTimeInput((e.target as HTMLInputElement).value)}
                  />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>minutes</span>
                  <input
                    data-testid={`atp-edit-color-${i}`}
                    className="atp-color-input"
                    type="color"
                    value={editState.color}
                    onChange={(e) => handleColorInput(e.target.value)}
                    onInput={(e) => handleColorInput((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="atp-inline-edit-actions">
                  <button
                    data-testid={`atp-edit-cancel-${i}`}
                    className="atp-btn atp-btn-cancel"
                    type="button"
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </button>
                  <button
                    data-testid={`atp-edit-save-${i}`}
                    className="atp-btn atp-btn-save"
                    type="button"
                    onClick={handleEditSave}
                  >
                    Done
                  </button>
                </div>
              </div>
            );
          }

          const isRowDragOver = dragOverIndex === i;
          const isRowTouching = touchDraggingIndex === i;

          return (
            <div
              key={i}
              data-testid={`atp-event-row-${i}`}
              data-event-row-index={i}
              className={`atp-event-row${isRowDragOver ? " atp-dragging-over" : ""}${isRowTouching ? " atp-touch-active" : ""}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            >
              <span
                className="atp-drag-handle"
                title="Drag to reorder"
                data-testid={`atp-drag-handle-${i}`}
                onTouchStart={(e) => handleTouchStart(e, i)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                ☰
              </span>
              <span className="atp-event-time">{ev.time}m</span>
              <span className="atp-event-label">{ev.label}</span>
              <span className="atp-color-swatch" style={{ backgroundColor: ev.color }} title={ev.color} />
              <button
                data-testid={`atp-edit-btn-${i}`}
                className="atp-icon-btn"
                type="button"
                title="Edit event"
                onClick={() => handleEditOpen(i)}
              >
                ✎
              </button>
              <button
                data-testid={`atp-delete-btn-${i}`}
                className="atp-icon-btn"
                type="button"
                title="Delete event"
                onClick={() => handleDelete(i)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Add Event button ── */}
      <button data-testid="atp-add-event-btn" className="atp-add-btn" type="button" onClick={handleAddEvent}>
        <span>＋</span> Add event
      </button>
    </>
  );
}

# Analog Time Planner — Plan

## State

```ts
type Event = { label: string; time: number; color: string };
type AnchorMode = "start" | "end";
type AppState = {
  events: Event[];
  startHour: number;
  startMinute: number;
  leftWidth: number;
  anchor: AnchorMode;
  animate: boolean;
};
```

- `events[]` — ordered list of time blocks
- `startHour`, `startMinute` — when the day starts
- `leftWidth` — width in pixels of the left panel (desktop only; persisted in URL `lw`, preserved in React state, ignored by CSS on mobile)
- `anchor` — `"start"` (default) or `"end"` (persisted in URL `a`):
  - `"start"`: start time is fixed, end time is derived (`start + sum(events)`).
  - `"end"`: end time is fixed, start time is constantly recalculated (`end - sum(events)`) whenever events change.
- `animate` — boolean toggle (persisted in URL `an`, default: `true`). When `true`: continuous sweep animation. When `false`: static pie with all slices immediately visible and no animation.
- `endTime` — derived: startTime + sum(event.time), editable from UI (editing it calculates `newStart = newEnd - sum(events)` and updates start time).
- All state serialized to/from URL query params via `modURLSearchParams`; hydrated on load

---

## Layout

### Desktop (two-column, side by side with resizable divider)

```
┌─────────────────────────┬───┬──────────────────────┐
│  LEFT: Event List       │ ┃ │  RIGHT: Clock only   │
│                         │ ┃ │                      │
│  Start: [HH:MM input]   │ ┃ │  [Analog clock SVG]  │
│  End:   12:45 (derived) │ ┃ │                      │
│  ────────────────────   │ ┃ │                      │
│  ☰ 30m  Label text      │ ┃ │                      │
│  ☰ 60m  Another label   │ ┃ │                      │
│  ☰ 15m  Short one       │ ┃ │                      │
│  [+ Add event btn]      │ ┃ │                      │
└─────────────────────────┴───┴──────────────────────┘
                           ▲ Resizable divider (drag horizontally)
```

- Left panel width is dynamically adjustable by dragging the vertical divider between panels.
- Position is committed to URL (`lw=<width>`) on mouse up.
- Clock in right panel dynamically scales and centers in the remaining space, constrained to never exceed viewport height or available horizontal width (`aspect-ratio: 1 / 1`).

### Mobile (stacked, single column)

```
┌─────────────────────────┐
│  Start: [HH:MM input]   │
│  End:   12:45 (derived) │
│  ────────────────────   │
│  ☰ 30m  Label text      │
│  ☰ 60m  Another label   │
│  ☰ 15m  Short one       │
│  [+ Add event btn]      │
├─────────────────────────┤
│  [Analog clock SVG]     │
└─────────────────────────┘
```

Breakpoint: stack below ~768px via CSS `flex-direction: column-reverse` → list on top, clock below.
Divider is hidden (`display: none`), and leftWidth from URL is preserved in state but ignored by layout in mobile mode.

---

## Left Panel: Event List

- **Time Header**:
  - `(o) Start: [HH:MM input]` — radio button selects Start as the anchor point.
  - `( ) End:   [HH:MM input]` — radio button selects End as the anchor point.
  - End time is derived from `start + sum(events)`, but editable. Editing End time recalculates `newStart = newEnd - sum(events)`.
  - When "End" anchor is selected, adding, deleting, or resizing events constantly recalculates `start` time so `end` remains fixed.
  - **Info popover** (ⓘ button next to anchor group): positioned using the native Popover API (`popover.css` + `data-popover` + `interestfor` / hover). Explains:
    - _When Start selected then End is movable on any edit and Start is constant._
    - _When End is selected then Start is movable on any edit and End is constant._
  - **Inline hints & badges**: displays "constant" / "movable" badges on each row and a summary line indicating which boundary auto-updates.
- **Event rows** (drag-and-drop reorder):
  - `☰` drag handle (left) — `draggable` attribute on row, `onDragStart` stores dragged index in ref, `onDragOver` computes target index, `onDrop` reorders array in state
  - `Xm` time in minutes
  - label text (fills remaining width, wraps)
  - `color swatch / picker`
  - `edit button` → inline edit (label, minutes, color); changes update stats, clock animation, and schedule table in real time as inputs are modified
  - `delete button`

### Raw DnD approach

- Each row: `draggable={true}`, handlers: `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`
- `dragIndexRef` tracks which row is being dragged
- `onDragOver` on a row → swap preview via CSS class (`dragging-over`)
- `onDrop` → splice arrays to new position, update state
- No external library needed
- **+ Add Event** button at bottom

---

## Right Panel: Tabs (Clock & Schedule)

The right panel features two tabs and an animation toggle:

1. **Clock** (default) — SVG analog clock with continuous animation loop or static display.
2. **Schedule** — Chronological breakdown of time intervals:
   - Absolute time range: `[HH:MM – HH:MM]`
   - Relative time range: `[+0m → +30m]` relative to start time
   - Duration badge in minutes
   - Color swatch and event label
   - Overall summary (start time, end time, total duration, event count)
3. **Animate Checkbox** — positioned next to `role="tablist"` on the right. Toggling it switches between continuous animation and static pie display (persisted in URL `an`).

### Animation loop (Constant Angular Velocity)

- Runs **continuously at all times** — including while user edits the list
- On each frame of the loop, reads the **current live state** (events + startTime) so changes reflect immediately in the next cycle
- Sequence per cycle:
  1. Calculate total animation duration: `events.length * 1.5s`.
  2. Arrow traverses the entire arc with **constant angular speed**:
     - Naturally spends more time on wider segments (slices) and less time on narrower ones.
     - Slices dynamically reveal as the hand passes over them.
  3. After reaching final position: hand rests for **3 seconds**.
  4. Clear all slices, reset hand to start angle → start next cycle immediately.
- Implemented with `useEffect` + `requestAnimationFrame` and timeout chain stored in refs; cleanup cancels pending frames and timeouts on unmount
- When state changes mid-cycle the current cycle finishes naturally; new cycle picks up fresh state

Angles derived from: `startMinute + sum(previous event minutes)` → degrees on 12h clock face (360° = 12h = 720min, so 1min = 0.5°).

---

## Files

| File                                       | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `index.html`                               | Shell, loads bundle + css                             |
| `analog_time_planner.entry.tsx`            | React root, state, URL sync, tabs                     |
| `analog_time_planner.entry.css`            | Styles                                                |
| `EventList.tsx`                            | Left panel component                                  |
| `ClockFace.tsx`                            | SVG clock + constant-speed animation                  |
| `ScheduleBreakdown.tsx`                    | Schedule breakdown table / list                       |
| `url_state.ts`                             | Encode/decode state ↔ URL                             |
| `pages/js/popper/html-vanilla/popover.css` | Native Popover API anchor positioning styles (reused) |

---

## URL State — using `modURLSearchParams`

Source files live in `_linked/url/` (symlinked from another project — will be removed later).
Before using them, copy as-is (no modifications) to `libs/`:

```
libs/
  modURLSearchParams.ts        ← copy of _linked/url/modURLSearchParams.ts
  toolsURLSearchParams.ts      ← copy of _linked/url/toolsURLSearchParams.ts
```

Import only from `libs/` in the entry file:

```ts
import modURLSearchParams from "../../../libs/modURLSearchParams.ts";
```

> `ModURLSearchParamsComponent.tsx` and `toolsURLSearchParams.test.ts` are not needed — skip those.

### How it works

`modURLSearchParams(config)` produces a `useQueryParams` hook.
Each param has: `getParam` (URL key), `default`, `encode`, `decode`.

```ts
const { useQueryParams } = modURLSearchParams({
  events: {
    getParam: "e",
    default: [] as Event[],
    encode: encodeEvents, // Formats as: "104~ef4444~New+event_30~f97316~Coffee+break"
    decode: decodeEvents, // Decodes compact format, with legacy JSON fallback
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
  leftWidth: {
    getParam: "lw",
    default: 360,
    encode: String,
    decode: Number,
  },
  anchor: {
    getParam: "a",
    default: "start" as AnchorMode,
    encode: String,
    decode: (v) => (v === "end" ? "end" : "start"),
  },
  animate: {
    getParam: "an",
    default: true,
    encode: (v) => (v ? "1" : "0"),
    decode: (v) => (v === "0" ? false : true),
  },
});
```

In the component, use a simple `navigate` shim with `history.pushState` so browser Back/Forward restores previous states:

```ts
const navigate = ({ search: newSearch }: { search: string }) => {
  const targetSearch = newSearch ? `?${newSearch}` : "";
  if (location.search !== targetSearch) {
    history.pushState(null, "", targetSearch ? targetSearch : location.pathname);
    setSearch(targetSearch);
  }
};
const { params, setParam, setParams } = useQueryParams(search, navigate);
```

State is always in sync with URL; opening the URL restores full state.

---

## Packages needed

- `react` + `react-dom` only — no external libraries

---

## Open questions before coding

1. Is `@dnd-kit` available / acceptable, or use HTML5 native drag-and-drop?
2. Clock: 12-hour or 24-hour face? (If total duration > 12h, need 24h)
3. Default events to pre-populate for demo, or start empty?

/**
 * ClockFace component — SVG analog clock with continuous animation loop.
 *
 * Behavior:
 *  - Renders a 12-hour analog clock face (SVG, radius ~200px).
 *  - Animation runs continuously; each cycle:
 *      1. Arrow moves with constant angular velocity across all segments.
 *         Total animation duration = events.length * 1.5 seconds.
 *         Because angular velocity is constant, the hand naturally spends more time
 *         on wider segments (slices) and less time on narrower ones.
 *      2. As the hand sweeps across each arc, the corresponding pie slice is revealed.
 *      3. After reaching the final position: hand rests for 3 seconds.
 *      4. Clear all slices, reset hand to start angle → start next cycle immediately.
 *  - Always reads fresh state from a ref so mid-cycle state changes take effect
 *    in the very next cycle without interrupting the current one.
 *  - Cleanup cancels pending timeouts and animation frames on unmount.
 *
 * Angle math:
 *  - 12-hour clock face: 360° = 720 minutes, so 1 min = 0.5°
 *  - 0° = 12 o'clock (top). Angles increase clockwise.
 *  - startAngle = (startHour % 12) * 60 * 0.5 + startMinute * 0.5 (degrees)
 */

import React, { useEffect, useRef, useState } from "react";
import { Event } from "./url_state.ts";

const SIZE = 440; // SVG viewBox size
const CX = SIZE / 2; // center x
const CY = SIZE / 2; // center y
const R = 200; // clock face radius
const HAND_LEN = 160; // minute hand length

/* Converts degrees (0 = top, clockwise) to SVG x,y on the clock circle. */
function degToXY(deg: number, radius: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

/* Builds an SVG arc path (pie slice) from startDeg to endDeg. */
function buildArcPath(startDeg: number, endDeg: number): string {
  const start = degToXY(startDeg, R);
  const end = degToXY(endDeg, R);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

/* Converts startHour/startMinute into a clock-face angle (degrees). */
function startAngleDeg(startHour: number, startMinute: number): number {
  return ((startHour % 12) * 60 + startMinute) * 0.5;
}

// ── State of the animation: which slices are currently visible ────────────────
type SliceState = { startDeg: number; endDeg: number; color: string }[];

type Props = {
  events: Event[];
  startHour: number;
  startMinute: number;
  animate?: boolean;
};

export default function ClockFace({ events, startHour, startMinute, animate = true }: Props) {
  const [slices, setSlices] = useState<SliceState>([]);
  const [handDeg, setHandDeg] = useState<number>(startAngleDeg(startHour, startMinute));

  /*
   * We hold live state in a ref so the animation loop always reads the
   * most-recent values without needing to restart when props change.
   */
  const stateRef = useRef({ events, startHour, startMinute });
  stateRef.current = { events, startHour, startMinute };

  // All pending timeouts and requestAnimationFrame tracked here for clean unmount.
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function scheduleTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  }

  // ── Static mode: when animate is false, render all pie slices immediately ────
  useEffect(() => {
    if (animate) {
      return;
    }
    const baseAngle = startAngleDeg(startHour, startMinute);
    let accumulatedDeg = baseAngle;
    const staticSlices: SliceState = [];

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const sliceStart = accumulatedDeg;
      const sliceEnd = accumulatedDeg + ev.time * 0.5;
      accumulatedDeg = sliceEnd;
      staticSlices.push({
        startDeg: sliceStart,
        endDeg: sliceEnd,
        color: ev.color,
      });
    }

    setSlices(staticSlices);
    setHandDeg(accumulatedDeg);
  }, [animate, events, startHour, startMinute]);

  // ── Animation mode: continuous constant-speed sweep loop ─────────────────────
  useEffect(() => {
    if (animate) {
      let cancelled = false;

      function runCycle() {
        if (cancelled) return;

        const { events: evs, startHour: sh, startMinute: sm } = stateRef.current;
        const currentBaseAngle = startAngleDeg(sh, sm);
        const totalEventMinutes = evs.reduce((sum, e) => sum + e.time, 0);

        // If no events or zero total minutes, position hand at start and retry in 1s
        if (evs.length === 0 || totalEventMinutes <= 0) {
          setSlices([]);
          setHandDeg(currentBaseAngle);
          scheduleTimeout(runCycle, 1000);
          return;
        }

        setSlices([]);
        setHandDeg(currentBaseAngle);

        /*
         * Constant speed animation across all segments:
         * Total animation time = 1.5s (1500ms) per segment.
         * Speed (deg/ms) = totalDeg / totalAnimationMs is constant.
         * Wider slices naturally receive proportionally more time.
         */
        const totalAnimationMs = evs.length * 1500;
        const totalDeg = totalEventMinutes * 0.5;
        const sweepStartTime = performance.now();

        function sweepFrame(now: number) {
          if (cancelled) return;

          const elapsed = now - sweepStartTime;
          const progress = Math.min(1, elapsed / totalAnimationMs);
          const currentDeg = currentBaseAngle + totalDeg * progress;

          // Compute dynamically revealed slices up to currentDeg
          let accumulatedDeg = currentBaseAngle;
          const currentSlices: SliceState = [];

          for (let i = 0; i < evs.length; i++) {
            const ev = evs[i];
            const sliceStart = accumulatedDeg;
            const sliceEnd = accumulatedDeg + ev.time * 0.5;
            accumulatedDeg = sliceEnd;

            if (currentDeg > sliceStart) {
              currentSlices.push({
                startDeg: sliceStart,
                endDeg: Math.min(currentDeg, sliceEnd),
                color: ev.color,
              });
            }
          }

          setSlices(currentSlices);
          setHandDeg(currentDeg);

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(sweepFrame);
          } else {
            // Hand rests at final position for 3 seconds before next cycle
            scheduleTimeout(() => {
              if (cancelled) return;
              setSlices([]);
              const nextBaseAngle = startAngleDeg(stateRef.current.startHour, stateRef.current.startMinute);
              setHandDeg(nextBaseAngle);
              runCycle();
            }, 3000);
          }
        }

        rafRef.current = requestAnimationFrame(sweepFrame);
      }

      runCycle();

      return () => {
        cancelled = true;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        clearAllTimeouts();
      };
    }
  }, [animate, events, startHour, startMinute]);

  // ── Clock tick marks ──────────────────────────────────────────────────────
  const tickMarks = Array.from({ length: 60 }, (_, i) => {
    const deg = i * 6;
    const isHour = i % 5 === 0;
    const innerR = isHour ? R - 14 : R - 8;
    const outerR = R - 2;
    const inner = degToXY(deg, innerR);
    const outer = degToXY(deg, outerR);
    return (
      <line
        key={i}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={isHour ? "#374151" : "#d1d5db"}
        strokeWidth={isHour ? 2 : 1}
      />
    );
  });

  // ── Hour labels (12, 1, 2 … 11) ───────────────────────────────────────────
  const hourLabels = Array.from({ length: 12 }, (_, i) => {
    const num = i === 0 ? 12 : i;
    const deg = i * 30;
    const pos = degToXY(deg, R - 28);
    return (
      <text
        key={i}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
        fill="#111827"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      >
        {num}
      </text>
    );
  });

  // ── Minute hand ───────────────────────────────────────────────────────────
  const handTip = degToXY(handDeg, HAND_LEN);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" aria-label="Analog clock" role="img">
      {/* Clock face background */}
      <circle cx={CX} cy={CY} r={R} fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />

      {/* Event pie slices */}
      {slices.map((s, i) => (
        <path key={i} d={buildArcPath(s.startDeg, s.endDeg)} fill={s.color} opacity="0.75" />
      ))}

      {/* Tick marks */}
      {tickMarks}

      {/* Hour labels */}
      {hourLabels}

      {/* Minute hand */}
      <line x1={CX} y1={CY} x2={handTip.x} y2={handTip.y} stroke="#111827" strokeWidth="3" strokeLinecap="round" />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="6" fill="#111827" />
    </svg>
  );
}

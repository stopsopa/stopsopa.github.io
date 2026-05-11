/**
 *
 *     import drag, { getStyle } from "drag.js";
 *
 *     const element = document.querySelector(...)
 *
 *     drag(
 *         element,
 *         (x, y) => {
 *             element.style.left = `${x}px`;
 *             element.style.top = `${y}px`;
 *         },
 *         () => {
 *             const s = getStyle(element);
 *             return { x: parseInt(s.left, 10) || 0, y: parseInt(s.top, 10) || 0 };
 *         }
 *     );
 */

export function getStyle(el: HTMLElement): CSSStyleDeclaration {
  return window.getComputedStyle(el);
}

export type DragListener = (x: number, y: number, type: "mousedown" | "mousemove" | "mouseup") => void;

export type DragFetch = () => { x: number; y: number };

export default function drag(element: HTMLElement, listener: DragListener, fetch?: DragFetch) {
  let pageX = 0;
  let pageY = 0;
  let down = false;
  let fetchX: number;
  let fetchY: number;

  function mousedown(e: MouseEvent) {
    down = true;
    pageX = e.pageX;
    pageY = e.pageY;

    if (typeof fetch === "function") {
      const result = fetch();
      fetchX = result.x;
      fetchY = result.y;
    } else {
      fetchX = 0;
      fetchY = 0;
    }

    listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousedown");

    function mousemove(me: MouseEvent) {
      if (down) {
        listener(fetchX + me.pageX - pageX, fetchY + me.pageY - pageY, "mousemove");
      }
    }

    const mouseup = (ue: MouseEvent) => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
      if (down) {
        down = false;
        listener(fetchX + ue.pageX - pageX, fetchY + ue.pageY - pageY, "mouseup");
      }
    };

    document.addEventListener("mouseup", mouseup);
    document.addEventListener("mousemove", mousemove);
  }

  element.addEventListener("mousedown", mousedown);
}

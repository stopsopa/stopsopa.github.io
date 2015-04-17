/**
 * Modified by Claude to return unbind function
 *
 * During works on the project https://github.com/stopsopa/images
 */
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

export type Unbind = () => void;

export default function drag(element: HTMLElement, listener: DragListener, fetch?: DragFetch): Unbind {
  let pageX = 0;
  let pageY = 0;
  let down = false;
  let fetchX: number;
  let fetchY: number;

  function mousemove(e: MouseEvent) {
    if (down) {
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousemove");
    }
  }

  function mouseup(e: MouseEvent) {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
    if (down) {
      down = false;
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mouseup");
    }
  }

  function mousedown(e: MouseEvent) {
    down = true;
    pageX = e.pageX;
    pageY = e.pageY;
    if (typeof fetch === "function") {
      const result = fetch();
      fetchX = result.x;
      fetchY = result.y;
    } else {
      fetchX = fetchY = 0;
    }
    listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousedown");

    document.addEventListener("mouseup", mouseup);
    document.addEventListener("mousemove", mousemove);
  }

  element.addEventListener("mousedown", mousedown);

  return function unbind() {
    element.removeEventListener("mousedown", mousedown);
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };
}

/**
 * Modified by Claude to return unbind function
 * 
 * During works on the project https://github.com/stopsopa/images
 */
/**

    import drag, { getStyle } from "drag.js";

    const element = document.querySelector(...)

    drag(
        element,
        (x, y) => {
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        },
        () => {
            const s = getStyle(element);
            return { x: parseInt(s.left, 10) || 0, y: parseInt(s.top, 10) || 0 };
        }
    );
 */

export function getStyle(el) {
  return window.getComputedStyle(el);
}
export default function drag(element, listener, fetch) {
  let pageX = 0;
  let pageY = 0;
  let down = false;
  let fetchX;
  let fetchY;
  function mousemove(e) {
    if (down) {
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousemove");
    }
  }

  function mouseup(e) {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
    if (down) {
      down = false;
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mouseup");
    }
  }

  function mousedown(e) {
    down = true;
    pageX = e.pageX;
    pageY = e.pageY;
    if (typeof fetch === "function") {
      ({ x: fetchX, y: fetchY } = fetch());
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

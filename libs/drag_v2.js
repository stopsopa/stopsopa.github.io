// libs/drag_v2.ts
function getStyle(el) {
  return window.getComputedStyle(el);
}
function drag(element, listener, fetch) {
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
export { drag as default, getStyle };

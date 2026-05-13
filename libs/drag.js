function getStyle(el) {
  return window.getComputedStyle(el);
}
function drag(element, listener, fetch) {
  let pageX = 0;
  let pageY = 0;
  let down = false;
  let fetchX;
  let fetchY;
  function mousedown(e) {
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
    function mousemove(me) {
      if (down) {
        listener(fetchX + me.pageX - pageX, fetchY + me.pageY - pageY, "mousemove");
      }
    }
    const mouseup = (ue) => {
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
export {
  drag as default,
  getStyle
};

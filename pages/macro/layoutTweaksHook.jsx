import { useEffect, useState } from "react";

function getScroll() {
  if (window.pageYOffset != undefined) {
    return parseInt(pageYOffset, 10);
  } else {
    return parseInt(document.documentElement.scrollTop || document.body.scrollTop || 0, 10);
  }
}

// https://stackoverflow.com/a/23749355
function getAbsoluteHeight(el) {
  // Get the DOM Node if you pass in a string
  el = typeof el === "string" ? document.querySelector(el) : el;

  var styles = window.getComputedStyle(el);
  var margin = parseFloat(styles["marginTop"]) + parseFloat(styles["marginBottom"]);

  return Math.ceil(el.offsetHeight + margin);
}

export default function layoutTweaksHook() {
  useEffect(() => {
    try {
      const top = document.querySelector(".acelayout > .top");

      const spacer = document.querySelector(".editors-parent > .spacer");

      const triggerResize = function () {
        console.log('triggerResize', top, spacer)
        const topHeight = getAbsoluteHeight(top);

        spacer.style.height = String(parseInt(topHeight, 10)) + "px";
      };
      window.addEventListener("resize", triggerResize);
      document.addEventListener("scroll", triggerResize);
      new ResizeObserver(triggerResize).observe(top);
      triggerResize();
    } catch (e) {
      // TODO: MINOR implement also unmounting
      console && console.log && console.log(`layoutTweaksHook error:`, e);
    }
  }, []);

  return null;
}

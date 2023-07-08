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
    console.log('layoutTweaksHook hook mounted')
    try {
      const top = document.querySelector(".this_element_changes_height_and_together_with_header_affect_spacer");

      const spacer = document.querySelector(".dynamic_spacer");

      const triggerResize = function () {
        console.log('triggerResize...', top, spacer)
        try {

          // console.log("triggerResize", top, spacer);
          const topHeight = getAbsoluteHeight(top);
  
          spacer.style.height = String(parseInt(topHeight, 10)) + "px";
        }
        catch (e) {

          const es = String(e);

          console.error('XXXXXXXXXXXXXXXXXXXXXXXXXXX', es)
        }
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

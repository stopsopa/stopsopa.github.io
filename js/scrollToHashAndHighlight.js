import trim from "./trim.js";

import log from "./log.js";

import getOffsetTop from "./getOffsetTop.js";

import maxWidth from "./maxWidth.js";

/**
     * Highlighting in stackoverflow style
     * 
      .scrollToHashAndHighlight {
        animation: highlighted-post-fade 3s;
        animation-timing-function: ease-out;
      }
      @keyframes highlighted-post-fade {
        0% {
          background-color: hsl(43, 85%, 88%);
        }
        100% {
          background-color: rgba(0, 0, 0, 0);
        }
      }
     */
const excludedTags = ["script", "br", "hr"];
function excludeElement(el) {
  const tag = el?.tagName?.toLowerCase();

  if (excludedTags.includes(tag)) {
    return true;
  }

  if (!el?.offsetLeft || !el?.offsetTop) {
    return true;
  }

  return false;
}
function hashchange() {
  var selector = trim(location.hash, "#");

  log(`hashchange -> selector >#${selector}<`);

  // Exit early if selector is empty
  if (!selector) {
    return;
  }

  try {
    var found = document.querySelector(`[id="${selector}"]`) || document.querySelector(`#${selector}`);

    log.blue(
      "executed",
      `window.scrollToHashAndHighlight found element [" + Boolean(found) + "] -> selector >#${selector}< >[id="${selector}"]<`,
      found
    );

    if (found) {
      const list = [];

      let next = found;

      let i = 50;

      const reg = /^h\d+$/;

      while (true) {
        i -= 1;

        if (
          window.getComputedStyle(next, null).getPropertyValue("background-color") == "rgba(0, 0, 0, 0)" &&
          !excludeElement(next)
        ) {
          list.push(next);
        }

        next = next.nextElementSibling;

        if (!next) {
          break;
        }

        if (i === 0) {
          log.red("executed", "window.scrollToHashAndHighlight break by counter");

          break;
        }

        const tag = next.tagName.toLowerCase();

        if (next.classList.contains("cards")) {
          break;
        }

        if (reg.test(tag) && next.hasAttribute("id")) {
          break;
        }
      }

      const first = list[0];
      const last = list[list.length - 1];

      log.gray("list", `window.scrollToHashAndHighlight list:`, last);

      // console.log("list: ", list, "first: ", first, "last: ", last, "found: ", found);
      /**
       * Create div with yellow background in offsetParent (closest element with position:relative;)
       */
      [...document.querySelectorAll(".scrollToHashAndHighlight")].forEach((e) => {
        e.remove();
      });
      const div = document.createElement("div");
      first.offsetParent.appendChild(div);
      const overFlowX = 15;
      const overFlowY = 5;
      const maxW = maxWidth(list);
      const firstLeft = first.offsetLeft;
      const firstTop = first.offsetTop;
      const lastLeft = last.offsetLeft;
      const lastTop = last.offsetTop;
      div.style.position = "absolute";
      div.style.zIndex = -1;
      div.style.left = firstLeft - overFlowX + "px";
      div.style.top = firstTop - overFlowY + "px";
      div.style.width = lastLeft - firstLeft + maxW + 2 * overFlowX + "px";
      div.style.height = lastTop - firstTop + last.offsetHeight + 2 * overFlowY + "px";
      div.classList.add("scrollToHashAndHighlight");
      window.scrollTo(0, getOffsetTop(found) - 100);
      setTimeout(function () {
        div.remove();
      }, 3000);
      // console.log({
      //   "div.style.left": firstLeft - overFlowX,
      //   "div.style.top": firstTop - overFlowY,
      //   "div.style.width": lastLeft - firstLeft + maxW + 2 * overFlowX,
      //   "div.style.height": lastTop - firstTop + last.offsetHeight + 2 * overFlowY,
      //   list,
      //   offsetParent: first.offsetParent,
      // });

      /**
       * create div with yellow background always in document.body
       */
      // [...document.querySelectorAll(".scrollToHashAndHighlight")].forEach((e) => {
      //   e.remove();
      // });
      // const div = document.createElement("div");
      // document.body.appendChild(div);
      // const overFlowX = 15;
      // const overFlowY = 5;
      // const maxW = maxWidth(list);
      // const firstLeft = getOffsetLeft(first);
      // const firstTop = getOffsetTop(first);
      // const lastLeft = getOffsetLeft(last);
      // const lastTop = getOffsetTop(last);
      // div.style.position = "absolute";
      // div.style.zIndex = -1;
      // div.style.left = firstLeft - overFlowX + "px";
      // div.style.top = firstTop - overFlowY + "px";
      // div.style.width = lastLeft - firstLeft + maxW + 2 * overFlowX + "px";
      // div.style.height = lastTop - firstTop + last.offsetHeight + 2 * overFlowY + "px";
      // div.classList.add("scrollToHashAndHighlight");
      // window.scrollTo(0, getOffsetTop(found) - 100);
      // // setTimeout(function () {
      // //   div.remove();
      // // }, 3000);
      // console.log({
      //   "div.style.left": firstLeft - overFlowX,
      //   "div.style.top": firstTop - overFlowY,
      //   "div.style.width": lastLeft - firstLeft + maxW + 2 * overFlowX,
      //   "div.style.height": lastTop - firstTop + last.offsetHeight + 2 * overFlowY,
      //   list,
      //   offsetParent: first.offsetParent,
      // });
    }
  } catch (e) {
    log.red("error: ", `window.scrollToHashAndHighlight catch(), selector >#${selector}< >[id="${selector}"]<`, e);
  }
}

/**
 * Short "keep me on target" window after page load, not a permanent listener.
 *
 * Why: page opened from outside of the browser (terminal: open "https://...#hash") might scroll
 * before the layout is final (ACE editors still collapsed), then the layout grows and the target moves away.
 *
 * 1. watch height of <body> (ResizeObserver - change of content, not only resize of the window)
 * 2. on each change scroll to the hash and highlight again
 * 3. stop for good (observer disconnected) on whichever comes first:
 *    - user takes control: first wheel, touch, key or mouse button - so it never fights the user
 *    - 5 sec after the page is visible (for tab loaded in the background counting starts when it is shown)
 *
 * Later change of the hash still scrolls once, but doesn't start new watching window.
 * Side effect: each repeated scroll restarts the yellow highlight.
 */
function followLayout() {
  const events = ["wheel", "touchstart", "keydown", "mousedown"];

  // ResizeObserver always fires once just after observe() - that one is not a change of layout
  let first = true;

  const observer = new ResizeObserver(function () {
    if (first) {
      first = false;

      return;
    }

    log.gray("resize", "window.scrollToHashAndHighlight layout changed - scrolling again");

    hashchange();
  });

  observer.observe(document.body);

  function stop() {
    observer.disconnect();

    events.forEach((name) => window.removeEventListener(name, stop));
  }

  events.forEach((name) => window.addEventListener(name, stop, { passive: true }));

  function arm() {
    setTimeout(stop, 5000);
  }

  if (document.hidden) {
    document.addEventListener("visibilitychange", arm, { once: true });
  } else {
    arm();
  }
}

export default function scrollToHashAndHighlight() {
  hashchange();

  window.addEventListener("hashchange", hashchange);

  followLayout();
}

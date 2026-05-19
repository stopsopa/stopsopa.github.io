// ==UserScript==
// @name         Gmail Backspace -> U (Safe)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Use Backspace to return to inbox in Gmail safely
// @match        https://mail.google.com/*
// @grant        none
// ==/UserScript==

const scriptname = GM_info.script.name;

function unique(pattern) {
  // node.js require('crypto').randomBytes(16).toString('hex');
  pattern || (pattern = "xyxyxy");
  return pattern.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const log = (function (log) {
  const un = unique();
  return (...args) =>
    log(`%ctampermonkey ${GM_info.script.version} ${un} [${scriptname}]`, "color: hsl(289deg 68% 53%)", ...args);
})(
  (function () {
    try {
      return console.log;
    } catch (e) {
      return () => {};
    }
  })()
);

if (window.top === window.self) {
  //-- Don't run on frames or iframes
  log("loading");
} else {
  return log(`loading in iframe - stopped`);
}

(function () {
  "use strict";

  log("start");

  function dispatchKey(key) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        code: `Key${key.toUpperCase()}`,
        keyCode: key.toUpperCase().charCodeAt(0),
        which: key.toUpperCase().charCodeAt(0),
        bubbles: true,
      })
    );
  }

  document.addEventListener(
    "keydown",
    function (e) {
      // Only plain Backspace
      if (e.key !== "Backspace" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        log("abort first", {
          "e.key": e.key,
          "e.key !== Backspace": e.key !== "Backspace",
          "e.ctrlKey": e.ctrlKey,
          "e.metaKey": e.metaKey,
          "e.altKey": e.altKey,
          "e.shiftKey": e.shiftKey,
        });
        return;
      }

      const active = document.activeElement;

      // NEVER trigger while typing/editing
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
        log("abort second");
        return;
      }

      // Gmail compose window detection
      const composeWindow = document.querySelector('[role="dialog"]');

      // If compose is open, do nothing
      if (composeWindow) {
        log("abort third");
        return;
      }

      log("trigger u");

      // Prevent browser back navigation
      e.preventDefault();
      e.stopPropagation();

      ["keydown", "keypress"].forEach((type) => {
        dispatchKey("u");
        document.dispatchEvent(
          new KeyboardEvent(type, {
            key: "u",
            code: "KeyU",
            keyCode: 85,
            which: 85,
            bubbles: true,
          })
        );
      });
    },
    true
  );

  addCss(`
[role="row"][tabindex="0"] {
  box-shadow: 0 0 5px #d00000;
}

    `);

  function addCss(css) {
    var head = document.head || document.getElementsByTagName("head")[0];

    var styleElement = document.createElement("style");

    head.appendChild(styleElement);

    styleElement.type = "text/css";

    styleElement.appendChild(document.createTextNode(css));

    return {
      unmountStyle: () => {
        styleElement.parentNode.removeChild(styleElement);
      },
      styleElement,
    };
    return;
  }
})();

// ==UserScript==
// @name         ** youtube-popup-autoclick
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      /youtube\.com\//
// @icon         https://www.google.com/s2/favicons?sz=64&domain=heg.com
// @grant        none
// ==/UserScript==

const scriptname = "youtube-popup-autoclick";

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
    log(
      `%ctampermonkey ${un} [${scriptname}] time: ${new Date().toISOString().substring(0, 19).replace(/T/, " ")}`,
      "color: hsl(289deg 68% 53%)",
      ...args
    );
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

  const { toolbox } = toolboxFactory();

  //   var log = console.log;

  var beep = (function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return function (opt) {
      let { volume, frequency, type, duration } = {
        volume: 0.1,
        frequency: 3000,
        type: "sawtooth",
        duration: 1000,
        ...opt,
      };
      return new Promise((resolve) => {
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.value = volume;
        oscillator.frequency.value = frequency;
        oscillator.type = type;

        oscillator.start();

        setTimeout(function () {
          oscillator.stop();
          setTimeout(resolve, 100);
        }, duration);
      });
    };
  })();

  async function highSound() {
    await beep({
      volume: 0.15,
      frequency: 482,
      type: "triangle",
      duration: 30,
    });
  }
  async function normalSound() {
    await beep({
      volume: 0.15,
      frequency: 442,
      type: "triangle",
      duration: 50,
    });
  }
  async function lowSound() {
    await beep({
      volume: 0.15,
      frequency: 402,
      type: "triangle",
      duration: 50,
    });
  }

  function findToSmallButton() {
    // button which once clicked brings miniplayer in the bottom right corner
    return document.querySelector(".ytp-miniplayer-button");
  }

  function findToBigButton() {
    // button which once clicked brings back big view
    return document.querySelector(".ytp-miniplayer-expand-watch-page-button");
  }

  async function toMiniplayer() {
    await normalSound();

    const button = findToSmallButton();

    if (!button) {
      return log(`can't find button findToSmallButton`);
    }

    button.click();

    async function check() {
      const find = findToBigButton();

      if (find) {
        lowSound();
      } else {
        setTimeout(check, 500);
      }
    }

    check();
  }

  async function toNormalSize() {
    await normalSound();

    const button = findToBigButton();

    if (!button) {
      return log(`can't find button findToBigButton`);
    }

    button.click();

    document.querySelector(".ytp-miniplayer-button").click();

    async function check() {
      const find = findToSmallButton();

      if (find) {
        highSound();
      } else {
        setTimeout(check, 500);
      }
    }

    check();
  }

  function isInMiniplayerMode() {
    const width = getComputedStyle(document.querySelector("#ytd-player")).width;

    if (typeof width !== "string") {
      throw new Error(`tampermonkey ${scriptname} throw: width is not a string`);
    }

    const num = parseInt(width, 10);

    if (!Number.isInteger(num) || num < 1) {
      throw new Error(
        `tampermonkey ${scriptname} throw: num value seems not right, should be integer > 0 but it is >${num}<`
      );
    }

    const expected = 400;

    const tolerance = 50;

    const inTolerance = Math.abs(num - expected) <= tolerance;

    return inTolerance;
  }

  function focus() {
    setTimeout(() => {
      if (document.hidden) {
        log("focus hidden");
      } else {
        log("focus visible");
        if (isInMiniplayerMode()) {
          toNormalSize();
        }
      }
    }, 100);

    // log(`window.addEventListener('focus')`,...args);
  }
  function blur() {
    setTimeout(() => {
      if (document.hidden) {
        log("blur hidden");
      } else {
        log("blur visible");
      }
      if (!isInMiniplayerMode()) {
        toMiniplayer();
      }
    }, 100);
  }

  let enabled = false;
  const [on, off, element] = toolbox.htmlAndClose(`MiniPlayer`, `🎶`, {
    onEnable: () => {
      if (!enabled) {
        enabled = true;
        on();
        window.addEventListener("focus", focus);
        window.addEventListener("blur", blur);
      }
    },
    onDisable: () => {
      if (enabled) {
        enabled = false;
        window.removeEventListener("focus", focus);
        window.removeEventListener("blur", blur);
        off();
      }
    },
  });

  /// injector: ../toolbox.js
})();

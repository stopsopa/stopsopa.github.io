// ==UserScript==
// @name         youtube media buttons - increase speed & rewind
// @namespace    http://tampermonkey.net/
// @version      p3
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         https://i.imgur.com/Fx0vfuw.png
// @grant        none
// ==/UserScript==

// test entire project with https://stopsopa.github.io/pages/html/video.html
// @include      /youtube\.com\//

/**
 * YouTube Playback Speed Controller via Media & Modifier Keys
 *
 * Controls:
 * • "Previous" media key: Rewind 3 seconds
 * • "Next" media key (short press): Skip ahead 3 seconds
 * • "Next" media key (hold 500ms+): Holding "Next" does two things simultaneously:
 *   1. Immediately speeds up video to stored speed (default 1.7×) - plays faster while "Next" is held, returns to 1× when released
 *   2. Activates speed adjustment mode - allows real-time speed modifications:
 *      - Press Control/Option keys: Increase speed by 0.1×
 *      - Press Shift/Command keys: Decrease speed by 0.1×
 *      - Also works with "Volume Up"/"Volume Down" media keys
 *   - Release "Next" media key: Returns to normal 1× speed (adjusted speed saved for next hold)
 *
 *   Update:
 *     Now when you press and hold "Next" and then press and hold Shift and first release "Next" and then Shfit
 *       then video will stay "speeding" until you click Shift again.
 *
 * Speed is stored in localStorage (0.1×-2× range, default 1.7×)
 * Visual feedback shows current speed on adjustment
 */

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
    log(
      `%ctampermonkey ${GM_info.script.version} ${un} [${scriptname}] time: ${new Date()
        .toISOString()
        .substring(0, 19)
        .replace(/T/, " ")}`,
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

  log("loaded");

  let video;
  let workingOnVideoPlay;
  // // add function like:
  // function onVideoPlay(event) {
  //   const video = event.currentTarget;
  //   console.log("Video started playing:", video);
  // }

  (function () {
    const boundVideos = new WeakSet();

    function bind(v) {
      if (!v.matches("video")) return;

      if (boundVideos.has(v)) return;

      boundVideos.add(v);

      v.addEventListener("play", onVideoPlay);
    }

    document.addEventListener("mouseover", (event) => {
      //log('over', event.target, 'current', video)

      const v = event.target;

      bind(v);
    });

    [...document.querySelectorAll("video")].forEach((v) => bind(v));

    function onVideoPlay(event) {
      if (typeof workingOnVideoPlay !== "function") {
        return;
      }
      workingOnVideoPlay(event);
    }
  })();

  function visible(el) {
    if (!(el instanceof Element)) return false;

    // 1. Must have layout boxes
    if (!el.getClientRects().length) return false;

    const style = getComputedStyle(el);

    // 2. Common CSS visibility checks
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      style.opacity === "0"
    ) {
      return false;
    }

    // 3. Must be within viewport
    const rect = el.getBoundingClientRect();

    const inViewport =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth);

    if (!inViewport) return false;

    // 4. Walk up the DOM tree to ensure no hidden parents
    let parent = el.parentElement;
    while (parent) {
      const parentStyle = getComputedStyle(parent);
      if (parentStyle.display === "none" || parentStyle.visibility === "hidden" || parentStyle.opacity === "0") {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  }
  /* ---------------------------------------------------------
   * Shadow-aware element discovery
   * ------------------------------------------------------- */
  function querySelectorAllDeep(selector, startRoot = document) {
    const results = [];
    const seen = new Set();

    function traverse(root) {
      // log("selector", selector);
      root.querySelectorAll(selector).forEach((el) => {
        const vi = visible(el);
        log("video visible", el, vi);
        if (!seen.has(el)) {
          seen.add(el);
          if (vi) {
            results.push({ root, element: el });
          }
        }
      });

      /*
      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) {
          traverse(el.shadowRoot);
        }
      });
      */
    }

    traverse(startRoot);
    return results;
  }

  const findUniqueSelector = (function () {
    /* ---------------------------------------------------------
     * Root-scoped uniqueness check (CRITICAL)
     * ------------------------------------------------------- */
    function isUniqueInRoot(selector, root) {
      const list = root.querySelectorAll(selector);
      return list.length === 1 ? list[0] : null;
    }

    /* ---------------------------------------------------------
     * Class combinations helper
     * ------------------------------------------------------- */
    function combinations(arr, maxLen = 3) {
      const result = [];
      const n = arr.length;

      for (let len = 2; len <= Math.min(maxLen, n); len++) {
        const helper = (start, combo) => {
          if (combo.length === len) {
            result.push([...combo]);
            return;
          }
          for (let i = start; i < n; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
          }
        };
        helper(0, []);
      }

      return result;
    }

    const ATTRS = ["src", "poster"];

    /* ---------------------------------------------------------
     * MAIN API
     * ------------------------------------------------------- */
    return function findUniqueSelector(element) {
      if (!(element instanceof Element)) {
        throw new Error("Expected a DOM Element");
      }

      const root = element.getRootNode(); // Document | ShadowRoot
      const tag = element.tagName.toLowerCase();

      let selector;

      /* ---------- 1. ID ---------- */
      if (element.id) {
        selector = `${tag}#${CSS.escape(element.id)}`;
        if (isUniqueInRoot(selector, root) === element) {
          return { root, selector };
        }
      }

      const classes = [...element.classList];

      /* ---------- 2. Single class ---------- */
      for (const cls of classes) {
        selector = `${tag}.${CSS.escape(cls)}`;
        if (isUniqueInRoot(selector, root) === element) {
          return { root, selector };
        }
      }

      /* ---------- 3. Class combinations ---------- */
      for (const combo of combinations(classes, 3)) {
        selector = `${tag}.${combo.map(CSS.escape).join(".")}`;
        if (isUniqueInRoot(selector, root) === element) {
          return { root, selector };
        }
      }

      /* ---------- 4. Attribute selectors ---------- */
      for (const attr of ATTRS) {
        const val = element.getAttribute(attr);
        if (!val) continue;

        selector = `${tag}[${attr}="${CSS.escape(val)}"]`;
        if (isUniqueInRoot(selector, root) === element) {
          return { root, selector };
        }
      }

      /* ---------- 5. Last resort: nth-of-type ---------- */
      const parent = element.parentElement;
      if (parent) {
        const siblings = [...parent.children].filter((el) => el.tagName === element.tagName);
        const index = siblings.indexOf(element);

        if (index !== -1) {
          const parentSelector = parent.id ? `#${CSS.escape(parent.id)}` : parent.tagName.toLowerCase();

          selector = `${parentSelector} > ${tag}:nth-of-type(${index + 1})`;
          if (isUniqueInRoot(selector, root) === element) {
            return { root, selector };
          }
        }
      }

      throw new Error("Could not find unique selector in this root");
    };
  })();

  var lockedSpeed = false;

  (async function () {
    try {
      video = await new Promise((resolve, reject) => {
        let attempt = 10;
        let cp = attempt;
        function run() {
          if (attempt === 0) {
            return reject(`attempted ${cp} times to find <video> and failed`);
          }
          attempt -= 1;
          //const video = document.querySelector("video");
          // return resolve(video)

          const videos = querySelectorAllDeep("video");
          //log("videos:", videos);
          if (videos && videos.length > 0) {
            const video = videos[0].element;

            log(`attempt ${attempt} video found`, video);

            return resolve(video);
          } else {
            log(`attempt ${attempt} video element not found`);

            setTimeout(run, 800);
          }
        }
        run();
      });

      workingOnVideoPlay = function (event) {
        video = event.currentTarget;
        //log('found video element:', video)
      };

      const selector = findUniqueSelector(video);

      //log("selector: ", selector);

      // Initialize - preserve natural video speed
      let currentSpeed = video.playbackRate;
      let initialSpeed = video.playbackRate;

      let holdTimeout = null;
      let isHolding = false;
      let volumeListenersActive = false;

      function changeIsHolding(bool) {
        if (typeof bool !== "boolean") {
          throw new Error(`changeIsHolding arg is not bool >${bool}<`);
        }
        console.log(`isHolding = ${bool}`);
        isHolding = bool;
      }

      // Speed management
      const SPEED_STORAGE_KEY = "youtube-speed-factor";
      const DEFAULT_SPEED = 1.7;

      // Function to get valid speed from localStorage or return default
      function getValidStoredSpeed() {
        const storedSpeed = localStorage.getItem(SPEED_STORAGE_KEY);
        if (storedSpeed !== null) {
          const parsedSpeed = parseFloat(storedSpeed);
          if (!isNaN(parsedSpeed) && parsedSpeed >= 0.1) {
            return parsedSpeed;
          }
        }
        return DEFAULT_SPEED;
      }

      // Speed display element

      const createSpeedDisplayDiv = (function () {
        const cls = "createSpeedDisplayDiv";
        return function () {
          let element = document.querySelector(`.${cls}`);

          if (!element) {
            element = document.createElement("div");
            element.classList.add(cls);
            element.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 10000;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-family: 'Roboto', Arial, sans-serif;
              font-size: 16px;
              font-weight: 500;
              pointer-events: none;
              display: none;
          `;
            document.body.appendChild(element);
          }
          return element;
        };
      })();

      function showSpeedDisplay(duration = 2000) {
        const displayDiv = createSpeedDisplayDiv();
        displayDiv.textContent = `${currentSpeed.toFixed(1)}×`;
        displayDiv.style.display = "block";

        // Hide after specified duration
        setTimeout(() => {
          displayDiv.style.display = "none";
        }, duration);
      }

      function updateStoredSpeed(newSpeed) {
        const clampedSpeed = Math.max(0.1, newSpeed); // Clamp minimum to 0.1×, no maximum limit

        // Store in localStorage if different from default, otherwise remove
        if (Math.abs(clampedSpeed - DEFAULT_SPEED) < 0.01) {
          localStorage.removeItem(SPEED_STORAGE_KEY);
        } else {
          localStorage.setItem(SPEED_STORAGE_KEY, clampedSpeed.toString());
        }

        // Apply the new speed to the video immediately
        currentSpeed = clampedSpeed;
        video.playbackRate = currentSpeed;
        showSpeedDisplay();

        log("→ Speed changed to", clampedSpeed.toFixed(1) + "×");
      }

      // Volume event handlers
      function handeSpeedUp(event) {
        log("handeSpeedUp:", event.detail.action === "pressed");
        if (event.detail.action === "pressed") {
          updateStoredSpeed(currentSpeed + 0.1);
          console.log("+0.1");
        }
      }

      function handeSpeedDown(event) {
        log("handeSpeedDown:", event.detail.action === "pressed");
        if (event.detail.action === "pressed") {
          // If speed is above 2x, first press should bring it back to 2x
          if (currentSpeed > 2) {
            updateStoredSpeed(2);
          } else {
            updateStoredSpeed(currentSpeed - 0.1);
            console.log("-0.1");
          }
        }
      }
      let shiftPressed = false;
      let lastShiftPressTime = 0;
      const DOUBLE_PRESS_THRESHOLD = 500;
      function handleShift(event) {
        const isPressed = event.detail.action === "pressed";
        shiftPressed = isPressed;

        if (isPressed) {
          const now = Date.now();
          const isDoublePress = now - lastShiftPressTime < DOUBLE_PRESS_THRESHOLD;
          lastShiftPressTime = now;

          if (lockedSpeed && isDoublePress && video.playbackRate !== initialSpeed) {
            console.log("Double Shift detected - resetting speed");
            lockedSpeed = false;
            currentSpeed = initialSpeed;
            video.playbackRate = initialSpeed;
            showSpeedDisplay();
          }
        }
      }

      document.addEventListener("keyboardShift", handleShift);

      function registerVolumeListeners() {
        if (volumeListenersActive) return;
        log("→ Volume listeners registered");
        // Modifier keys: Control & Option act as volumeUp
        document.addEventListener("keyboardOption", handeSpeedUp);
        // Modifier keys: Shift & Command act as volumeDown
        // document.addEventListener("keyboardShift", handleShift);
        document.addEventListener("keyboardCommand", handeSpeedDown);
        volumeListenersActive = true;
      }

      function unregisterVolumeListeners() {
        if (!volumeListenersActive) return;
        log("→ Volume listeners unregistered");
        // Modifier keys: Control & Option act as volumeUp
        document.removeEventListener("keyboardOption", handeSpeedUp);
        // Modifier keys: Shift & Command act as volumeDown
        // document.removeEventListener("keyboardShift", handleShift);
        document.removeEventListener("keyboardCommand", handeSpeedDown);
        volumeListenersActive = false;
      }

      document.addEventListener("mediaNext", (event) => {
        log("mediaNext :", event.detail.action, "document.hidden", document.hidden);

        if (document.hidden) {
          return;
        }

        if (event.detail.action === "pressed") {
          lockedSpeed = false;
          changeIsHolding(false);
          registerVolumeListeners();

          // after 500ms of holding, apply the stored speed (adjusted by volume keys)
          holdTimeout = setTimeout(() => {
            changeIsHolding(true);
            const speedToApply = getValidStoredSpeed();

            currentSpeed = speedToApply; // Don't use updateSpeed here to avoid localStorage changes
            video.playbackRate = currentSpeed;
            showSpeedDisplay();

            log("→ Started hold speed:", speedToApply.toFixed(1) + "×");
          }, 500); // adjust threshold as needed
        } else {
          // "released"
          clearTimeout(holdTimeout);
          unregisterVolumeListeners();

          if (isHolding) {
            // was in hold mode → restore to 1× (normal speed)
            if (shiftPressed) {
              lockedSpeed = true;
            } else {
              currentSpeed = initialSpeed;
              video.playbackRate = initialSpeed;
              showSpeedDisplay();
            }
            log("→ Back to 1× speed");
          } else {
            // short press → jump ahead 3 s (no speed display needed)
            video.currentTime = Math.min(video.duration, video.currentTime + 3);
            log("→ Skipped ahead 3 s");
          }

          changeIsHolding(false);
        }
      });

      document.addEventListener("mediaPrevious", (event) => {
        log("mediaPrevious:", event.detail.action, "document.hidden", document.hidden);

        if (document.hidden) {
          return;
        }

        if (event.detail.action === "pressed") {
          video.currentTime = Math.max(0, video.currentTime - 3);
        }
      });

      (function () {
        // everything in this block goes together wiht https://github.com/stopsopa/os-browser-bridge/commit/0b99fd4cae061846325749571ca52acc2ad4164b
        document.addEventListener("mediaPlay", (event) => {
          log("mediaPlay:", event.detail.action, "document.hidden", document.hidden);

          if (document.hidden) {
            return;
          }

          if (event.detail.action === "pressed") {
            document.querySelector('tp-yt-paper-dialog [id="close-button"]')?.click();
            return;
            // let's not do that here, allow native media keyboard buttons to control it
            // this way when I take off my headphones we give a chance for native event to stop music
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
          }
        });

        (function () {
          let isCommandPressed = false;
          document.addEventListener("keyboardCommand", (e) => {
            isCommandPressed = e.detail.action === "pressed";
          });
          document.addEventListener(
            "mediaNext",
            (e) => {
              if (document.hidden) {
                return;
              }
              if (isCommandPressed && e.detail.action === "pressed") {
                log("→ Playlist Next (Local override)");
                document.querySelector(".ytp-next-button")?.click();
                e.stopImmediatePropagation();
              }
            },
            true
          );
          document.addEventListener(
            "mediaPrevious",
            (e) => {
              if (document.hidden) {
                return;
              }
              if (isCommandPressed && e.detail.action === "pressed") {
                log("→ Playlist Previous (Local override)");
                document.querySelector(".ytp-prev-button")?.click();
                e.stopImmediatePropagation();
              }
            },
            true
          );
        })();
      })();
    } catch (e) {
      log("general try catch error:", e);
    }
  })();
})();

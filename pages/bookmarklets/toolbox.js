const log = console.log;

/**
 * the best way of debugging this file is just open
 *    http://stopsopa.github.io.local:7898/pages/bookmarklets/toolbox.html
 */
function toolboxFactory() {
  // https://stopsopa.github.io/pages/bookmarklets/toolbox.html
  // https://stopsopa.github.io/viewer.html?file=/pages/bookmarklets/toolbox.js

  // urlwizzard.schema://urlwizzard.hostnegotiated/pages/bookmarklets/toolbox.html
  // urlwizzard.schema://urlwizzard.hostnegotiated/viewer.html?file=/pages/bookmarklets/toolbox.js

  // const { toolbox, toggleMenu } = toolboxFactory();

  // // toggleMenu(); // to open menu by default - usually don't uncomment this line

  //   const [on, off, element] = toolbox.htmlAndClose(`MiniPlayer`, `🎶`, {
  //     onDisable: () => {
  //       window.removeEventListener("focus", focus);
  //       window.removeEventListener("blur", blur);
  //       off(); // hide small badge indicating plugin is enabled
  //     },
  //   });

  //   function activate() {
  //     on(); // show small badge indicating plugin is enabled
  //     window.addEventListener("focus", focus);
  //     window.addEventListener("blur", blur);

  //     element.removeEventListener("click", activate);
  //   }

  //   element.addEventListener("click", activate);

  const bookmarname = "toolbox";

  function getNative(key) {
    const v = localStorage.getItem(key);
    if (v !== null) {
      const tmp = parseInt(v, 10);
      if (isNaN(tmp)) {
        return v;
      }
      return tmp;
    }
  }
  function createGet(bookmarname) {
    return (key) => getNative(`bookmark-toolbox:${bookmarname}:${key}`);
  }
  function setNative(key, val) {
    if (val !== null && typeof val !== "undefined") {
      localStorage.setItem(key, String(val));
    }
  }
  function createSet(bookmarname) {
    return (key, val) => setNative(`bookmark-toolbox:${bookmarname}:${key}`, val);
  }
  const get = createGet(bookmarname);
  const set = createSet(bookmarname);
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
        ({ x: fetchX, y: fetchY } = fetch());
      } else {
        fetchX = fetchY = 0;
      }
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousedown");
      function mousemove(e) {
        if (down) {
          listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousemove");
        }
      }
      document.addEventListener("mouseup", (e) => {
        document.removeEventListener("mousemove", mousemove);
        if (down) {
          down = false;
          listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mouseup");
        }
      });
      document.addEventListener("mousemove", mousemove);
    }
    element.addEventListener("mousedown", mousedown);
  }
  function addCss(label, css) {
    var head = document.getElementsByTagName("head")[0];

    var s = document.createElement("style");

    s.setAttribute("data-origin", String(label));

    head.appendChild(s);

    s.type = "text/css";

    s.appendChild(document.createTextNode(css));
  }

  const cls = "bookmarkstoolbox";

  const selector = `.${cls}`;

  let parent = document.querySelector(selector);

  function toggleMenu() {
    parent.classList.toggle("hide");
  }

  if (!parent) {
    parent = document.createElement("div");

    parent.classList.add(cls, "hide");

    parent.innerHTML = `
<div><span>🧰 toolbox:</span><span>🧰</span></div>
<div></div>
<div></div>
`;
    {
      let timeOnMousedown;
      const tresholdMs = 200;
      parent.children[0].addEventListener("mousedown", (e) => {
        timeOnMousedown = new Date();
      });
      parent.children[0].addEventListener("mouseup", (e) => {
        if (new Date().getTime() - timeOnMousedown > tresholdMs) {
          log("not in treshold");
        } else {
          toggleMenu();
        }
      });
    }

    document.body.appendChild(parent);

    addCss(
      cls,
      `
      .bookmarkstoolbox {
        user-select: none;
        position: fixed;
        top: 20px;
        left: 20px;
        border: 1px solid gray;
        background-color: white;
        z-index: 2147483640;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
          "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        cursor: pointer;
        font-size: 14px;
      }
      .bookmarkstoolbox > div:first-child {
        padding-left: 5px;
        padding-right: 5px;
        background-color: rgb(193, 193, 193);
      }
      .bookmarkstoolbox > div:first-child:hover {
        background-color: rgb(172, 172, 172);
      }
      .bookmarkstoolbox > div:nth-child(2) > *:hover,
      .bookmarkstoolbox > div:nth-child(3) > *:hover {
        background-color: #d4d4d4;
      }
      .bookmarkstoolbox:not(.hide) > div:first-child > span:nth-child(2) {
        display: none;
      }
      .bookmarkstoolbox.hide > div:first-child > span:nth-child(1) {
        display: none;
      }
      .bookmarkstoolbox.hide > div:nth-child(2) {
        display: none;
      }
      .bookmarkstoolbox > div:last-child > div {
        padding-left: 5px;
        padding-right: 5px;
      }
      .bookmarkstoolbox:last-child > div:hover {
        background-color: rgb(226, 226, 226);
      }
      .bookmarkstoolbox > div:nth-child(3) {
        text-align: center;
      }
    `
    );
  }

  {
    function reposition() {
      let left = get("left") || 20;

      let top = get("top") || 20;

      const tolerance = 40;

      const width = window.innerWidth - tolerance;

      const height = window.innerHeight - tolerance;

      if (top > height) {
        top = height;
      }

      if (left > width) {
        left = width;
      }

      parent.style.left = `${left}px`;
      parent.style.top = `${top}px`;
    }
    window.addEventListener("resize", reposition);
    reposition();
  }

  drag(
    parent,
    (x, y) => {
      parent.style.left = `${x}px`;
      parent.style.top = `${y}px`;
      set("top", y);
      set("left", x);
    },
    () => {
      const s = getStyle(parent);
      return { x: parseInt(s.left, 10) || 0, y: parseInt(s.top, 10) || 0 };
    }
  );

  const box = parent.children[1];

  const statusbar = parent.children[2];

  return {
    addCss,
    drag,
    getStyle,
    createGet,
    createSet,
    toggleMenu,
    toolbox: {
      box,
      htmlAndClose: (html, icon, options) => {
        const { tag, onDisable, onEnable } = {
          tag: "div",
          onEnable: () => {},
          onDisable: () => {},
          ...options,
        };
        if (typeof html !== "string") {
          throw new Error(`${bookmarname} error: htmlAndClose html is not specified`);
        }
        if (typeof icon !== "string") {
          throw new Error(`${bookmarname} error: htmlAndClose icon is not specified`);
        }
        const d = document.createElement(tag);
        d.innerHTML = html;
        box.appendChild(d);
        d.addEventListener("click", () => {
          parent.classList.add("hide"), onEnable();
        });
        const badge = document.createElement("span");
        badge.addEventListener("click", () => {
          log(`badge disabling ${icon}`);
          onDisable();
        });
        badge.innerHTML = icon;
        return [
          () => {
            try {
              statusbar.appendChild(badge);
            } catch (e) {}
          },
          () => {
            try {
              statusbar.removeChild(badge);
            } catch (e) {}
          },
          d,
        ];
      },
    },
  };
}

import createScript from "./createScript.js";

import { filterVisibleList } from "./isVisibleElement.js";

import isObject from "./isObject.js";

import { debounceOnce } from "./debounce.js";

import trim from "./trim.js";

// import template from "./template.js";

import urlwizzard from "./urlwizzard.js";

import manipulation from "./manipulation.js";

import log from "./log.js";

import doSort from "./doSort.js";

import toc from "./toc.js";

window.manipulation = manipulation;

(function () {
  let found;
  try {
    found = Boolean(document.body);
  } catch (e) {}

  if (!found) {
    document.write(
      `<h1 style="color: red; position: fixed; top: 30%; background-color: white;">Can't find document.body - it probably means that /github.js is loaded in &lt;head> instead at the end of &lt;body></h1>`
    );
  }
})();

/**
 * Main mounting point in global scope
 */
window.sasync = {
  loaded: {},
};

// load common css and js

(function () {
  // <link rel="stylesheet" href="../../css/normalize.css">

  [
    "/css/normalize.css",
    "/css/main.css",
    "/noprettier/vanilla-tabs.css",
    "//fonts.googleapis.com/css?family=Open+Sans:300,400,500,700,900",
  ].forEach(function (u) {
    // https://stackoverflow.com/a/524721
    var head = document.head || document.getElementsByTagName("head")[0],
      style = document.createElement("link");

    // style.type = 'text/css';

    style.setAttribute("rel", "stylesheet");

    style.setAttribute("href", u);

    head.appendChild(style);
  });

  log.blue("executed", "adding extra styles");
})();

(function () {
  var tmp = document.createElement("div");

  tmp.innerHTML =
    '\
          <!-- generated by: https://www.favicon-generator.org/ -->\
          <!-- generated by: https://realfavicongenerator.net/favicon_result?file_id=p1e6ljeig5qc41s3r1s418k41qv86#.XqKd1NNKgxw -->\
          <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png?">\
          <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png?">\
          <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png?">\
          <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png?">\
          <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png?">\
          <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png?">\
          <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png?">\
          <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png?">\
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png?">\
          <link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png?">\
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?">\
          <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?">\
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?">\
          <link rel="manifest" href="/manifest.json">\
          <link rel="manifest" href="/site.webmanifest">\
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">\
          <meta name="msapplication-TileColor" content="#ffffff">\
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png?">\
          <meta name="theme-color" content="#ffffff">\
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\
      ';

  var h = document.getElementsByTagName("head")[0];

  Array.prototype.slice.call(tmp.children).forEach(function (e) {
    manipulation.append(h, e);
  });

  log.blue("DOMContentLoaded", "setting favicon", "[triggered in github.js]");
})();

(function () {
  function getOffsetLeft(elem) {
    var offsetLeft = 0;
    do {
      if (!isNaN(elem.offsetLeft)) {
        offsetLeft += elem.offsetLeft;
      }
    } while ((elem = elem.offsetParent));
    return offsetLeft;
  }
  function getOffsetTop(elem) {
    var offsetTop = 0;
    do {
      if (!isNaN(elem.offsetTop)) {
        offsetTop += elem.offsetTop;
      }
    } while ((elem = elem.offsetParent));
    return offsetTop;
  }
  function maxWidth(list) {
    let i = 0;

    list.forEach(function (el) {
      if (el.offsetWidth > i) {
        i = el.offsetWidth;
      }
    });

    return i;
  }
  function maxHeight(list) {
    let i = 0;

    list.forEach(function (el) {
      if (el.offsetHeight > i) {
        i = el.offsetHeight;
      }
    });

    return i;
  }

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
    const tag = el.tagName.toLowerCase();

    if (excludedTags.includes(tag)) {
      return true;
    }

    if (!el.offsetLeft || !el.offsetTop) {
      return true;
    }

    return false;
  }
  function hashchange() {
    var selector = trim(location.hash, "#");

    console.log("hashchange");

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

  window.scrollToHashAndHighlight = function () {
    hashchange();

    window.addEventListener("hashchange", hashchange);
  };
})();

window.buildHeader = async function () {
  document.querySelector("body > header") ||
    (function () {
      var body = document.body;

      log("attr in body - nohead:", body);

      if (!body.hasAttribute("nohead")) {
        var header = document.createElement("header");

        var a = document.createElement("a");
        a.setAttribute("href", "/index.html");

        var img = document.createElement("img");
        img.setAttribute("src", `${env("GITHUB_SOURCES_PREFIX")}/actions/workflows/pipeline.yml/badge.svg`);

        manipulation.prepend(a, img);
        // <a target="_blank"
        //   rel="noopener noreferrer"
        //   href="https://github.com/stopsopa/stopsopa.github.io/actions/workflows/pipeline.yml/badge.svg"
        // >
        //   <img
        //     src="https://github.com/stopsopa/stopsopa.github.io/actions/workflows/pipeline.yml/badge.svg"
        //     alt="example workflow"
        //     style="max-width: 100%;"
        //   >
        // </a>

        manipulation.prepend(header, a);

        manipulation.prepend(body, header);
      }

      log.blue("DOMContentLoaded NOHEAD", "handling nohead attr finished", "[triggered in github.js]");
    })();

  log.blue("executed NOHEAD", "handling nohead attr");
};

window.buildFooter = async function () {
  document.querySelector("body > footer") ||
    (function () {
      var body = document.body;

      log("attr in body - nofoot:", body);

      if (!body.hasAttribute("nofoot")) {
        var header = document.createElement("footer");

        manipulation.append(body, header);
      }

      log.blue("DOMContentLoaded NOFOOT", "handling nofoot attr finished", "[triggered in github.js]");
    })();

  log.blue("executed NOFOOT", "handling nofoot attr");
};

// edit & profile ribbons
(function () {
  // https://github.com/stopsopa/stopsopa.github.io/edit/master/demos/jquery.elkanatooltip/katownik.html
  // https://stopsopa.github.io/
  // user stopsopa
  // path /pages/css-grid/index.html

  window.isDevEnvironment = location.port !== "";

  var github = (function (def) {
    let host = def;

    var user = host.replace(/^(.*)\.github\.io$/, "$1");

    // log('user', user)

    let path = location.pathname;

    if (/\/$/.test(path)) {
      path += "/index.html";
    }

    const templateRegex = /^(.*)\.rendered\.html$/;

    // log("path", path);

    if (templateRegex.test(path)) {
      path = path.replace(templateRegex, "$1.template.html");
    }

    // log("path", path);

    var github = `//github.com/${user}/${user}.github.io/edit/master${path}`;

    // log("github", github);

    return github;
  })("stopsopa.github.io");

  log.green("defined", "window.github - link of edit page on github: " + github);

  document.body.hasAttribute("nogithublink") ||
    (function () {
      var div = document.createElement("div");

      div.classList.add("github-link");

      manipulation.append(document.body, div);

      var a = document.createElement("a");

      a.innerText = "edit";

      a.setAttribute("href", github);

      manipulation.append(div, a);

      var css = `
body .github-link {
    top: 0;
    right: 0;
    height: 47px;
    width: 47px;
    position: absolute;
    overflow: hidden;
}
body .github-link > a {
    border: 1px solid #2d2d2d;
    top: 7px;
    right: -18px;
    position: absolute;
    transform: rotate(45deg);
    padding-left: 20px;
    padding-right: 20px;
    color: white;
    text-decoration: none;
    background-color: #2d2d2d;
}
body .github-link > a:hover {
    cursor: pointer;
    color: #2d2d2d;
    background-color: white;
}
            `;
      // https://stackoverflow.com/a/524721
      var head = document.head || document.getElementsByTagName("head")[0],
        style = document.createElement("style");

      style.type = "text/css";
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      head.appendChild(style);

      log.blue("ribbon link", "adding edit ribbon link", "[triggered in github.js]");
    })();

  document.body.hasAttribute("noprofileribbon") ||
    (function () {
      var a = document.createElement("a");

      a.classList.add("github-profile");

      a.innerText = "profile";

      a.setAttribute("href", "//github.com/stopsopa?tab=repositories");

      manipulation.append(document.body, a);

      var css = `
body .github-profile {
    border: 1px solid #2d2d2d;
    top: 6px;
    left: -23px;
    position: absolute;
    transform: rotate(-38deg);
    padding-left: 20px;
    padding-right: 20px;
    color: white;
    text-decoration: none;
    background-color: #2d2d2d;
    font-size: 15px;
    padding-bottom: 2px;
    padding-top: 2px;
}
body .github-profile:hover {
    cursor: pointer;
    color: #2d2d2d;
    background-color: white;
}
            `;
      // https://stackoverflow.com/a/524721
      var head = document.head || document.getElementsByTagName("head")[0],
        style = document.createElement("style");

      style.type = "text/css";
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      head.appendChild(style);

      log.blue("DOMContentLoaded", "adding profile ribbon link", "[triggered in github.js]");
    })();

  if (window.isDevEnvironment) {
    // for some reason (maybe due to /etc/hosts record to handle local server from domain http://stopsopa.github.io.local/
    // there is huge delay in the locahost server request from the browser
    // The idea behind pinging it every few seconds is to maybe somehow keep local dns cache fresh
    setInterval(() => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/ping");
      xhr.send();
    }, 5000);
  }
})();

// ace editor
(function () {
  function unique(pattern) {
    // node.js require('crypto').randomBytes(16).toString('hex');
    pattern || (pattern = "xyxyxy");
    return pattern.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  var p,
    editors = {};

  window.doace = async function () {
    if (!p) {
      /**
       * Binding delegation event for copying to clipboard - should be registered once per page
       */
      p = new Promise(function (resolve) {
        (function run() {
          if (window._ && window.ace && window.ace.edit) {
            log.blue(
              "executed",
              "window.doace() inside - window.ace.edit found, binding body click for copy code from editor feature"
            );

            document.body.addEventListener("click", function (e) {
              var el = e.target;

              var match = el.matches("[data-lang] > .copy");

              if (match) {
                log.blue("executed", "clicked [data-lang] > .copy");

                var editor = editors[el.parentNode.dataset.ace];

                if (editor) {
                  log("found editor, let's copy");

                  var textarea = document.createElement("textarea");
                  manipulation.append(document.body, textarea);
                  textarea.value = editor.getValue();
                  textarea.select();
                  document.execCommand("copy");
                  textarea.value = "";
                  manipulation.remove(textarea);

                  (function () {
                    el.dataset.or = el.dataset.or || el.innerHTML;

                    el.innerHTML = "☑️";

                    setTimeout(function () {
                      el.innerHTML = el.dataset.or;
                    }, 1000);
                  })();
                }
              } else {
                // log.blue('executed', 'clicked something else than [data-lang] > .copy')
              }
            });

            resolve();
          } else {
            setTimeout(run, 100);
          }
        })();
      });

      await p;
    }

    (function () {
      var selector = "body script";

      const found = filterVisibleList(
        Array.from(document.querySelectorAll(selector)).filter((e) =>
          ["editor", "syntax"].includes(e.getAttribute("type"))
        )
      );

      const allowed = ["editor", "syntax"];

      const list = [];

      found.forEach((e) => {
        const type = e.getAttribute("type");

        const lang = e.getAttribute("data-lang");

        if (typeof lang === "string" && trim(lang)) {
          if (typeof type !== "string" || !trim(type)) {
            list.push('[data-lang]="' + lang + '" defined but [type] is missing');

            return;
          }
        } else {
          if (typeof type === "string") {
            if (type !== "text/javascript") {
              list.push("[data-lang] not defined so [type] can be only 'text/javascript' but it is: >>" + type + "<<");

              return;
            }
          }
        }
      });
    })();

    var selector = '[type="editor"]:not(.handled), [type="syntax"]:not(.handled)';

    const found = filterVisibleList(Array.from(document.querySelectorAll(selector)));

    log.blue("executed", "window.doace() inside - handling " + selector + " - adding " + found.length + " editors");

    const onLoadPromiseArray = [];

    found.forEach(function (el) {
      if (el.classList.contains("handled")) {
        log('[type="editor"], [type="syntax"] already handled');

        return true;
      }

      var script,
        editor,
        div,
        t = "",
        d;

      /**
       * Lets simplify syntax
       * from
       *
       *  <div class="editor">
       *      <script type="editor" data-lang="js" data-w="95%">
       *      </script>
       *  </div>
       *    // this is actually processed structure
       *
       *  to
       *
       *  <script class="editor" type="editor" data-lang="js" data-w="95%"></script>
       *      // this is for user convenience
       *
       *  and then execute old logic
       */
      (function () {
        div = document.createElement("div");

        manipulation.after(el, div);

        manipulation.custommove(div, el);

        var attr = Array.prototype.slice.call(el.attributes);

        for (var i = 0, l = attr.length; i < l; i += 1) {
          if (attr[i].name.toLowerCase() === "class") {
            continue;
          }

          div.setAttribute(attr[i].name, attr[i].value);
        }

        el.classList.add("handled");

        el = div;

        el.classList.add("handled");
      })();

      script = el.querySelector("script");

      d = el.dataset.h;
      d && (el.style.height = d);
      d = el.dataset.w;
      d && (el.style.width = d);

      if (!script) {
        log("ace - no script child found");

        return true;
      }

      t = script.innerHTML;

      /**
       * removing redundant spaces at the beginning - mitigating prettier
       */
      (function (v) {
        let diff = 1111;

        let tmp = v.split("\n");

        tmp.forEach((line) => {
          if (!/^\s*$/.test(line)) {
            // if line isn't just white characters
            const length_before = line.length;

            const length_after = line.replace(/^\s+/, "").length;

            const d = length_before - length_after;

            if (d < diff) {
              diff = d;
            }
          }
        });

        if (diff !== 1111 && diff > 0) {
          tmp = tmp.map((line) => line.substring(diff));

          t = tmp.join("\n");

          if (tmp[tmp.length - 2].trim() !== "") {
            t += "\n";
          }
        }
      })(t);

      manipulation.remove(script);

      div = el.cloneNode(false);

      div.removeAttribute("data-lang");
      div.removeAttribute("data-w");
      div.removeAttribute("data-h");

      manipulation.append(el, div);

      div.classList.remove("editor");
      div.classList.remove("syntax");

      var clear = document.createElement("div");

      clear.style.clear = "both";

      manipulation.append(el, clear);

      // manipulation.after(el, clear.cloneNode(false))

      editor = ace.edit(div);

      let resolve;
      const onLoadPromise = new Promise((res) => (resolve = res));

      onLoadPromiseArray.push({
        onLoadPromise,
        resolve,
      });

      var un = unique();

      const event = debounceOnce(() => {
        let text = "";

        (function () {
          try {
            let head = div.parentNode.previousSibling;

            while (head.nodeType === 3) {
              head = head.previousSibling;
            }

            if ("h1 h2 h3 h4 h5 h6".split(" ").includes(head.tagName.toLowerCase())) {
              text = head.innerText;
            }
          } catch (e) {
            /* I don't care if something crush here */
          }
        })();

        log.blue("ace editor loaded", un, ">>>>", text);

        resolve(un);
      }, 50);

      editor.renderer.on("afterRender", event); // https://github.com/ajaxorg/ace/issues/2082#issuecomment-1085230125

      editors[un] = editor;

      el.dataset.ace = un;

      var copy = document.createElement("div");
      copy.classList.add("copy");
      copy.innerHTML = "📋";

      manipulation.prepend(el, copy);

      editor.getSession().setTabSize(4);
      editor.setTheme("ace/theme/idle_fingers");
      editor.getSession().setUseWrapMode(true);

      d = el.dataset.lang;
      d == "js" && (d = "javascript");
      d == "ts" && (d = "typescript");
      d && editor.getSession().setMode("ace/mode/" + d);

      el.classList.contains("syntax") && editor.setReadOnly(true); // false to make it editable
      //        editor.getSession().setMode("ace/mode/javascript");
      editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, "$1"));
      // editor.setValue(t);
      editor.clearSelection();

      // editor.setOptions({
      //   // maxLines: Infinity
      // });

      {
        // relays on loading extension ext-linking.js
        // https://github.com/ajaxorg/ace/issues/2453#issuecomment-98609590

        const findWordAtPosition = (function () {
          function findLast(arr, find) {
            for (let i = arr.length - 1; i > -1; i -= 1) {
              if (find(arr[i])) {
                return arr[i];
              }
            }
          }

          return function (txt, pos) {
            let parts = [];
            txt.replace(/([^\s\t]+)/g, (_, match, match_position) => {
              parts.push({
                match,
                match_position,
              });
            });

            const found = findLast(parts, (row) => {
              return row.match_position <= pos;
            });

            if (found) {
              return found.match;
            }
          };
        })();

        editor.setOptions({
          enableLinking: true,
        });

        editor.on("linkClick", function (data) {
          const clickedText = findWordAtPosition(
            editor.getValue().split("\n")[data.position.row],
            data.position.column
          );

          if (typeof clickedText === "string" && clickedText.trim() && /^https?:\/\//.test(clickedText)) {
            log(`opening >${clickedText}<`);
            window.open(clickedText, "_blank").focus();
          } else {
            log(`not a link: >${clickedText}<`);
          }
        });
      }

      var heightUpdateFunction = function () {
        // http://stackoverflow.com/questions/11584061/
        var newHeight =
          editor.getSession().getScreenLength() * editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();

        // log('new height', newHeight);

        var h = newHeight.toString();

        // h += 1000;

        h += "px";

        div.style.height = h;

        // Array.prototype.slice.call(document.querySelector('.editor').querySelectorAll('[class]'))
        //     .map(e => e.style.height = h)
        // ;
        // $('#editor').height(newHeight.toString() + "px");
        // $('#editor-section').height(newHeight.toString() + "px");

        // This call is required for the editor to fix all of
        // its inner structure for adapting to a change in size
        editor.resize();
      };

      // Set initial size to match initial content
      heightUpdateFunction();

      // Whenever a change happens inside the ACE editor, update
      // the size again
      editor.getSession().on("change", heightUpdateFunction);
    });

    await Promise.all(onLoadPromiseArray.map((x) => x.onLoadPromise));

    log.blue("ALL ACE EDITORS LOADED -> onLoad event");
  };

  log.green("defined", "window.doace()");
})();

(function () {
  window.doEval = function () {
    Array.from(document.querySelectorAll("[data-eval]")).forEach(function (tag) {
      const parent = tag.parentNode;

      tag.removeAttribute("data-eval");

      var text = tag.innerHTML;

      console.log("doEval, tag:", tag, "parent: ", parent, text);

      createScript(text, parent);
    });
  };
})();

(function () {
  function slug(str) {
    return trim(
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/--+/g, "-"),
      "-"
    );
  }

  function unique(list, str) {
    if (isObject(list)) {
      list = Object.keys(list);
    }

    str = slug(str);

    var i = 0,
      tmp;

    do {
      tmp = str || "";

      if (i > 0) {
        if (tmp) {
          tmp += "-";
        }

        tmp += i;
      }

      i += 1;
    } while (!tmp || list.indexOf(tmp) > -1);

    return tmp;
  }

  window.addAnchorLinks = function () {
    var links = {};

    const selectors = "h1, h2, h3, h4, h5, h6";

    selectors.split(",").forEach(function (selector) {
      document.querySelectorAll(trim(selector)).forEach(function (el) {
        const newId = unique(links, el.innerText);

        links[newId] = el;

        if (!el.hasAttribute("id") || !trim(el.getAttribute())) {
          el.setAttribute("id", newId);
        }
      });
    });

    const anchors = new window.AnchorJS();
    anchors.options = {
      visible: "always",
      placement: "left",
    };
    anchors.add(selectors).remove('[id="index"]').remove('[id="table-of-contents"]');

    document.body.addEventListener("click", function (e) {
      var el = e.target;

      var match = el.matches("a.anchorjs-link[href]");

      if (match) {
        const url = location.href.split("#")[0] + el.getAttribute("href");

        console.log("copying to clipboard: ", url);

        // // this doesn't seem to be working
        // // Copy the URL to the clipboard
        // navigator.clipboard
        //   .writeText(url)
        //   .then(() => {
        //     console.log(`Copied link to clipboard: ${url}`);
        //   })
        //   .catch((err) => {
        //     console.error("Could not copy link to clipboard", err);
        //   });

        var textarea = document.createElement("textarea");
        manipulation.append(document.body, textarea);
        textarea.value = url;
        textarea.select();
        document.execCommand("copy");
        textarea.value = "";
        manipulation.remove(textarea);
      }
    });

    return;

    // Add event listener to headers
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((header) => {
      header.addEventListener("click", (event) => {
        // Get the URL of the header
        const url = event.target.id ? `${window.location.href.split("#")[0]}#${event.target.id}` : window.location.href;

        // Copy the URL to the clipboard
        navigator.clipboard
          .writeText(url)
          .then(() => {
            console.log(`Copied link to clipboard: ${url}`);
          })
          .catch((err) => {
            console.error("Could not copy link to clipboard", err);
          });
      });
    });
  };
})();

(async function () {
  async function loadJs(name, url, test) {
    return new Promise((resolve, reject) => {
      if (typeof test !== "function") {
        throw new Error("loadJs error: test should be a function for " + name + " async loader");
      }

      if (typeof url !== "string") {
        throw new Error("loadJs error: url should be a string for " + name + " async loader");
      }

      // https://stackoverflow.com/a/524721
      var head = document.head || document.getElementsByTagName("head")[0],
        script = document.createElement("script");

      var handler = setInterval(function () {
        if (test()) {
          clearInterval(handler);

          log.yellow("loadJs", `${name} loaded`);

          resolve();
        }
      }, 100);

      script.setAttribute("src", url);

      head.appendChild(script);
    });
  }

  try {
    await loadJs("polyfill", "/noprettier/polyfill.js", function () {
      try {
        return window.sasync.loaded.polyfill_js;
      } catch (e) {
        return false;
      }
    });

    await Promise.all([
      loadJs("preprocessed.js", "/public/preprocessed.js", function () {
        try {
          return typeof window.env === "function";
        } catch (e) {
          return false;
        }
      }),
      loadJs("vanilla-tabs.js", "/noprettier/vanilla-tabs.js", function () {
        try {
          return typeof window.vanillaTabs === "object";
        } catch (e) {
          return false;
        }
      }),
      // loadJs("permalink", "/noprettier/permalink-my.js", function () {
      //   try {
      //     return typeof window.sasync.loaded.mountpermalink === "function";
      //   } catch (e) {
      //     return false;
      //   }
      // }),
      loadJs("AnchorJS", "/noprettier/anchor.min.js", function () {
        try {
          return typeof window.AnchorJS == "function";
        } catch (e) {
          return false;
        }
      }),
      loadJs("lodash", "/noprettier/lodash-4.17.10.js", function () {
        try {
          return typeof _.VERSION === "string";
        } catch (e) {}
        return false;
      }),
      loadJs("ace", "/noprettier/ace/ace-builds-1.5.0/src-min-noconflict/ace.js", function () {
        // how to use: https://ace.c9.io/#nav=howto
        try {
          return typeof window.ace.edit === "function";
        } catch (e) {}
        return false;
      }),
    ]);

    await loadJs(
      "ace extension ext-linking",
      "/noprettier/ace/ace-builds-1.5.0/src-min-noconflict/ext-linking.js",
      function () {
        try {
          return true;
          return window.sasync.loaded.polyfill_js;
        } catch (e) {
          return false;
        }
      }
    );

    if (!/^https?:\/\//.test(env("GITHUB_SOURCES_PREFIX"))) {
      throw new Error(`GITHUB_SOURCES_PREFIX env var is not defined or invalid`);
    }

    log.blue("Promise.all loadJs loaded");

    await window.buildHeader();

    await window.buildFooter();

    // await window.sasync.loaded.mountpermalink();

    await window.addAnchorLinks();

    await toc();

    await doSort();

    await urlwizzard();

    if (typeof window.beforeAceEventPromise === "function") {
      log.blue("executed", "window.doace() waiting for window.beforeAceEventPromise() found");

      await window.beforeAceEventPromise();
    } else {
      log.blue("executed", "window.doace() waiting for window.beforeAceEventPromise() NOT found");
    }

    const unbind = vanillaTabs.bind();
    vanillaTabs.active({
      onChange: async (e) => {
        console.log("vanillaTabs.active(onChange)", e);
        window.doEval();

        await window.doace();
      },
    });

    window.doEval();

    await window.doace();

    await window.scrollToHashAndHighlight();

    window.githubJsReady = true;

    if (Array.isArray(window.allLoaded)) {
      const preexisting = window.allLoaded;
      window.allLoaded = {
        push: function (trigger) {
          console.log("Internal: run my function");
          trigger();
        },
      };
      preexisting.forEach(function (trigger) {
        window.allLoaded.push(trigger);
      });
    }

    log.blue(
      "DOMContentLoaded",
      "window.doace [triggered in github.js] -> window.githubJsReady = true defined (see snippet how to handle it next to this log)"
    );

    // (async function () {
    //   await new Promise((resolve) => {
    //     (function repeat() {
    //       if (window.githubJsReady) {
    //         resolve();
    //       } else {
    //         setTimeout(repeat, 50);
    //       }
    //     })();
    //   });

    //   log("do yours stuff");
    // })();
  } catch (e) {
    log.red(
      "GLOBAL CATCH ERROR: ",
      JSON.stringify(
        {
          message: e.message,
          stack: e.stack.split("\n"),
        },
        null,
        4
      )
    );
  }
})();

log.gray("finished loading", "github.js");

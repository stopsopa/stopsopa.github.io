import unique from "./unique.js";

import log from "./log.js";

import { debounceOnce } from "./debounce.js";

import manipulation from "./manipulation.js";

import { filterVisibleList } from "./isVisibleElement.js";

import { mobileLinkElement } from "./mobileLinks.js";

import trim from "./trim.js";

// ace editor

var p,
  editors = {};

export default async function doace() {
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

    const allowed = ["editor", "syntax"];

    const found = filterVisibleList(
      Array.from(document.querySelectorAll(selector)).filter((e) => allowed.includes(e.getAttribute("type")))
    );

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

      editor.on("click", function (e) {
        const cursor = editor.getCursorPosition();
        const session = editor.getSession();
        const line = session.getLine(cursor.row); // text from line

        // Get the div element representing the line
        const lineElement = editor.renderer.$cursorLayer.element.parentNode.querySelectorAll(".ace_line")[cursor.row];

        mobileLinkElement(lineElement, line, "ace");
      });

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

    editor.getSession().setUseWorker(false); // disable loading worker-javascript.js https://stackoverflow.com/a/13016089
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
        const clickedText = findWordAtPosition(editor.getValue().split("\n")[data.position.row], data.position.column);

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
}

log.green("defined", "window.doace()");

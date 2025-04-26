import React, { useState, useEffect, useRef, useMemo } from "react";

import isObject from "nlab/isObject.js";

import waitForAce from "./lib/waitForAce.js";

import RecordLog from "./RecordLog.js";

import "./Ace.css";

// https://github.com/ajaxorg/ace/blob/v1.15.3/src/ext/modelist.js#L44
export const languages = [
  "javascript",
  "python",
  "typescript",
  "json",
  "json5",
  "yaml",
  "less",
  "scss",
  "lua",
  "rust",
  "markdown",
  "sql",
  "mysql",
  "sqlserver",
  "xml",
  "html",
  "svg",
  "java",
  "sh",
  "csharp",
  "css",
  "dockerfile",
  "golang",
  "groovy",
  "php",
];

languages.sort();

export const bringFocus = (tab, label) => {
  const found = Object.keys(window.editors || {}).find((t) => t === tab);

  if (found) {
    try {
      // console.log(`bring focus [tab >${tab}< ${label}]: `, window.editors[tab].editor);
      window.editors[tab].editor.focus();
    } catch (e) {
      console.log(`bring focus [tab >${tab}< ${label}] error: `, e);
    }
  } else {
    console.error(`bring focus [tab >${tab}< ${label}]: not found tab`);
  }
};

export const pokeEditorsToRerenderBecauseSometimesTheyStuck = (fn) => {
  window.requestAnimationFrame(() => {
    if (isObject(window.editors)) {
      Object.keys(window.editors).forEach((key) => {
        // console.log(`pokeEditorsToRerenderBecauseSometimesTheyStuck process >${key}<`);
        try {
          window.editors[key].editor.resize();
        } catch (e) {
          console.log(`pokeEditorsToRerenderBecauseSometimesTheyStuck key >${key}< error: `, e);
        }
      });
    } else {
      console.log(`pokeEditorsToRerenderBecauseSometimesTheyStuck else`);
    }
    typeof fn === "function" && fn();
  });
};

/**
 * Minimal number of params is:
 *     <Ace id="ace" content={value || ""} lang="javascript" wrap={false} />
 */
export default ({ id, content, onChange, onInit, recordOn, lang, wrap, passRefToParent }) => {
  // onChange = debounce(onChange, 5000);

  const refIdMemo = useMemo(() => {
    const id_ = "react-ace-" + id;

    let resolve;

    const promise = new Promise((res) => (resolve = res));

    return {
      id: id_,
      log: function (...args) {
        try {
          console.log(id_, ...args);
        } catch (e) {
          console.log("log error: ", e);
        }
      },
      editor: undefined,
      promise,
      resolve,
    };
  }, []);

  const refId = useRef(refIdMemo);

  const log = refId.current.log;

  // log("=============render", `>${content.substring(0, 100)}...<`, typeof content, content.length);

  const divRef = useRef(null);

  // useEffect(() => {
  //   if (typeof refId.current.heightUpdateFunction === "function") {
  //     refId.current.heightUpdateFunction();
  //   }
  // });

  useEffect(() => {
    refId.current.content = content;
    // log("=============refId.current.content = content", `>${content.substring(0, 100)}...<`, typeof content, content.length);
    refId.current.promise.then((editor) => {
      // if (refId?.current?.content) {
      //   log("=============then", `>${refId.current.content.substring(0, 100)}...<`, typeof refId.current.content, refId.current.content.length);
      // }
      if (typeof refId.current.content !== "string") {
        return;
      }

      if (!refId.current.update) {
        return log("skip update flag true");
      }

      const edContent = editor.getValue();
      // log("=============edContent", `>${edContent.substring(0, 100)}...<`, `>${refId.current.content.substring(0, 100)}...<`, typeof refId.current.content, refId.current.content.length);

      if (edContent !== refId.current.content) {
        editor.setValue(refId.current.content + "", -1);

        delete refId.current.content;
      }
    });
  }, [refId, content]);

  useEffect(() => {
    refId.current.lang = lang;
    refId.current.promise.then((editor) => {
      if (typeof refId.current.lang !== "string") {
        return;
      }

      const session = editor.getSession();

      session.setUseWorker(false); // disable loading worker-javascript.js https://stackoverflow.com/a/13016089

      session.setMode(`ace/mode/${refId.current.lang}`);

      delete refId.current.lang;
    });
  }, [refId, lang]);

  useEffect(() => {
    if (typeof passRefToParent === "function") {
      passRefToParent(refId);
    }

    refId.current.wrap = wrap;
    refId.current.promise.then((editor) => {
      if (typeof refId.current.wrap !== "boolean") {
        return;
      }

      const session = editor.getSession();

      session.setUseWorker(false); // disable loading worker-javascript.js https://stackoverflow.com/a/13016089

      session.setUseWrapMode(refId.current.wrap);

      delete refId.current.wrap;
    });
  }, [refId, wrap]);

  useEffect(() => {
    (async function () {
      const div = divRef.current;

      divRef.current.setAttribute("data-record", "0");

      await waitForAce();

      if (!window.editors) {
        window.editors = {};
      }

      divRef.current.parentNode.classList.add("mounting");

      const editor = ace.edit(div);

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

      if (typeof onInit === "function") {
        onInit(editor);
      }

      refId.current.resolve(editor);

      const session = editor.getSession();

      session.setOptions({ tabSize: 4, useSoftTabs: true });

      editor.setTheme("ace/theme/idle_fingers");

      session.setUseWrapMode(true);

      editor.setShowInvisibles(true);

      if (typeof content === "string") {
        const tmp = refId?.current?.content || content;
        // log("=============init set", `>${tmp.substring(0, 100)}...<`, typeof tmp, tmp.length);
        editor.setValue(tmp);
        delete refId?.current?.content;
      }

      editor.clearSelection();

      let heightUpdateFunction = function (val) {
        // log("heightUpdateFunction");

        // http://stackoverflow.com/questions/11584061/
        let newHeight = session.getScreenLength() * editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();

        let height = Number.isInteger(val) ? val : newHeight.toString();

        // 46 rows in ace editor in 735px of window.innerHeight:
        // so: 735 / 46 = 15.97 - pixels per row
        // header takes 6 ace editor rows height so we will have to subctract always this
        //   6 * 15.97 = 95.82px
        const pixelsPerAceEditorLine = 15.97;

        const reserveLinesForHeaders = 10;

        const reservedHeightPixelsForHeaders = reserveLinesForHeaders * pixelsPerAceEditorLine;

        let minHeight = parseInt(window.innerHeight - reservedHeightPixelsForHeaders, 10);

        const finalHeight = minHeight > height ? minHeight : height;
        // const finalHeight = height;

        div.style.height = finalHeight + "px";

        editor.resize();
      };

      heightUpdateFunction();

      refId.current.heightUpdateFunction = heightUpdateFunction;

      divRef.current.parentNode.classList.remove("mounting");

      session.on("change", () => {
        if (typeof onChange === "function") {
          onChange(session.getValue());
        }
      });

      refId.current.update = true;

      editor.on("focus", function () {
        // log("focus");
        refId.current.focus = true;
        refId.current.update = false;
        RecordLog.setFocusedEditor(editor);
      });

      editor.on("blur", function () {
        // log("blur");
        refId.current.focus = false;
        refId.current.update = true;
      });

      // https://ajaxorg.github.io/ace-api-docs/classes/Ace.Editor.html#on
      // 'input change changeSelectionStyle changeSession copy paste mousewheel click'.split(' ').forEach(name => editor.on(name, function () {
      //   log(`event ${name}`);
      // }))

      window.editors[id] = {
        onChange,
        editor,
      };

      refId.current.editor = editor;

      window.addEventListener("resize", refId.current.heightUpdateFunction);

      document.addEventListener("scroll", refId.current.heightUpdateFunction);
    })();

    return () => {
      if (refId.current.editor) {
        refId.current.editor.destroy();

        refId.current.editor = undefined;
      } else {
        console.log("useFetch unmount: editor doesn't exist: editor.destroy()");
      }

      try {
        div.removeAttribute("class");

        div.removeAttribute("style");
      } catch (e) {
        console.error("Ace.jsx error removing class: ", e);
      }

      window.removeEventListener("resize", refId.current.heightUpdateFunction);

      document.removeEventListener("scroll", refId.current.heightUpdateFunction);

      onInit(undefined);

      delete window.editors[id];
    };
  }, []);

  function onAfterExec(e) {
    // RecordLog.add(refId.current.editor.getCursorPosition(), e);
    RecordLog.add(e);
  }

  function onFindType(e) {
    let el = e.target;

    let match = el.matches(".ace_search_field");

    if (match) {
      try {
        RecordLog.add({
          command: { name: "_delegation_typefind" },
          args: (function (a) {
            return {
              needle: el.value,
              wrap: a.wrap,
              caseSensitive: a.caseSensitive || false,
              wholeWord: a.wholeWord || false,
              regExp: a.regExp || false,
            };
          })(refId.current.editor.$search.$options),
        });
      } catch (e) {
        log("registering _delegation_typefind error: ", e);
      }
    }
  }

  function turnRecordOn() {
    RecordLog.reset();

    refId.current.editor.commands.on("afterExec", onAfterExec);

    divRef.current.addEventListener("input", onFindType);

    divRef.current.setAttribute("data-record", "1");
  }

  function turnRecordOff() {
    try {
      refId.current.editor.commands.off("afterExec", onAfterExec);

      divRef.current.removeEventListener("input", onFindType);

      divRef.current.setAttribute("data-record", "0");
    } catch (e) {
      console.error("turnRecordOff error: ", e);
    }
  }

  useEffect(() => {
    if (typeof recordOn === "boolean" && refId.current.editor) {
      if (recordOn === true) {
        turnRecordOn();
      }
      if (recordOn === false) {
        turnRecordOff();
      }
    }

    return () => {
      turnRecordOff();
    };
  }, [refId, recordOn]);

  return <div ref={divRef} id={id} />;
};

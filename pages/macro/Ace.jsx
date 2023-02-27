import React, { useState, useEffect, useRef, useMemo } from "react";

import waitForAce from "./lib/waitForAce";

import RecordLog from "./RecordLog";

// import "./Ace.css";

export default ({ id, content, onChange, recordOn }) => {
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

  const divRef = useRef(null);

  useEffect(() => {
    if (typeof refId.current.heightUpdateFunction === "function") {
      refId.current.heightUpdateFunction();
    }
  });

  useEffect(() => {
    refId.current.content = content;
    refId.current.promise.then((editor) => {
      if (typeof refId.current.content !== "string") {
        return;
      }

      if (!refId.current.update) {
        return log("skip update flag true");
      }

      const edContent = editor.getValue();
      if (edContent !== refId.current.content) {
        editor.setValue(refId.current.content + "", -1);

        delete refId.current.content;
      }
    });
  }, [refId, content]);

  useEffect(() => {
    (async function () {
      const div = divRef.current;

      div.innerText = "Loading...";

      divRef.current.setAttribute("data-record", "0");

      await waitForAce();

      if (!window.editors) {
        window.editors = {};
      }

      divRef.current.parentNode.classList.add("mounting");

      const editor = ace.edit(div);

      refId.current.resolve(editor);

      const session = editor.getSession();

      session.setOptions({ tabSize: 4, useSoftTabs: true, maxLines: Infinity });

      editor.setTheme("ace/theme/idle_fingers");

      session.setUseWrapMode(true);

      editor.setShowInvisibles(true);

      let lang = "javascript";
      session.setMode("ace/mode/" + lang);

      if (typeof content === "string") {
        editor.setValue(content);
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
        log("focus");
        refId.current.update = false;
        RecordLog.focusedEditor(editor);
      });

      editor.on("blur", function () {
        log("blur");
        refId.current.update = true;
      });

      window.editors[id] = onChange;

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

      div.removeAttribute("class");

      div.removeAttribute("style");

      window.removeEventListener("resize", refId.current.heightUpdateFunction);

      document.removeEventListener("scroll", refId.current.heightUpdateFunction);
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

    Array.from(divRef.current.querySelectorAll(".ace_editor")).forEach((el) => {
      el.addEventListener("input", onFindType);
    });

    divRef.current.setAttribute("data-record", "1");
  }

  function turnRecordOff() {
    refId.current.editor.commands.off("afterExec", onAfterExec);

    Array.from(divRef.current.querySelectorAll(".ace_editor")).forEach((el) => {
      el.removeEventListener("input", onFindType);
    });

    divRef.current.setAttribute("data-record", "0");
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

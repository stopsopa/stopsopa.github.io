import React, { useState, useEffect, useRef } from "react";

import nanoid from "../../libs/nanoid";

import waitForAce from "./lib/waitForAce";

import RecordLog from "./RecordLog";

// import "./Ace.css";

export default ({ content, onChange, recordOn }) => {
  const refId = useRef(
    (function (id) {
      return {
        id,
        log: function (...args) {
          try {
            console.log(id, ...args);
          } catch (e) {
            console.log("log error: ", e);
          }
        },
        editor: undefined,
      };
    })("react-ace-" + nanoid(10))
  );

  const log = refId.current.log;

  window.debug || log("Ace render");

  const divRef = useRef(null);

  useEffect(() => {
    const div = divRef.current;

    div.innerText = "Loading...";
    divRef.current.setAttribute("data-record", "0");

    (async function () {
      window.debug || log(`---seq []`);
      /**
       * I just need to wait for ace here, because it will be loaded by github.js
       */
      await waitForAce();

      refId.current.editor = mountEditor(div, {
        log,
        refId,
        content,
        onChange,
      });

      if (!window.editors) {
        window.editors = {};
      }

      window.editors[refId.current.id] = refId.current.editor;

      // this is here for testing mount and unmount
      //   let mount = false;
      //   let i = 0;
      //   document.body.addEventListener("click", () => {
      //     mount = !mount;
      //     if (mount) {
      //       if (refId.current.editor) {
      //         console.log("body click: editor exist: editor.destroy()");
      //         refId.current.editor.destroy();
      //         refId.current.editor = undefined;
      //         div.removeAttribute("class");
      //         div.removeAttribute("style");
      //       } else {
      //         console.log("body click: editor doesn't exist: editor.destroy()");
      //       }
      //     } else {
      //       i += 1;
      //       console.log("body click: mount editor");
      //       refId.current.editor = mountEditor(div, {
      //         content: `
      //         if (attr[i].name.toLowerCase() === "class") {
      //             continue;
      //         }    second ${i}
      //         `,
      //       });
      //     }
      //   });
    })();

    return () => {
      if (refId.current.editor) {
        console.log("useFetch unmount: editor exist: editor.destroy()");
        refId.current.editor.destroy();
        refId.current.editor = undefined;
        div.removeAttribute("class");
        div.removeAttribute("style");
      } else {
        console.log("useFetch unmount: editor doesn't exist: editor.destroy()");
      }
    };
  }, []);

  useEffect(() => {
    window.debug || log(`---seq [content]`);
    if (typeof content === "string" && refId.current.editor && refId.current.editor.getValue() !== content && refId.current.update) {
      console.log("useEffect update", refId.current.editor.getValue() === content);
      refId.current.editor.setValue(content);
    }
  }, [refId, content]);

  function onAfterExec(e) {
    // RecordLog.add(refId.current.editor.getCursorPosition(), e);
    RecordLog.add(e);
  }
  function onFindType(e) {
    var el = e.target;

    var match = el.matches(".ace_search_field");

    if (match) {
      try {
        RecordLog.add({
          command: { name: "_delegation_typefind" },
          args: (function (a) {
            // ed().execCommand("find", {
            //   needle: "zz",
            //   wrap: true,
            //   caseSensitive: false,
            //   wholeWord: false,
            //   regExp: false,
            // });

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

    Array.from(document.querySelectorAll(".ace_editor")).forEach((el) => {
      el.addEventListener("input", onFindType);
    });

    divRef.current.setAttribute("data-record", "1");
  }

  function turnRecordOff() {
    refId.current.editor.commands.off("afterExec", onAfterExec);

    Array.from(document.querySelectorAll(".ace_editor")).forEach((el) => {
      el.removeEventListener("input", onFindType);
    });

    divRef.current.setAttribute("data-record", "0");
  }

  useEffect(() => {
    window.debug || log(`---seq [recordOn]`, recordOn);
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

  return <div ref={divRef} id={refId.current.id} />;
};

function mountEditor(div, { log, refId, content, onChange }) {
  refId.current.update = true;

  const editor = ace.edit(div);

  const session = editor.getSession();

  //   editors[un] = editor;

  session.setTabSize(4);
  editor.setTheme("ace/theme/idle_fingers");
  session.setUseWrapMode(true);

  let lang = "javascript";
  session.setMode("ace/mode/" + lang);
  //   editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, "$1"));

  if (refId.current.update) {
    window.debug || log("update on");
    if (typeof content === "string") {
      editor.setValue(content);
    }
  } else {
    window.debug || log("update off");
  }
  editor.clearSelection();

  var heightUpdateFunction = function () {
    // http://stackoverflow.com/questions/11584061/
    var newHeight = session.getScreenLength() * editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();

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
  session.on("change", () => {
    heightUpdateFunction();
    if (typeof onChange === "function") {
      onChange(session.getValue());
    }
  });

  editor.on("focus", function () {
    window.debug || log("focus");
    refId.current.update = false;
    RecordLog.focusedEditor(editor);
  });

  editor.on("blur", function () {
    window.debug || log("blur");
    refId.current.update = true;
  });

  return editor;
}

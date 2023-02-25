import React, { useState, useEffect, useRef } from "react";

import waitForAce from "./lib/waitForAce";

import RecordLog from "./RecordLog";

// import "./Ace.css";

// let i = 0;

export default ({ id, content, onChange, recordOn }) => {
  const refId = useRef(
    (function (id) {
      let resolve;
      const promise = new Promise((res) => (resolve = res));
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
        promise,
        resolve,
      };
    })("react-ace-" + id)
  );

  const log = refId.current.log;

  // window.debug || log(`Ace render--------------${id}------------${content}-----<<<<`);

  const divRef = useRef(null);

  useEffect(() => {
    if (typeof refId.current.heightUpdateFunction === "function") {
      refId.current.heightUpdateFunction();
    }
  });

  useEffect(() => {
    const div = divRef.current;

    div.innerText = "Loading...";
    divRef.current.setAttribute("data-record", "0");

    (async function () {
      // window.debug || log(`---seq []`);
      /**
       * I just need to wait for ace here, because it will be loaded by github.js
       */
      await waitForAce();

      refId.current.editor = mountEditor(div, {
        log,
        refId,
        divRef,
        content,
        onChange,
        id,
      });

      if (!window.editors) {
        window.editors = {};
      }

      window.editors[id] = onChange;

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
        // console.log("useFetch unmount: editor exist: editor.destroy()");
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
    // i += 1;
    // window.debug || log(`useEffect refId content>${content}<`);
    refId.current.promise.then((editor) => {
      if (!refId.current.update) {
        return log("skip update flag true");
      }
      const edContent = editor.getValue();
      if (edContent !== content) {
        // log(`useEffect update ace>${edContent}< ref>${content}<`);

        // if (i > 10) {
        //   return log("stop...");
        // }
        editor.setValue(content + "", -1);
        // refId.current.content = content
      }
    });
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
    // window.debug || log(`---seq [recordOn]`, recordOn);

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

function mountEditor(div, { log, divRef, refId, content, onChange, id }) {
  refId.current.update = true;

  divRef.current.parentNode.classList.add("mounting");

  const editor = ace.edit(div);

  refId.current.resolve(editor);

  const session = editor.getSession();

  //   editors[un] = editor;

  session.setOptions({ tabSize: 4, useSoftTabs: true });
  // session.setTabSize(4);
  editor.setTheme("ace/theme/idle_fingers");
  session.setUseWrapMode(true);

  editor.setShowInvisibles(true);

  let lang = "javascript";
  session.setMode("ace/mode/" + lang);
  //   editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, "$1"));

  if (refId.current.update) {
    // window.debug || log("update on", content);
    if (typeof content === "string") {
      editor.setValue(content);
    }
  } else {
    // window.debug || log("update off");
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
    editor.focus();
  };

  // Set initial size to match initial content
  heightUpdateFunction();

  refId.current.heightUpdateFunction = heightUpdateFunction;

  // setTimeout(() => {
  divRef.current.parentNode.classList.remove("mounting");

  heightUpdateFunction();
  // }, 50);

  // Whenever a change happens inside the ACE editor, update
  // the size again
  session.on("change", () => {
    heightUpdateFunction();
    if (typeof onChange === "function") {
      log(`onChange >${session.getValue()}<`);
      onChange(session.getValue());
    }
  });

  editor.on("focus", function () {
    // window.debug || log("focus");
    refId.current.update = false;
    RecordLog.focusedEditor(editor);
  });

  editor.on("blur", function () {
    // window.debug || log("blur");
    refId.current.update = true;
  });

  return editor;
}

import React, { useState, useEffect, useRef } from "react";

import nanoid from "../../libs/nanoid";

import waitForAce from "./lib/waitForAce";

export default ({ content, onChange }) => {
  console.log("render................");

  const refId = useRef({
    id: "react-ace-" + nanoid(10),
    editor: undefined,
  });

  const ref = useRef(null);

  useEffect(() => {
    const div = ref.current;

    div.innerText = "Loading...";

    (async function () {
      /**
       * I just need to wait for ace here, because it will be loaded by github.js
       */
      await waitForAce();

      refId.current.editor = mountEditor(div, {
        content,
        onChange,
      });

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
    if (typeof content === "string" && refId.current.editor && refId.current.editor.getValue() !== content) {
      console.log("useEffect update", refId.current.editor.getValue() === content);
      refId.current.editor.setValue(content);
    }
  }, [content]);

  return <div ref={ref} id={refId.current.id} />;
};

function mountEditor(div, { content, onChange }) {
  const editor = ace.edit(div);

  editor.renderer.on("afterRender", () => {
    console.log("afterRender");
  });

  const session = editor.getSession();

  //   editors[un] = editor;

  session.setTabSize(4);
  editor.setTheme("ace/theme/idle_fingers");
  session.setUseWrapMode(true);

  let lang = "javascript";
  session.setMode("ace/mode/" + lang);
  //   editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, "$1"));
  typeof content === "string" && editor.setValue(content);
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

  return editor;
}

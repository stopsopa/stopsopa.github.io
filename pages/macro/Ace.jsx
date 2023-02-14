import React, { useState, useEffect, useRef } from "react";

import nanoid from "../../libs/nanoid";

import waitForAce from "./lib/waitForAce";

export default () => {
  console.log("render................");

  const refId = useRef(nanoid(10));

  const ref = useRef(null);

  const id = refId.current;

  useEffect(() => {
    const div = ref.current;

    div.innerText = "Loading...";

    let editor;

    const data = `
if (attr[i].name.toLowerCase() === "class") {
    continue;
}    
`;

    (async function () {
      /**
       * I just need to wait for ace here, because it will be loaded by github.js
       */
      const aceLib = await waitForAce();

      editor = aceLib.edit(div);

      editor.renderer.on("afterRender", () => {
        console.log("afterRender");
      });

      //   editors[un] = editor;

      editor.getSession().setTabSize(4);
      editor.setTheme("ace/theme/idle_fingers");
      editor.getSession().setUseWrapMode(true);

      let lang = "javascript";
      editor.getSession().setMode("ace/mode/" + lang);
      //   editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, "$1"));
      editor.setValue(data);
      editor.clearSelection();

      var heightUpdateFunction = function () {
        // http://stackoverflow.com/questions/11584061/
        var newHeight = editor.getSession().getScreenLength() * editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();

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
    })();

    return () => {};
  }, []);

  return <div ref={ref} id={refId.current} />;
};

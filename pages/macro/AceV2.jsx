import React, { useState, useEffect, useRef, useMemo } from "react";

import waitForAce from "./lib/waitForAce.js";

import "./AceV2.scss";

const log = console.log;

export default function AceV2({ id }) {
  const divRef = useRef(null);

  useEffect(() => {
    (async function () {
      const div = divRef.current;

      await waitForAce();

      if (!window.editors) {
        window.editors = {};
      }

      const editor = ace.edit(div);
    })();
  }, []);

  return <div ref={divRef} id={id} className="editor" />;
}

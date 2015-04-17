import React, { useEffect, useState } from "react";

import { render } from "react-dom";

const Main = () => {
  const [sorted, setSorted] = useState("");

  function sort(str) {
    str = str
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    str.sort(function (a, b) {
      return a.localeCompare(b);
    });

    setSorted(str.join("\n"));
  }

  return (
    <>
      <textarea autoComplete={false} onChange={(e) => sort(e.target.value)} />
      <textarea autoComplete={false} value={sorted} />
    </>
  );
};

render(<Main />, document.getElementById("app"));

import React, { useEffect, useState } from "react";

import { render } from "react-dom";

const Main = () => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");

  return (
    <>
      {/*<div>*/}
      {/*  <svg width="100" height="50" style={{border: '1px solid red'}}>*/}
      {/*    <circle cx="37" cy="25" r="22" fill="blue" />*/}
      {/*    <circle cx="63" cy="25" r="22" fill="red" />*/}
      {/*  </svg>*/}
      {/*</div>*/}
      <div className="columns">
        <textarea autoComplete={false} value={a} onChange={(e) => setA(e.target.value)} />
        <textarea autoComplete={false} value={b} onChange={(e) => setB(e.target.value)} />
      </div>
      <div>
        <textarea autoComplete={false} value={c} onChange={(e) => setC(e.target.value)} />
      </div>
    </>
  );
};

render(<Main />, document.getElementById("app"));

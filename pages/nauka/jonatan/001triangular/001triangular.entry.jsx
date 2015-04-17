import React, { useEffect, useState, useRef } from "react";

import { render } from "react-dom";

function tri(x) {
  var k = (x * (x + 1)) / 2;
  return k;
}

function Main() {
  const [rows, setRows] = useState(10);

  return (
    <>
      <label>
        rows:
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={rows}
          autoComplete="off"
          onChange={(e) => setRows(parseInt(e.target.value, 10))}
        />
        {rows}
      </label>
      <br />
      <div>
        triangular for {rows} is {tri(rows)}
      </div>
      <div className="center">
        {(function () {
          const list = [];
          for (let i = 1; i <= rows; i += 1) {
            list.push(
              <div>
                <span style={{ width: `${((rows - i) * 24) / 2}px` }}></span>
                {(function () {
                  let list = [];
                  for (let k = 0; k < i; k += 1) {
                    list.push(<span key={k}> • </span>);
                  }
                  return list;
                })()}
              </div>
            );
          }
          return list;
        })()}
      </div>
    </>
  );
}

render(<Main />, document.getElementById("root"));

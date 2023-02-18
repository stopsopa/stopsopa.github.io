import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import classnames from "classnames";

import { set, get } from "nlab/lcstorage";

import Ace from "../Ace";

if (!window.acerecord) {
  (function () {
    function enc(e) {}
    function dec(e) {
      return {
        // command:
      };
    }
    window.acerecord = [];
    window.acerecordReset = (e) => {
      window.acerecord = [];
    };
    window.acerecordAdd = (e) => {
      window.acerecord.push(e);
    };
    window.acerecordList = () => {
      return window.acerecord;
    };
  })();
}

function ed(cb) {
  try {
    const instance = window.editors[Object.keys(window.editors)[0]];

    if (typeof cb === "function") {
      cb(instance);
    }

    return instance;
  } catch (e) {
    console.log("ed() error: ", e);
  }
}

// window.edit = ed;

const Main = () => {
  const [tab, setTab] = useState("one");

  const [recordOn, setRecordOn] = useState(false);

  const [valOne, setValOneRaw] = useState(get("one", ""));

  const [valTwo, setValTwoRaw] = useState(get("two", ""));

  function setValOne(data) {
    set("one", data);

    setValOneRaw(data);
  }

  function setValTwo(data) {
    set("two", data);

    setValTwoRaw(data);
  }

  return (
    <>
      <div>
        <button
          onClick={() => {
            setValOne(valOne + "\na");
          }}
        >
          a
        </button>
        <button onClick={() => setRecordOn((x) => !x)}>recordOn {recordOn ? "1" : "0"}</button>
        <button
          onClick={() =>
            ed((editor) => {
              console.log("getCursorPosition", editor.getCursorPosition());
            })
          }
        >
          getCursorPosition
        </button>
        <button
          onClick={() =>
            ed((editor) => {
              editor.selection.moveCursorLongWordRight();
            })
          }
        >
          moveCursorLongWordRight
        </button>
        <button
          onClick={() =>
            ed((editor) => {
              editor.navigateWordRight();
            })
          }
        >
          navigateWordRight
        </button>
      </div>

      <div className="tabs">
        <div
          className={classnames({
            active: tab === "one",
          })}
          onClick={() => setTab("one")}
        >
          one
        </div>
        <div
          className={classnames({
            active: tab === "two",
          })}
          onClick={() => setTab("two")}
        >
          two
        </div>
      </div>
      <div className="editors">
        <div
          className={classnames({
            active: tab === "one",
          })}
        >
          <Ace content={valOne} onChange={(data) => setValOne(data)} recordOn={recordOn} />
        </div>
        <div
          className={classnames({
            active: tab === "two",
          })}
        >
          <Ace
            content={valTwo}
            onChange={(data) => {
              console.log("onChage two: ", data);
              setValTwo(data);
            }}
          />
        </div>
      </div>
    </>
  );
};

render(<Main />, document.getElementById("app"));

import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import classnames from "classnames";

import { set as setraw, get } from "nlab/lcstorage";

import Ace from "../Ace";


import { debounce } from "lodash";

import RecordLog from "../RecordLog";

const set = debounce((...args) => {
  // console.log("debounce set", ...args);
  setraw(...args);
}, 2000);

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

window.ed = ed;

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
        <button onClick={() => setRecordOn((x) => !x)}>recordOn {recordOn ? "1" : "0"}</button>
        <button
          onClick={() => {
            setRecordOn(false);
            RecordLog.play();
          }}
        >
          play
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

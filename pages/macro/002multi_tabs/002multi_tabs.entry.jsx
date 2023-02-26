import React, { useEffect, useState, useReducer, useMemo } from "react";

import { render, createPortal } from "react-dom";

import { HotkeysProvider } from "@blueprintjs/core";

import classnames from "classnames";

import { set as setraw, get } from "nlab/lcstorage";

import Ace from "../Ace";

import { debounce } from "lodash";

import RecordLog from "../RecordLog";

const set = debounce((...args) => {
  // console.log("debounce set", ...args);
  setraw(...args);
}, 50);

function ed(id) {
  const instance = window.editors[id];

  if (typeof instance === "undefined") {
    throw new Error(`ace editor, couldn't find instance >${id}<`);
  }

  return instance;
}

window.ed = ed;

const initialState = {};

function reducer(state, action) {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value };
    default:
      throw new Error();
  }
}

/**
 *  https://codesandbox.io/s/wuixn?file=/src/App.js:75-121
 */
const Main = ({ portal }) => {
  // const [tabs, setTabs] = useState(["one"]);
  const [tabs, setTabs] = useState(["one", "two", "three"]);

  const [tab, setTabRaw] = useState("one");

  const [onTheRight, setOnTheRight] = useState(false);

  const [recordOn, setRecordOn] = useState(false);

  const [values, dispatchValue] = useReducer(reducer, initialState);

  const [valOne, setValOneRaw] = useState(get("one", ""));

  const [valTwo, setValTwoRaw] = useState("");

  function setVal(key, val) {
    set(key, val);

    dispatchValue({
      type: "set",
      key,
      value: val,
    });
  }

  useEffect(() => {
    tabs.forEach((key) => {
      dispatchValue({
        type: "set",
        key,
        value: get(key, ""),
      });
    });
    setValTwoRaw(get("two", ""));
  }, []);

  function setTab(tab) {
    if (onTheRight !== tab) {
      setTabRaw(tab);
    }
  }

  function setValOne(data) {
    set("one", data);

    setValOneRaw(data);
  }

  function setValTwo(data) {
    set("two", data);

    setValTwoRaw(data);
  }

  return (
    <HotkeysProvider>
      <div
        className={classnames({
          single: !Boolean(onTheRight),
          on_the_right: Boolean(onTheRight),
        })}
      >
        {createPortal(
          <>
            <button
              onClick={() => setRecordOn((x) => !x)}
              className={classnames("record", {
                on: recordOn,
              })}
            >
              record
            </button>
            <button
              onClick={() => {
                setRecordOn(false);
                RecordLog.play();
              }}
            >
              play
            </button>
          </>,
          portal
        )}

        <div className="tabs">
          <div
            className={classnames({
              active: tab === "one",
            })}
          >
            <div onClick={() => setTab("one")}>one</div>
            <div>
              <div onClick={() => setOnTheRight((v) => (v === "one" ? false : "one"))}>{onTheRight === "one" ? "◄" : "►"}</div>
              <div>▤</div>
            </div>
          </div>

          <div
            className={classnames({
              active: tab === "two",
            })}
          >
            <div onClick={() => setTab("two")}>two</div>
            <div>
              <div onClick={() => setOnTheRight((v) => (v === "two" ? false : "two"))}>{onTheRight === "two" ? "◄" : "►"}</div>
              <div>▤</div>
            </div>
          </div>

          <div
            className={classnames({
              active: tab === "three",
            })}
          >
            <div onClick={() => setTab("three")}>three</div>
            <div>
              <div onClick={() => setOnTheRight((v) => (v === "three" ? false : "three"))}>{onTheRight === "three" ? "◄" : "►"}</div>
              <div>▤</div>
            </div>
          </div>
        </div>
        <div className="editors">
          {tabs.map((key) => (
            <div
              key={key}
              className={classnames({
                active: tab === key,
                right: onTheRight === key,
                hidden: tab !== key && onTheRight !== key,
              })}
            >
              <Ace id={key} content={values[key] || ""} onChange={(data) => setVal(key, data)} recordOn={recordOn} />
            </div>
          ))}
        </div>
      </div>
    </HotkeysProvider>
  );
};

(async function () {
  await new Promise((resolve) => {
    (function repeat() {
      if (window.ready) {
        resolve();
      } else {
        setTimeout(repeat, 50);
      }
    })();
  });

  const portal = document.createElement("span");
  portal.classList.add("portal");
  manipulation.after(document.querySelector("header > a"), portal);

  render(<Main portal={portal} />, document.getElementById("app"));
})();

import React, { useEffect, useState, useMemo } from "react";

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

const initialStateTab = {
  lang: "javascript",
  value: "",
};
function generateDefaultTab(tab) {
  const state = structuredClone(initialStateTab);
  state.tab = tab;
  return state;
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

  const [values, setValues] = useState([]);

  function getValue(tab, field, def) {
    try {
      const copy = structuredClone(values);

      let found = copy.find((row) => row.tab == tab);

      if (!found) {
        found = generateDefaultTab(tab);
      }

      if (field) {
        return found[field] || def;
      } else {
        return field || def;
      }
    } catch (e) {
      return def;
    }
  }

  function setValue(tab, field, value) {
    setValues((values) => {
      const copy = structuredClone(values);

      let found;

      for (let i = 0, l = copy.length; i < l; i += 1) {
        if (copy[i].tab === tab) {
          if (field) {
            copy[i][field] = value;
          } else {
            copy[i] = value;
          }

          found = copy[i];
        }
      }

      set(tab, found);

      return copy;
    });
  }

  useEffect(() => {
    const list = tabs.map((tab) => {
      return get(tab, generateDefaultTab(tab));
    });
    setValues(list);
  }, []);

  function setTab(tab) {
    if (onTheRight !== tab) {
      setTabRaw(tab);
    }
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
          {tabs.map((tab_) => (
            <div
              key={tab_}
              className={classnames({
                active: tab === tab_,
                right: onTheRight === tab_,
                hidden: tab !== tab_ && onTheRight !== tab_,
              })}
            >
              <div>
                <label>
                  lang:{" "}
                  <select value={"javascript"}>
                    <option value="javascript">javascript</option>
                  </select>
                </label>
              </div>
              <Ace
                id={tab_}
                content={(function () {
                  const data = getValue(tab_, "value", "");
                  console.log("fetching....", tab_, "value", "", data);
                  return data;
                })()}
                onChange={(data) => {
                  setValue(tab_, "value", data);
                }}
                recordOn={recordOn}
              />
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

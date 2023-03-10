import React, { useEffect, useState, useMemo, useCallback } from "react";

import { render, createPortal } from "react-dom";

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
  const [tabs, setTabsRaw] = useState([{ tab: "one" }, { tab: "two" }, { tab: "three" }]);

  const [tab, setTabRaw] = useState("one");

  const [onTheRight, setOnTheRight] = useState(false);

  const [recordOn, setRecordOn] = useState(false);

  const [values, setValues] = useState([]);

  function play() {
    console.log("triggering play action in main component");
    setRecordOn(false);
    RecordLog.play();
  }

  function setTabs(tab, key, value) {
    setTabsRaw((tabs) => {
      const copy = [...tabs];

      const found = copy.find((row) => row.tab === tab);

      if (!found) {
        return copy;
      }

      found[key] = value;

      return copy;
    });
  }

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
    const list = tabs.map(({ tab }) => {
      return get(tab, generateDefaultTab(tab));
    });
    setValues(list);

    function keydown(event) {
      // Check if the key combination matches Ctrl+J or Cmd+J.
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 74) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        console.log("window.editors.one.editor.focus()");

        window.editors.one.editor.focus();

        return;
      }

      // Check if the key combination matches Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 75) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        alert("ctrl+k");

        return;
      }

      // Check if the key combination matches Ctrl+R or Cmd+R
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 82) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        play();
      } else {
        console.log({
          "event.ctrlKey": event.ctrlKey,
          "event.metaKey": event.metaKey,
          "event.keyCode": event.keyCode,
        });
      }
    }
    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, []);

  function setTab(tab) {
    if (onTheRight !== tab) {
      setTabRaw(tab);
    }
    try {
      const found = tabs.find((row) => row.tab === tab);

      if (found) {
        console.log("focus: ", found.editor);
        found.editor.focus();
      } else {
        console.log("no focus");
      }
    } catch (e) {
      console.log(`setTab error: `, e);
    }
  }

  return (
    <div
      className={classnames({
        single: !Boolean(onTheRight),
        on_the_right: Boolean(onTheRight),
      })}
      tabIndex={0}
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
          <button onClick={play} title="(cmd|ctrl)+r">
            play
          </button>
        </>,
        portal
      )}

      <div className="tabs">
        {tabs.map(({ tab: tab_ }) => {
          return (
            <div
              key={tab_}
              className={classnames({
                active: tab === tab_,
              })}
            >
              <div onClick={() => setTab(tab_)}>{tab_}</div>
              <div>
                <div onClick={() => setOnTheRight((v) => (v === tab_ ? false : tab_))}>{onTheRight === tab_ ? "◄" : "►"}</div>
                <div>▤</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* <div>
          <pre>{JSON.stringify({
            tab,
            tabs: tabs.map(({editor, ...rest}) => ({...rest}))
          }, null, 4)}</pre>
        </div> */}
      <div className="editors">
        {tabs.map(({ tab: tab_ }) => (
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
                lang:
                <select value={getValue(tab_, "lang")} onChange={(e) => setValue(tab_, "lang", e.target.value)}>
                  {(window.languages || ["javascript", "look for window.languages"]).map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Ace
              id={tab_}
              content={getValue(tab_, "value", "")}
              lang={getValue(tab_, "lang", "")}
              onInit={(editor) => setTabs(tab_, "editor", editor)}
              onChange={(data) => {
                setValue(tab_, "value", data);
              }}
              recordOn={recordOn}
            />
          </div>
        ))}
      </div>
    </div>
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

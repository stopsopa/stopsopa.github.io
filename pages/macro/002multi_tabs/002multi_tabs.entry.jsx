import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import classnames from "classnames";

import { set as setraw, get } from "nlab/lcstorage";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../Ace.jsx";

import { debounce } from "lodash";

import RecordLog from "../RecordLog";

import layoutTweaksHook from "../layoutTweaksHook.jsx";

import "./002multi_tabs.scss";

const set = debounce((...args) => {
  // console.log("debounce set", ...args);
  setraw(...args);
}, 50);

const initialStateTab = {
  lang: "javascript",
  wrap: false,
  value: "",
};
function generateDefaultTab(tab) {
  const state = structuredClone(initialStateTab);
  state.tab = tab;
  return state;
}

/**
 *    https://codesandbox.io/s/wuixn?file=/src/App.js:75-121
 */
const Main = () => {
  layoutTweaksHook();
  // tab key [string]
  // generateDefaultTab
  // editor instance of ace
  const [tabs, setTabsRaw] = useState([{ tab: "one" }, { tab: "two" }, { tab: "three" }]);

  const [tab, setTabRaw] = useState("one");

  const [onTheRight, setOnTheRight] = useState(false);

  const [recordOn, setRecordOn] = useState(false);

  const [values, setValues] = useState([]);

  function setTab(tab) {
    if (onTheRight !== tab) {
      setTabRaw(tab);
    }
  }

  function play() {
    // console.log("triggering play action in main component");
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
        // console.log('keydown event', {
        //   "event.ctrlKey": event.ctrlKey,
        //   "event.metaKey": event.metaKey,
        //   "event.keyCode": event.keyCode,
        // });
      }
    }
    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, []);

  useEffect(() => {
    if (tab) {
      pokeEditorsToRerenderBecauseSometimesTheyStuck(() => {
        if (onTheRight === false) {
          bringFocus(tab, "!onTheRight");
        }
      }); // forcus for every change of tab -> on every click of tab
    }
  }, [tab]);

  return (
    <div className="acelayout">
      <div className="top">
        <div className="portal">
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
        </div>

        <div className="tabs">
          {tabs.map(({ tab: tab_ }) => {
            return (
              <div
                key={tab_}
                className={classnames({
                  active: tab_ === tab,
                })}
              >
                <div
                  onClick={() => {
                    setTab(tab_);
                    if (onTheRight !== false) {
                      bringFocus(tab_, "onTheRight");
                    }
                  }}
                >
                  {tab_}
                </div>
                <div>
                  <div onClick={() => setOnTheRight((v) => (v === tab_ ? false : tab_))}>{onTheRight === tab_ ? "◄" : "►"}</div>
                  <div>▤</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={classnames("editors-parent", {
          single: !Boolean(onTheRight),
          on_the_right: Boolean(onTheRight),
        })}
        tabIndex={0}
      >
        <div className="spacer"></div>
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
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  wrap:
                  <input
                    type="checkbox"
                    checked={Boolean(getValue(tab_, "wrap"))}
                    onChange={(e) => {
                      setValue(tab_, "wrap", e.target.checked);
                    }}
                  />
                </label>
              </div>
              <Ace
                id={tab_}
                content={getValue(tab_, "value", "")}
                lang={getValue(tab_, "lang", "")}
                wrap={Boolean(getValue(tab_, "wrap", false))}
                onInit={(editor) => {
                  console.log(`editor mounted: `, tab_);
                  setTabs(tab_, "editor", editor);
                  if (tab_ === tab) {
                    bringFocus(tab); // focus on first load of all tabs
                  }
                }}
                onChange={(data) => {
                  setValue(tab_, "value", data);
                }}
                recordOn={recordOn}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

(async function () {
  await new Promise((resolve) => {
    (function repeat() {
      if (window.githubJsReady) {
        resolve();
      } else {
        setTimeout(repeat, 50);
      }
    })();
  });

  render(<Main />, document.getElementById("app"));
})();

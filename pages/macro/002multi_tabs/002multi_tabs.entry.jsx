import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import classnames from "classnames";

import { set as setraw, get as getraw } from "nlab/lcstorage";

import useCustomState from "../../useCustomState.js";

const section = "editor";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../Ace.jsx";

import { debounce } from "lodash";

import RecordLog from "../RecordLog";

import layoutTweaksHook from "../layoutTweaksHook.jsx";

import "./002multi_tabs.scss";

import { useDroppable, useDraggable } from "@dnd-kit/core";

import { DndContext, closestCenter, MouseSensor, KeyboardSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const setLocalStorage = debounce((...args) => {
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

  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
    // useSensor(KeyboardSensor, {
    //   coordinateGetter: sortableKeyboardCoordinates,
    // })
  );

  // tab key [string]
  // generateDefaultTab
  // editor instance of ace
  const [tabs, setTabsRaw] = useState([{ tab: "one" }, { tab: "two" }, { tab: "threethree" }]);

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

      setLocalStorage(tab, found);

      return copy;
    });
  }

  useEffect(() => {
    const list = tabs.map(({ tab }) => {
      return getraw(tab, generateDefaultTab(tab));
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
        console.log("keydown event", {
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

  useEffect(() => {
    if (id) {
      (async function () {
        await set({
          key: "focus_test",
          data: "test",
        });

        window.addEventListener("focus", async function () {
          const data = await get("focus_test");

          console.log("focus_test", data);
        });
      })();
    }
  }, [id]);

  useEffect(() => {
    if (tab) {
      pokeEditorsToRerenderBecauseSometimesTheyStuck(() => {
        if (onTheRight === false) {
          bringFocus(tab, "!onTheRight");
        }
      }); // forcus for every change of tab -> on every click of tab
    }
  }, [tab]);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTabsRaw((tabs) => {
        const tmp = tabs.map((t) => t.tab);

        const oldIndex = tmp.indexOf(active.id);

        const newIndex = tmp.indexOf(over.id);

        const newList = arrayMove(tabs, oldIndex, newIndex); // https://docs.dndkit.com/presets/sortable#connecting-all-the-pieces

        return newList;
      });
    }
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="tabs">
            <SortableContext items={tabs.map((t) => t.tab)} strategy={horizontalListSortingStrategy}>
              {tabs.map(({ tab: tab_ }) => {
                return <SortableTabElement key={tab_} tab={tab} tab_={tab_} onTheRight={onTheRight} setOnTheRight={setOnTheRight} setTab={setTab} />;
              })}
              <div>
                <div
                  onClick={() => {
                    console.log("add...");
                  }}
                >
                  +
                </div>
              </div>
            </SortableContext>
          </div>
        </DndContext>
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

function SortableTabElement(props) {
  const { tab, tab_, onTheRight, setOnTheRight, setTab } = props;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tab_,
    transition: {
      // duration: 150, // milliseconds
      // easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      key={tab_}
      className={classnames({
        active: tab_ === tab,
      })}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
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
}

{
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
}

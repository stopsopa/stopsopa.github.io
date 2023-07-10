import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { render, createPortal } from "react-dom";

import classnames from "classnames";

import { set as setraw, get as getraw } from "nlab/lcstorage";

import useCustomState from "../../useCustomState.js";

const section = "editor";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../Ace.jsx";

import { debounce } from "lodash";

import RecordLog from "../RecordLog";

import "./003next.scss";

import Modal from "../Modal.jsx";

import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

import { useSortable, arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import md5 from "md5";

import useStatePromise from "./useStatePromise.js";

import useQueue from "./useQueue.jsx";

import useStateFetcher from './useStateFetcher.jsx';

const setLocalStorage = debounce((...args) => {
  // log("debounce set", ...args);
  setraw(...args);
}, 50);

const initialStateTab = {
  lang: "javascript",
  wrap: false,
  value: "",
};
function generateDefaultTab(index) {
  const state = structuredClone(initialStateTab);
  state.index = index;
  return state;
}

/**
 *  https://codesandbox.io/s/wuixn?file=/src/App.js:75-121
 */
const Main = ({ portal }) => {
  const [loading, setLoading] = (function () {
    const [loading, setLoading] = useState(false);

    return [
      loading,
      (oneOrMinusOne) => {
        if (oneOrMinusOne !== 1 && oneOrMinusOne !== -1) {
          throw new Error(`oneOrMinusOne should be 1 or -1`);
        }

        setLoading((l) => (l += oneOrMinusOne));
      },
    ];
  })();

  const queue = useQueue();

  const [editIndex, setEditIndexDontUseDirectly] = useState(false);

  const [createModal, setCreateModalDontUseDirectly] = useState(false);
  const [label, setLabel] = useState("");

  // index key [string]
  // generateDefaultTab
  // editor instance of ace

  const [tabs, setTabsDontUseDirectly, getTabsFetcher] = useStateFetcher([
    // { index: "one_indx", label: "one" },
    // { index: "two_indx", label: "two" },
    // { index: "three_indx", label: "three" },
  ]);

  function setCreateModal(state) {
    setLabel("");

    setCreateModalDontUseDirectly(Boolean(state));

    setEditIndexDontUseDirectly(false);
  }

  function setEditIndex(index) {
    const found = tabs.find((t) => t.index === index);

    setCreateModalDontUseDirectly(false);

    if (found) {
      setLabel(found.label);

      setEditIndexDontUseDirectly(index);
    } else {
      setEditIndexDontUseDirectly(false);
    }
  }

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

  function generateUniq() {
    let un;

    do {
      un = unique();
    } while (tabs.find((t) => t.index == un));

    return un;
  }

  const [index, setIndexRaw] = useState("one");

  const [indexOnTheRight, setIndexOnTheRight] = useState(false);

  const [recordOn, setRecordOn] = useState(false);

  const [values, setValues] = useState([]);

  function play() {
    setRecordOn(false);
    RecordLog.play();
  }

  function setTabs(index, key, value) {
    setTabsDontUseDirectly((tabs) => {
      const copy = [...tabs];

      const found = copy.find((row) => row.index === index);

      if (!found) {
        return copy;
      }

      found[key] = value;

      return copy;
    });
  }

  function getValue(index, field, def) {
    try {
      const copy = structuredClone(values);

      let found = copy.find((row) => row.index == index);

      if (!found) {
        found = generateDefaultTab(index);
      }

      return found[field] || def;
    } catch (e) {
      return def;
    }
  }

  function setValue(index, field, value) {
    setValues((values) => {
      const copy = structuredClone(values);

      let found;

      for (let i = 0, l = copy.length; i < l; i += 1) {
        if (copy[i].index === index) {
          if (field) {
            copy[i][field] = value;
          } else {
            copy[i] = value;
          }

          found = copy[i];
        }
      }

      setLocalStorage(index, found);

      return copy;
    });
  }

  function deleteTab(index) {
    const newList = tabs.filter((t) => t.index != index);

    newList.forEach((r, i) => (r.zeroIndex = i));

    setTabsDontUseDirectly((tabs) => newList);

    setEditIndex(false);

    queue(() => pushTabs(newList));
  }

  useEffect(() => {
    const list = tabs.map(({ index }) => {
      return getraw(index, generateDefaultTab(index));
    });
    setValues(list);

    function keydown(event) {
      // Check if the key combination matches Ctrl+J or Cmd+J.
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 74) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        log("window.editors.one.editor.focus()");

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
        log({
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
        window.addEventListener("focus", async function () {
          queue(() => pullTabs());
        });
        window.addEventListener("blur", async function () {
          console.log("blur");
          queue(() => pushTabs());
        });

        queue(() => pullTabs());
      })();
    }
  }, [id]);

  useEffect(() => {
    if (index) {
      pokeEditorsToRerenderBecauseSometimesTheyStuck(() => {
        if (indexOnTheRight === false) {
          bringFocus(index, "!indexOnTheRight");
        }
      }); // forcus for every change of index -> on every click of index
    }
  }, [index]);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTabsDontUseDirectly((tabs) => {
        const tmp = tabs.map((t) => t.index);

        const oldIndex = tmp.indexOf(active.id);

        const newIndex = tmp.indexOf(over.id);

        const newList = arrayMove(tabs, oldIndex, newIndex); // https://docs.dndkit.com/presets/sortable#connecting-all-the-pieces

        newList.forEach((r, i) => (r.zeroIndex = i));

        queue(() => pushTabs(newList));

        return newList;
      });
    }
  }

  function setTab(index) {
    if (indexOnTheRight !== index) {
      setIndexRaw(index);
    }
    try {
      const found = tabs.find((row) => row.index === index);

      if (found) {
        log("focus: ", found.editor);
        found.editor.focus();
      } else {
        log("no focus");
      }
    } catch (e) {
      log(`setTab error: `, e);
    }
  }

  async function pullTabs() {
    setLoading(1);

    log.orange("firebase", "pullTabs");

    const result = await get("tabs");

    log.orange("firebase", "pullTabs result", result);

    if (!Array.isArray(tabs) || tabs.length === 0) {
      const tabsTransformed = Object.entries(result || {}).reduce((acc, [index, obj]) => {
        const zeroIndex = obj.zeroIndex;

        acc[zeroIndex] = {
          ...obj,
          index,
        };

        return acc;
      }, []);

      setTabsDontUseDirectly(tabsTransformed);
    }

    setLoading(-1);
  }

  async function pushTabs(given) {
    setLoading(1);

    const tabsTransformed = (given || getTabsFetcher() || []).reduce((acc, val, i) => {
      const { index, editor, ...rest } = val;

      acc[index] = { ...rest, zeroIndex: i };

      return acc;
    }, {});

    log.orange("firebase", "pushTabs", tabsTransformed, "given: ", given);

    const result = await set({
      key: "tabs",
      data: tabsTransformed,
    });

    log.orange("firebase", "pushTabs result", result);

    setLoading(-1);
  }

  return (
    <div
      className={classnames({
        single: !Boolean(indexOnTheRight),
        on_the_right: Boolean(indexOnTheRight),
      })}
      tabIndex={0}
    >
      {loading > 0 && (
        <div className="global-loader-component load" data-test="loader">
          <span>Loading: {loading}</span>
        </div>
      )}
      {createModal && ( // one modal for create mode
        <Modal title="Create tab" onClose={() => setCreateModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const lab = label.trim();
              if (lab) {
                const newList = [...tabs, { index: generateUniq(), label: lab, time: now() }];
                setTabsDontUseDirectly((tabs) => newList);
                setCreateModal(false);

                queue(() => pushTabs(newList));
              }
            }}
          >
            <label>
              label: &nbsp;
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={{ width: "50%" }}
                autoFocus
              />
              <button type="submit">Create</button>
            </label>
          </form>
        </Modal>
      )}
      {editIndex && // second modal for edit mode
        (function () {
          const found = tabs.find((t) => t.index == editIndex);
          if (found) {
            return (
              <Modal title={`Edit tab: ${found.label}`} onClose={() => setEditIndex(false)}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const lab = label.trim();
                    if (lab) {
                      setTabs(editIndex, "label", lab);
                      setEditIndex(false);
                    }
                  }}
                >
                  <label>
                    label: &nbsp;
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      style={{ width: "50%" }}
                      autoFocus
                    />
                    <button type="submit">Edit</button>
                  </label>
                </form>
                <button
                  style={{ float: "right" }}
                  onClick={() => {
                    deleteTab(editIndex);
                  }}
                >
                  delete
                </button>
              </Modal>
            );
          }
        })()}
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="tabs this_element_changes_height_and_together_with_header_affect_spacer">
          <SortableContext items={tabs.map((t) => t.index)} strategy={horizontalListSortingStrategy}>
            <div>
              <div
                onClick={() => {
                  setCreateModal(true);
                }}
              >
                +
              </div>
            </div>

            {tabs.map(({ index: iterateIndex, label }) => {
              return (
                <SortableTabElement
                  key={iterateIndex}
                  index={index}
                  label={label}
                  iterateIndex={iterateIndex}
                  indexOnTheRight={indexOnTheRight}
                  setIndexOnTheRight={setIndexOnTheRight}
                  setTab={setTab}
                  setEditIndex={setEditIndex}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
      <div className="dynamic_spacer"></div>
      <div className="editors">
        {tabs.map(({ index: iterateIndex }) => (
          <div
            key={iterateIndex}
            className={classnames({
              active: index === iterateIndex,
              right: indexOnTheRight === iterateIndex,
              hidden: index !== iterateIndex && indexOnTheRight !== iterateIndex,
            })}
          >
            <div>
              <label>
                lang:
                <select
                  value={getValue(iterateIndex, "lang")}
                  onChange={(e) => setValue(iterateIndex, "lang", e.target.value)}
                >
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
                  checked={Boolean(getValue(iterateIndex, "wrap"))}
                  onChange={(e) => {
                    setValue(iterateIndex, "wrap", e.target.checked);
                  }}
                />
              </label>
            </div>
            <Ace
              id={iterateIndex}
              content={getValue(iterateIndex, "value", "")}
              lang={getValue(iterateIndex, "lang", "")}
              wrap={Boolean(getValue(iterateIndex, "wrap", false))}
              onInit={(editor) => {
                log(`editor mounted: `, iterateIndex);
                setTabs(iterateIndex, "editor", editor);
                if (iterateIndex === index) {
                  bringFocus(index); // focus on first load of all tabs
                }
              }}
              onChange={(data) => {
                setValue(iterateIndex, "value", data);
              }}
              recordOn={recordOn}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

function SortableTabElement(props) {
  const { index, label, iterateIndex, indexOnTheRight, setIndexOnTheRight, setTab, setEditIndex } = props;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: iterateIndex,
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
      key={iterateIndex}
      className={classnames({
        active: iterateIndex === index,
      })}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div
        onClick={() => {
          setTab(iterateIndex);
          if (indexOnTheRight !== false) {
            bringFocus(iterateIndex, "indexOnTheRight");
          }
        }}
      >
        {label}
      </div>
      <div>
        <div onClick={() => setIndexOnTheRight((v) => (v === iterateIndex ? false : iterateIndex))}>
          {indexOnTheRight === iterateIndex ? "◄" : "►"}
        </div>
        <div onClick={() => setEditIndex(iterateIndex)}>▤</div>
      </div>
    </div>
  );
}

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

  const portal = document.createElement("span");
  portal.classList.add("portal");
  manipulation.after(document.querySelector("header > a"), portal);

  render(<Main portal={portal} />, document.getElementById("app"));
})();

function unique(pattern) {
  // node.js require('crypto').randomBytes(16).toString('hex');
  pattern || (pattern = "xyxyxy");
  return pattern.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now() {
  return new Date().toISOString();
}

const num = (function () {
  let c = 0;
  return () => {
    c += 1;
    return c;
  };
})();

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

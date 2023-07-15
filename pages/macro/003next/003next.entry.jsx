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

import useStateFetcher from "./useStateFetcher.jsx";

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
  const [isPageFocused, setIsPageFocused] = useState(undefined);

  const [loading, setLoadingRaw] = useState(0);

  function setLoading(oneOrMinusOne) {
    if (oneOrMinusOne !== 1 && oneOrMinusOne !== -1) {
      throw new Error(`oneOrMinusOne should be 1 or -1`);
    }

    setLoadingRaw((l) => (l += oneOrMinusOne));
  }

  const [queue, getQueue] = useQueue();

  const [editIndex, setEditIndexDontUseDirectly] = useState(false);

  const [createModal, setCreateModalDontUseDirectly] = useState(false);
  const [label, setLabel] = useState("");

  // index key [string]
  // generateDefaultTab
  // editor instance of ace

  const [allTabsDataExceptValues, setAllTabsDataExceptValuesDontUseDirectly, getAllTabsDataExceptValuesFetcher] =
    useStateFetcher([
      // { index: "one_indx", label: "one" },
      // { index: "two_indx", label: "two" },
      // { index: "three_indx", label: "three" },
    ]);

  let selectedTabIndex;
  try {
    selectedTabIndex = allTabsDataExceptValues[0].index;
  } catch (e) {}
  try {
    let newestDate;

    allTabsDataExceptValues.forEach((t) => {
      if (!newestDate || (t.selectedTabIndexLatestDate && t.selectedTabIndexLatestDate > newestDate)) {
        selectedTabIndex = t.index;

        newestDate = t.selectedTabIndexLatestDate;
      }
    });
  } catch (e) {}

  let indexOnTheRight;
  try {
    indexOnTheRight = allTabsDataExceptValues.find((t) => t.indexOnTheRight).index;
  } catch (e) {}

  function setCreateModal(state) {
    setLabel("");

    setCreateModalDontUseDirectly(Boolean(state));

    setEditIndexDontUseDirectly(false);
  }

  function setEditIndex(index) {
    const found = allTabsDataExceptValues.find((t) => t.index === index);

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
    } while (allTabsDataExceptValues.find((t) => t.index == un));

    return un;
  }

  const [recordOn, setRecordOn] = useState(false);

  const [allEditorsValues, setAllEditorsValues] = useState([]);

  function play() {
    setRecordOn(false);
    RecordLog.play();
  }

  function setIndexOnTheRight(index) {
    const copy = structuredClone(allTabsDataExceptValues);

    copy.forEach((t) => {
      if (t.index === index) {
        t.indexOnTheRight = true;
      } else {
        delete t.indexOnTheRight;
      }
    });

    setAllTabsDataExceptValuesDontUseDirectly(copy);
  }

  function setAllTabsDataExceptValues(index, key, value) {
    setAllTabsDataExceptValuesDontUseDirectly((allTabsDataExceptValues) => {
      const copy = [...allTabsDataExceptValues];

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
      const copy = structuredClone(allEditorsValues);

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
    setAllEditorsValues((allEditorsValues) => {
      const copy = structuredClone(allEditorsValues);

      let found;

      for (let i = 0, l = copy.length; i < l; i += 1) {
        if (copy[i].index === index) {
          copy[i][field] = value;

          found = copy[i];
        }
      }

      log("setLocalStorage: ", index, field, value, "found: ", found, "copy: ", copy);

      return copy;
    });
  }

  function deleteTab(index) {
    const newList = allTabsDataExceptValues.filter((t) => t.index != index);

    newList.forEach((r, i) => (r.zeroIndexOrderTab = i));

    setAllTabsDataExceptValuesDontUseDirectly(() => newList);

    setEditIndex(false);
  }

  useEffect(() => {
    const list = allTabsDataExceptValues.map(({ index }) => {
      return getraw(index, generateDefaultTab(index));
    });
    setAllEditorsValues(list);

    function keydown(event) {
      // Check if the key combination matches Ctrl+J or Cmd+J.
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 74) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

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
    if (!id) {
      return;
    }

    window.addEventListener("focus", function () {
      setIsPageFocused(true);
      console.log("focus");
      queue(() => pullAllTabsDataExceptValues(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
    });

    window.addEventListener("blur", function () {
      setIsPageFocused(false);
      console.log("blur");
      queue(() => pushAllTabsDataExceptValues(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
    });

    setIsPageFocused(document.hasFocus()); // https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus

    queue(() => pullAllTabsDataExceptValues(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
  }, [id]);

  useEffect(() => {
    // log.orange("isPageFocused useEffect", isPageFocused);

    if (typeof isPageFocused !== "boolean") {
      return;
    }

    // log.orange("sync", "bind");

    let keepLoopGoing = false;
    let handler;

    function sync() {
      // log.orange("sync", "id: ", id, "execute");

      if (!id) {
        return;
      }

      queue(() => pullAllTabsDataExceptValues(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");

      if (keepLoopGoing) {
        handler = setTimeout(sync, 1000);
      } else {
        // log.orange("sync", "id: ", id, "stopped");

        clearTimeout(handler);

        keepLoopGoing = false;
      }
    }

    if (id && isPageFocused && selectedTabIndex) {
      keepLoopGoing = true;
      // log.orange("sync", "bind", "setInterval", "on");
      // handler = setInterval(sync, 15000);

      handler = setTimeout(sync, 1000);
    } else {
      // log.orange(
      //   "sync",
      //   "id: ",
      //   id,
      //   "conditions not met to run:",
      //   "id: ",
      //   id,
      //   "isPageFocused:",
      //   isPageFocused,
      //   "selectedTabIndex: ",
      //   selectedTabIndex
      // );
    }

    return () => {
      // log.orange("sync", "id: ", id, "unmount");

      clearTimeout(handler);

      keepLoopGoing = false;
    };
  }, [isPageFocused, id, selectedTabIndex]);

  useEffect(() => {
    if (selectedTabIndex) {
      pokeEditorsToRerenderBecauseSometimesTheyStuck(() => {
        if (indexOnTheRight === false) {
          bringFocus(selectedTabIndex, "!indexOnTheRight");
        }
      }); // forcus for every change of index -> on every click of index
    }
  }, [selectedTabIndex]);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setAllTabsDataExceptValuesDontUseDirectly((allTabsDataExceptValues) => {
        const tmp = allTabsDataExceptValues.map((t) => t.index);

        const oldIndex = tmp.indexOf(active.id);

        const newIndex = tmp.indexOf(over.id);

        const newList = arrayMove(allTabsDataExceptValues, oldIndex, newIndex); // https://docs.dndkit.com/presets/sortable#connecting-all-the-pieces

        newList.forEach((r, i) => (r.zeroIndexOrderTab = i));

        return newList;
      });
    }
  }

  function setSelectedTab(index) {
    if (indexOnTheRight !== index) {
      setAllTabsDataExceptValues(index, "selectedTabIndexLatestDate", now());
      // setSelectedTabIndexRaw(index);
    }
  }

  async function pullAllTabsDataExceptValues() {
    setLoading(1);

    try {
      const currentAllTabsMd5 = md5(JSON.stringify(allTabsDataExceptValues));

      const result = await get("allTabsDataExceptValues");

      log.orange("firebase", "pullAllTabsDataExceptValues result", result);

      const tabsTransformed = Object.entries(result || {}).reduce((acc, [index, obj]) => {
        const zeroIndexOrderTab = obj.zeroIndexOrderTab;

        acc[zeroIndexOrderTab] = {
          ...obj,
          index,
        };

        return acc;
      }, []);

      if (md5(JSON.stringify(allTabsDataExceptValues)) === currentAllTabsMd5) {
        setAllTabsDataExceptValuesDontUseDirectly(tabsTransformed);
      }
    } catch (e) {}

    setLoading(-1);
  }

  async function pushAllTabsDataExceptValues(given) {
    setLoading(1);

    try {
      const tabsTransformed = (given || getAllTabsDataExceptValuesFetcher() || []).reduce((acc, val, i) => {
        const { index, editor, ...rest } = val;

        acc[index] = { ...rest, zeroIndexOrderTab: i };

        return acc;
      }, {});

      await set({
        key: "allTabsDataExceptValues",
        data: tabsTransformed,
      });

      log.orange("firebase", "------> pushAllTabsDataExceptValues result");
    } catch (e) {}

    setLoading(-1);
  }

  useEffect(() => {
    if (Array.isArray(allTabsDataExceptValues) && allTabsDataExceptValues.length > 0) {
      pushAllTabsDataExceptValues();
    }
  }, [md5(JSON.stringify(allTabsDataExceptValues))]);

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
                const newList = [...allTabsDataExceptValues, { index: generateUniq(), label: lab, time: now() }];
                setAllTabsDataExceptValuesDontUseDirectly(() => newList);
                setCreateModal(false);
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
          const found = allTabsDataExceptValues.find((t) => t.index == editIndex);
          if (found) {
            return (
              <Modal title={`Edit tab: ${found.label}`} onClose={() => setEditIndex(false)}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const lab = label.trim();
                    if (lab) {
                      setAllTabsDataExceptValues(editIndex, "label", lab);
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
          <SortableContext items={allTabsDataExceptValues.map((t) => t.index)} strategy={horizontalListSortingStrategy}>
            <div>
              <div
                onClick={() => {
                  setCreateModal(true);
                }}
              >
                +
              </div>
            </div>

            {allTabsDataExceptValues.map(({ index: iterateIndex, label }) => {
              return (
                <SortableTabElement
                  key={iterateIndex}
                  selectedTabIndex={selectedTabIndex}
                  label={label}
                  iterateIndex={iterateIndex}
                  indexOnTheRight={indexOnTheRight}
                  setIndexOnTheRight={setIndexOnTheRight}
                  setSelectedTab={setSelectedTab}
                  setEditIndex={setEditIndex}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
      <div className="dynamic_spacer"></div>
      <div className="editors">
        {allTabsDataExceptValues.map(({ index: iterateIndex }) => (
          <div
            key={iterateIndex}
            className={classnames({
              active: selectedTabIndex === iterateIndex,
              right: indexOnTheRight === iterateIndex,
              hidden: selectedTabIndex !== iterateIndex && indexOnTheRight !== iterateIndex,
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
                if (iterateIndex === selectedTabIndex) {
                  bringFocus(selectedTabIndex); // focus on first load of all allTabsDataExceptValues
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
  const { selectedTabIndex, label, iterateIndex, indexOnTheRight, setIndexOnTheRight, setSelectedTab, setEditIndex } =
    props;

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
        active: iterateIndex === selectedTabIndex,
      })}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div
        onClick={() => {
          setSelectedTab(iterateIndex);
          if (indexOnTheRight !== false) {
            bringFocus(iterateIndex, "indexOnTheRight");
          }
        }}
      >
        {label}
      </div>
      <div>
        {/* <div onClick={() => setIndexOnTheRight((v) => (v === iterateIndex ? false : iterateIndex))}> */}
        <div onClick={() => setIndexOnTheRight(indexOnTheRight === iterateIndex ? false : iterateIndex)}>
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

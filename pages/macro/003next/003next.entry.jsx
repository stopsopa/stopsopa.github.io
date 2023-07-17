import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { render, createPortal } from "react-dom";

import classnames from "classnames";

import { set as setraw, get as getraw } from "nlab/lcstorage";

import useCustomState from "../../useCustomState.js";

const section = "editor";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../Ace.jsx";

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

const whenUpdated = {};

/**
 * dirty loader to reduce renders of main component vvv
 */
const loadingTrigger = (function () {
  let trigger;

  return function (val) {
    if (typeof val === "function") {
      trigger = val;

      return;
    }

    if (val !== 1 && val !== -1) {
      throw new Error(`loadingTrigger should be 1 or -1`);
    }

    if (typeof trigger === "function") {
      trigger((l) => (l += val));
    }
  };
})();

function LoadingComponent() {
  const [loadingStateInLoadingComponent, setLoadingStateInLoadingComponent] = useState(0);

  loadingTrigger(setLoadingStateInLoadingComponent);

  if (loadingStateInLoadingComponent > 0) {
    return (
      <div className="global-loader-component load" data-test="loader">
        <span>Loading: {loadingStateInLoadingComponent}</span>
      </div>
    );
  }

  return null;
}
/**
 * dirty loader  ^^^
 */

/**
 *  https://codesandbox.io/s/wuixn?file=/src/App.js:75-121
 */
const Main = ({ portal }) => {
  log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX render XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

  const [isPageFocused, setIsPageFocused] = useState(undefined);

  const [editIndex, setEditIndexDontUseDirectly] = useState(false);

  const [createModal, setCreateModalDontUseDirectly] = useState(false);
  const [label, setLabel] = useState(""); // copy of label for edit mode - for modal

  const [recordOn, setRecordOn] = useState(false);

  const [allEditorsValues, setAllEditorsValues] = useState({});

  const [queue, getQueue] = useQueue();

  const [allTabsDataExceptValues, setAllTabsDataExceptValuesDontUseDirectly, getAllTabsDataExceptValuesFetcher] =
    useStateFetcher([]);

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

  let selectedTabIndex;
  function findSelectedTabIndex(data) {
    let selectedTabIndex;
    try {
      selectedTabIndex = (data || allTabsDataExceptValues)[0].index;
    } catch (e) {}
    try {
      let newestDate;
      (data || allTabsDataExceptValues).forEach((t) => {
        if (!newestDate || (t.selectedTabIndexLatestDate && t.selectedTabIndexLatestDate > newestDate)) {
          selectedTabIndex = t.index;

          newestDate = t.selectedTabIndexLatestDate;
        }
      });
    } catch (e) {}

    return selectedTabIndex;
  }
  selectedTabIndex = findSelectedTabIndex();

  let indexOnTheRight;
  function findIndexOnTheRight(data) {
    try {
      return (data || allTabsDataExceptValues).find((t) => t.indexOnTheRight).index;
    } catch (e) {}
  }
  indexOnTheRight = findIndexOnTheRight();

  function setCreateModal(state) {
    setLabel("");

    setCreateModalDontUseDirectly(Boolean(state));

    setEditIndexDontUseDirectly(false);
  }

  function generateUniq() {
    let un;

    do {
      un = unique();
    } while (allTabsDataExceptValues.find((t) => t.index == un));

    return un;
  }

  function play() {
    setRecordOn(false);
    RecordLog.play();
  }

  // allTabsDataExceptValues --- setters ----- vvv

  function generateDefaultTab(spreadObject) {
    return {
      lang: "javascript",
      wrap: false,
      index: generateUniq(),
      ...spreadObject,
    };
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

  function getAllTabsDataExceptValues(index, key) {
    try {
      return allTabsDataExceptValues.find((t) => t.index === index)[key];
    } catch (e) {}
  }

  function setSelectedTab(index) {
    if (indexOnTheRight !== index) {
      setAllTabsDataExceptValues(index, "selectedTabIndexLatestDate", now());
      // setSelectedTabIndexRaw(index);
    }
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

  function deleteTab(index) {
    const newList = allTabsDataExceptValues.filter((t) => t.index != index);

    newList.forEach((r, i) => (r.zeroIndexOrderTab = i));

    setAllTabsDataExceptValuesDontUseDirectly(() => newList);

    setEditIndex(false);
  }

  async function pullAllTabsDataExceptValues() {
    loadingTrigger(1);

    try {
      const currentAllTabsMd5 = md5(JSON.stringify(allTabsDataExceptValues));

      const result = await get("allTabsDataExceptValues");

      log.orange("firebase", "<------ pullAllTabsDataExceptValues result", result);

      const tabsTransformed = Object.entries(result || {}).reduce((acc, [index, obj]) => {
        const zeroIndexOrderTab = obj.zeroIndexOrderTab;

        acc[zeroIndexOrderTab] = {
          ...obj,
          index,
        };

        return acc;
      }, []);

      /**
       * if allTabsDataExceptValues changed in the meantime
       */
      if (md5(JSON.stringify(allTabsDataExceptValues)) === currentAllTabsMd5) {
        /**
         * if data that was pulled for allTabsDataExceptValues is really different than data component already have
         * only then change state, this way I'm reducing unecessary rerenders of main component
         */
        if (md5(JSON.stringify(tabsTransformed)) !== currentAllTabsMd5) {
          const selectedTabIndex_tabObjectValue = structuredClone(allTabsDataExceptValues[selectedTabIndex]);

          const indexOnTheRight_tabObjectValue = structuredClone(allTabsDataExceptValues[indexOnTheRight]);

          setAllTabsDataExceptValuesDontUseDirectly(tabsTransformed);

          // updating selected tab:
          {
            const selectedTabIndex = findSelectedTabIndex(tabsTransformed);

            // update opened tab:
            // console.log(
            //   "updatetab",
            //   selectedTabIndex,
            //   "result[selectedTabIndex]",
            //   result[selectedTabIndex],
            //   "selectedTabIndex_tabObjectValue: ",
            //   selectedTabIndex_tabObjectValue
            // );

            if (
              selectedTabIndex &&
              result[selectedTabIndex] &&
              result?.[selectedTabIndex]?.valueMD5 &&
              result?.[selectedTabIndex]?.valueMD5 !== selectedTabIndex_tabObjectValue?.valueMD5
            ) {
              const result = await get(["allEditorsValues", selectedTabIndex]);

              log(
                "selectedTabIndex selectedTabIndex selectedTabIndex selectedTabIndex selectedTabIndex selectedTabIndex selectedTabIndex selectedTabIndex ",
                selectedTabIndex,
                result
              );

              if (typeof result?.value === "string") {
                setTimeout(() => {
                  setValue(selectedTabIndex, "");
                  setTimeout(() => {
                    setValue(selectedTabIndex, result.value);
                  }, 100);
                }, 100);
              }
            }
          }

          // updating selected indexOnTheRight tab:
          {
            const indexOnTheRight = findIndexOnTheRight(tabsTransformed);

            // update opened tab:
            console.log(
              "indexOnTheRight",
              indexOnTheRight,
              "result[indexOnTheRight]",
              result[indexOnTheRight],
              "selectedTabIndex_tabObjectValue: ",
              indexOnTheRight_tabObjectValue
            );

            if (
              indexOnTheRight &&
              result[indexOnTheRight] &&
              result?.[indexOnTheRight]?.valueMD5 &&
              result?.[indexOnTheRight]?.valueMD5 !== indexOnTheRight_tabObjectValue?.valueMD5
            ) {
              const result = await get(["allEditorsValues", indexOnTheRight]);
              log(
                "indexOnTheRight indexOnTheRight indexOnTheRight indexOnTheRightindexOnTheRight indexOnTheRight indexOnTheRight indexOnTheRight",
                indexOnTheRight,
                result
              );

              if (typeof result?.value === "string") {
                setTimeout(() => {
                  setValue(indexOnTheRight, "");
                  setTimeout(() => {
                    setValue(indexOnTheRight, result.value);
                  }, 100);
                }, 100);
              }
            } else {
              log(
                "NNNNNNNNNNNNNNNNNNNNN indexOnTheRight indexOnTheRight indexOnTheRight indexOnTheRightindexOnTheRight indexOnTheRight indexOnTheRight indexOnTheRight"
              );
            }
          }
        }
      }
    } catch (e) {}

    loadingTrigger(-1);
  }

  async function pushAllTabsDataExceptValues(given) {
    loadingTrigger(1);

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

    loadingTrigger(-1);
  }

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
  // allTabsDataExceptValues --- setters ----- ^^^

  function setValue(index, value) {
    setAllEditorsValues((allEditorsValues) => {
      if (
        typeof allEditorsValues[index] === "string" &&
        typeof value === "string" &&
        allEditorsValues[index] &&
        value &&
        allEditorsValues[index] !== value
      ) {
        const n = now();
        log.orange("whenUpdated", "setValue", n, "before: ", `>${allEditorsValues[index]}<`, "after: ", `>${value}<`);
        whenUpdated[selectedTabIndex] = n;
      }

      return {
        ...allEditorsValues,
        [index]: value,
      };
    });
  }

  useEffect(() => {
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

  // useEffect(() => {
  //   // log.orange("isPageFocused useEffect", isPageFocused);

  //   if (typeof isPageFocused !== "boolean") {
  //     return;
  //   }

  //   // log.orange("sync", "bind");

  //   let keepLoopGoing = false;
  //   let handler;

  //   function sync() {
  //     log.orange("sync", "id: ", id, "execute");

  //     if (!id) {
  //       return;
  //     }

  //     queue(() => pullAllTabsDataExceptValues(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");

  //     if (keepLoopGoing) {
  //       handler = setTimeout(sync, 8000);
  //     } else {
  //       // log.orange("sync", "id: ", id, "stopped");

  //       clearTimeout(handler);

  //       keepLoopGoing = false;
  //     }
  //   }

  //   if (id && isPageFocused && selectedTabIndex) {
  //     keepLoopGoing = true;
  //     // log.orange("sync", "bind", "setInterval", "on");
  //     // handler = setInterval(sync, 15000);

  //     handler = setTimeout(sync, 8000);
  //   } else {
  //     // log.orange(
  //     //   "sync",
  //     //   "id: ",
  //     //   id,
  //     //   "conditions not met to run:",
  //     //   "id: ",
  //     //   id,
  //     //   "isPageFocused:",
  //     //   isPageFocused,
  //     //   "selectedTabIndex: ",
  //     //   selectedTabIndex
  //     // );
  //   }

  //   return () => {
  //     // log.orange("sync", "id: ", id, "unmount");

  //     clearTimeout(handler);

  //     keepLoopGoing = false;
  //   };
  // }, [isPageFocused, id, selectedTabIndex]);

  useEffect(() => {
    if (selectedTabIndex) {
      pokeEditorsToRerenderBecauseSometimesTheyStuck(() => {
        if (indexOnTheRight === false) {
          bringFocus(selectedTabIndex, "!indexOnTheRight");
        }
      }); // forcus for every change of index -> on every click of index
    }
  }, [selectedTabIndex]);

  useEffect(() => {
    if (Array.isArray(allTabsDataExceptValues) && allTabsDataExceptValues.length > 0) {
      pushAllTabsDataExceptValues();
    }
  }, [md5(JSON.stringify(allTabsDataExceptValues))]);

  const pushValueSelectedTabIndex = useCallback(
    debounce(async (index, value) => {
      if (id) {
        if (typeof index === "string" && typeof value === "string" && value.trim()) {
          log.orange("firebase", `======> ${value}`);

          // log("sent::", now());

          // const updated = await get(["allEditorsValues", index, "updated"]);

          // log("remote", updated);
          // log("local:", whenUpdated[index]);

          // if (typeof updated === "string" && typeof whenUpdated[index] === "string" && updated > whenUpdated[index]) {
          //   log.orange("time comparison", "false");
          //   return;
          // } else {
          //   log.orange("time comparison", "true");
          // }

          // if (typeof whenUpdated[index] === "undefined") {
          //   log.orange("time comparison", "not updated");
          //   return;
          // }

          await set({
            key: [`allEditorsValues`, index],
            data: { value, updated: now() },
          });

          await set({
            key: ["allTabsDataExceptValues", index, "valueMD5"],
            data: md5(value),
          });
        }
      }
    }, 2000),
    [id]
  );

  useEffect(() => {
    pushValueSelectedTabIndex(selectedTabIndex, allEditorsValues[selectedTabIndex]);
  }, [allEditorsValues[selectedTabIndex]]);

  const pushValueIndexOnTheRight = useCallback(
    debounce(async (index, value) => {
      if (id) {
        if (typeof index === "string" && typeof value === "string" && value.trim()) {
          log.orange("firebase", `======> ${value}`);

          await set({
            key: [`allEditorsValues`, index],
            data: { value, updated: now() },
          });

          await set({
            key: ["allTabsDataExceptValues", index, "valueMD5"],
            data: md5(value),
          });
        }
      }
    }, 2000),
    [id]
  );

  useEffect(() => {
    pushValueIndexOnTheRight(indexOnTheRight, allEditorsValues[indexOnTheRight]);
  }, [allEditorsValues[indexOnTheRight]]);

  return (
    <div
      className={classnames({
        single: !Boolean(indexOnTheRight),
        on_the_right: Boolean(indexOnTheRight),
      })}
      tabIndex={0}
    >
      {createModal && ( // one modal for create mode
        <Modal title="Create tab" onClose={() => setCreateModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const lab = label.trim();
              if (lab) {
                const newList = [...allTabsDataExceptValues, generateDefaultTab({ label: lab })];
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
        {allTabsDataExceptValues.map(({ index: iterateIndex }) => {
          const wrap = Boolean(getAllTabsDataExceptValues(iterateIndex, "wrap"));

          const lang = getAllTabsDataExceptValues(iterateIndex, "lang");

          return (
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
                    value={lang}
                    onChange={(e) => {
                      setAllTabsDataExceptValues(iterateIndex, "lang", e.target.value);
                    }}
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
                    checked={wrap}
                    onChange={(e) => {
                      setAllTabsDataExceptValues(iterateIndex, "wrap", e.target.checked);
                    }}
                  />
                </label>
              </div>
              <Ace
                id={iterateIndex}
                content={allEditorsValues[iterateIndex] || ""}
                lang={lang}
                wrap={wrap}
                onChange={(data) => {
                  setValue(iterateIndex, data);
                }}
                onInit={(editor) => {
                  log(`editor mounted: `, iterateIndex);
                  if (iterateIndex === selectedTabIndex) {
                    bringFocus(selectedTabIndex); // focus on first load of all allTabsDataExceptValues
                  }
                }}
                recordOn={recordOn}
              />
            </div>
          );
        })}
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

  render(
    <>
      <LoadingComponent />
      <Main portal={portal} />
    </>,
    document.getElementById("app")
  );
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

function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

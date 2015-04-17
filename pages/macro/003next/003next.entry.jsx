import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { render, createPortal } from "react-dom";

import classnames from "classnames";

import { set, get } from "nlab/lcstorage";

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

import useQueue from "./useQueue.jsx";

import useStateFetcher from "./useStateFetcher.jsx";

import onBeforeUnloadHook from "./onBeforeUnloadHook.js";

import useIndexedDBPromised from "../../../libs/useIndexedDBPromised.jsx";

const lastRemotePullOfEditorContent = {};

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

  const indexeddb = useIndexedDBPromised(`aceeditor`, "objectstorage");

  const [conflict, setConflict] = useState(false);

  const [isPageFocused, setIsPageFocused] = useState(undefined);

  const [editIndex, setEditIndexDontUseDirectly] = useState(false);

  const [createModal, setCreateModalDontUseDirectly] = useState(false);

  const [label, setLabel] = useState(""); // copy of label for edit mode - for modal

  const [recordOn, setRecordOn] = useState(false);

  const [allEditorsValues, setAllEditorsValues] = useState({});

  const [localEditorHasNewChangesTimestamp, setLocalEditorHasNewChangesTimestampDontUseDirectly] = useState({});

  const [queue, getQueue] = useQueue();

  const [allTabsDataExceptValues, setAllTabsDataExceptValuesDontUseDirectly, getAllTabsDataExceptValuesFetcher] =
    useStateFetcher([]);

  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const editorsRefs = useRef({});

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

  onBeforeUnloadHook({
    block: Object.keys(localEditorHasNewChangesTimestamp).length > 0,
    message: "Content unsaved",
  });

  function setCreateModal(state) {
    setLabel("");

    setCreateModalDontUseDirectly(Boolean(state));

    setEditIndexDontUseDirectly(false);
  }

  function setLocalEditorHasNewChangesTimestamp(index, value) {
    setLocalEditorHasNewChangesTimestampDontUseDirectly((v) => {
      const t = { ...v, [index]: value };
      if (!value) {
        delete t[index];
      }

      return t;
    });
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
      const tab = allTabsDataExceptValues.find((t) => t.index === index);

      if (tab) {
        if (key) {
          return tab[key];
        }
      }
      return tab;
    } catch (e) {
      console.error(`getAllTabsDataExceptValues error: `, e);
    }
  }

  function setSelectedTab(index) {
    if (indexOnTheRight !== index) {
      setAllTabsDataExceptValues(index, "selectedTabIndexLatestDate", now());
      // setSelectedTabIndexRaw(index);

      queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
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

    setTimeout(() => {
      queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
    }, 500);
  }

  function deleteTab(index) {
    const newList = allTabsDataExceptValues.filter((t) => t.index != index);

    newList.forEach((r, i) => (r.zeroIndexOrderTab = i));

    setAllTabsDataExceptValuesDontUseDirectly(() => newList);

    setEditIndex(false);
  }

  async function syncEditorValueByIndex(
    label,
    index,
    allTabsDataExceptValues_freshRawRemoteResponseNotTransformed,
    allEditorsValues_currentValueOfEditorUnderIndex,
    indexeddb
  ) {
    log.orange("firebase", "syncEditorValueByIndex", label);

    const ll = (...args) => log(`syncEditorValueByIndex label>${label}< ::::`, ...args);

    const allEditorsValues_currentValueOfEditorUnderIndex_MD5 = md5(
      allEditorsValues_currentValueOfEditorUnderIndex || ""
    );

    // update opened tab:
    // ll("DEBUG", {
    //   index,
    //   "allTabsDataExceptValues_freshRawRemoteResponseNotTransformed[index]":
    //     allTabsDataExceptValues_freshRawRemoteResponseNotTransformed[index],
    //   allTabsDataExceptValues,
    //   allEditorsValues_currentValueOfEditorUnderIndex,
    //   allEditorsValues_currentValueOfEditorUnderIndex_MD5,
    // });

    if (!index) {
      ll(`no index given`);

      return;
    }

    if (!allTabsDataExceptValues_freshRawRemoteResponseNotTransformed[index]) {
      ll(
        `index>${index}< not found in remote allTabsDataExceptValues - simply put, tab is not found remotely, so can't save or download editor content`
      );

      return;
    }

    async function updateRemote() {
      if (typeof allEditorsValues_currentValueOfEditorUnderIndex === "string") {
        const n = now();

        lastRemotePullOfEditorContent[index] = n;

        await set({
          key: [`allEditorsValues`, index],
          data: { value: allEditorsValues_currentValueOfEditorUnderIndex, updated: n },
        });

        // indexeddb.update((entity) => {
        //   const tmp = structuredClone(entity);

        //   entity.name = entity.name + "_test";

        //   tmp.extra = "some extra stuff";

        //   delete tmp.age;

        //   return tmp;
        // }, id);
        indexeddb.set({
          key: `allEditorsValues/${index}`,
          data: allEditorsValues_currentValueOfEditorUnderIndex,
        });

        /**
         * Thats ok to only update it remotely because with next ctrl+s the first thing we do
         * is pull entire allTabsDataExceptValues
         */
        await set({
          key: ["allTabsDataExceptValues", index, "valueMD5"],
          data: allEditorsValues_currentValueOfEditorUnderIndex_MD5,
        });

        setLocalEditorHasNewChangesTimestamp(index, false);
      } else {
        ll("no allEditorsValues_currentValueOfEditorUnderIndex found to sent to firebase");
      }
    }

    /**
     * If there is no md5 saved remotely or is but it's different from md5 generated from my local editor content...
     */
    if (
      !allTabsDataExceptValues_freshRawRemoteResponseNotTransformed[index]?.valueMD5 ||
      allTabsDataExceptValues_freshRawRemoteResponseNotTransformed[index]?.valueMD5 !==
        allEditorsValues_currentValueOfEditorUnderIndex_MD5
    ) {
      // let's pull remote content, we have to check if update field is there and what is it's value
      // that will help us to think what to do next
      const freshRemoteEditorValueObject = await get(["allEditorsValues", index]);

      /**
       * if there were never any changes locally then the only thing we can do is just update editor locally from remote content
       * but from now on we will always can assume safely that there are some changes locally
       */
      if (!localEditorHasNewChangesTimestamp[index]) {
        ll(
          "no local edits so we can only take what we have pulled if anything exist -> if (freshRemoteEditorValueObject?.value)",
          {
            freshRemoteEditorValueObject,
          }
        );

        if (typeof freshRemoteEditorValueObject?.value === "string") {
          lastRemotePullOfEditorContent[index] = freshRemoteEditorValueObject.updated;

          editorsRefs.current[index].current.update = true;

          setValue(index, freshRemoteEditorValueObject.value, false);

          setTimeout(() => {
            if (editorsRefs.current[index].current.focus) {
              editorsRefs.current[index].current.update = false;
            }

            setLocalEditorHasNewChangesTimestamp(index, false);
          }, 50);

          indexeddb.set({
            key: `allEditorsValues/${index}`,
            data: freshRemoteEditorValueObject.value,
          });
        }

        return; // and that's the end for this condition
      }

      /**
       * If we have local change but there is no remote data for that editor
       * then the only thing we can do is push editor content
       */
      if (typeof freshRemoteEditorValueObject?.value !== "string") {
        ll(
          "no freshRemoteEditorValueObject?.updated, in that case the only thing we can do is just push what we have in our editor",
          {
            freshRemoteEditorValueObject,
          }
        );

        await updateRemote();

        return; // and that's the end for this condition
      }

      ll(
        `checking if there are local changes, because then I have to decide if updateLocal | updateRemote or report diffs`,
        {
          "localEditorHasNewChangesTimestamp[index]": localEditorHasNewChangesTimestamp[index],
          freshRemoteEditorValueObject,
        }
      );

      if (
        typeof lastRemotePullOfEditorContent[index] === "string" &&
        lastRemotePullOfEditorContent[index] === freshRemoteEditorValueObject.updated
      ) {
        ll(
          `editor content I last time pulled is the same as I pulled from remote - updating remote with latest local changes`
        );

        await updateRemote();

        return;
      }

      if (lastRemotePullOfEditorContent[index] > freshRemoteEditorValueObject.updated) {
        ll(`I had latest remote changes and now I have updated it locally and it's time to push it `);

        await updateRemote();
      } else {
        ll(
          `I didn't have latest changes (there is something newer pushed) and I have new local modification - CONFLICT - save local changes and reload page for latest remote changes`,
          {
            "lastRemotePullOfEditorContent[index]": lastRemotePullOfEditorContent[index],
            freshRemoteEditorValueObject,
          }
        );

        setConflict(true);
      }
    } else {
      log(`md5 the same remote and local`);
    }
  }

  async function syncAll() {
    loadingTrigger(1);

    try {
      const currentAllTabsMd5 = md5(JSON.stringify(allTabsDataExceptValues));

      const result = await get("allTabsDataExceptValues");

      log.orange(
        "firebase",
        "<------ syncAll result",
        "allTabsDataExceptValues: ",
        allTabsDataExceptValues,
        "result: ",
        result
      );

      const tabsTransformedArrayWithIndexProp = Object.entries(result || {}).reduce((acc, [index, obj]) => {
        const zeroIndexOrderTab = obj.zeroIndexOrderTab;

        acc[zeroIndexOrderTab] = {
          ...obj,
          index,
        };

        return acc;
      }, []);

      /**
       * if allTabsDataExceptValues changed in the meantime
       * then stop everything
       */
      if (md5(JSON.stringify(allTabsDataExceptValues)) !== currentAllTabsMd5) {
        log(`allTabsDataExceptValues have changed locally before I've pulled data from firebase`);

        return;
      }

      /**
       * if data that was pulled for allTabsDataExceptValues is really different than data component already have
       * only then change state, this way I'm reducing unecessary rerenders of main component
       */
      log({
        "md5(JSON.stringify(tabsTransformedArrayWithIndexProp)): ": md5(
          JSON.stringify(tabsTransformedArrayWithIndexProp)
        ),
        currentAllTabsMd5,
      });

      if (md5(JSON.stringify(tabsTransformedArrayWithIndexProp)) !== currentAllTabsMd5) {
        log("tabs update: setAllTabsDataExceptValuesDontUseDirectly:", tabsTransformedArrayWithIndexProp);

        setAllTabsDataExceptValuesDontUseDirectly(tabsTransformedArrayWithIndexProp);
      } else {
        log("tabs update: not tabsTransformedArrayWithIndexProp");
      }

      // updating selected tab:
      {
        const selectedTabIndex = findSelectedTabIndex(tabsTransformedArrayWithIndexProp);

        await syncEditorValueByIndex(
          "selectedTabIndex",
          selectedTabIndex,
          result,
          allEditorsValues[selectedTabIndex],
          indexeddb
        );
      }

      // updating selected indexOnTheRight tab:
      {
        const indexOnTheRight = findIndexOnTheRight(tabsTransformedArrayWithIndexProp);

        await syncEditorValueByIndex("indexOnTheRight", indexOnTheRight, result, allEditorsValues[indexOnTheRight]);
      }
    } catch (e) {
      log("syncAll error: ", e);
    }

    loadingTrigger(-1);
  }

  async function pushAllTabsDataExceptValues(given) {
    loadingTrigger(1);

    try {
      const tabsTransformedArrayWithIndexProp = (given || getAllTabsDataExceptValuesFetcher() || []).reduce(
        (acc, val, i) => {
          const { index, editor, ...rest } = val;

          acc[index] = { ...rest, zeroIndexOrderTab: i };

          return acc;
        },
        {}
      );

      await set({
        key: "allTabsDataExceptValues",
        data: tabsTransformedArrayWithIndexProp,
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

  function setValue(index, value, registerLocalEditorHasNewChangesTimestamp = true) {
    setAllEditorsValues((allEditorsValues) => {
      // if (
      //   typeof allEditorsValues[index] === "string" &&
      //   typeof value === "string" &&
      //   allEditorsValues[index] &&
      //   value &&
      //   allEditorsValues[index] !== value
      // ) {
      // }
      if (registerLocalEditorHasNewChangesTimestamp) {
        setLocalEditorHasNewChangesTimestamp(index, now());
      } else {
        setLocalEditorHasNewChangesTimestamp(index, false);
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
      if ((event.ctrlKey || event.metaKey) && event.key === "j") {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        log("ctrl+j");

        return;
      }

      // Check if the key combination matches Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        log("ctrl+k");

        return;
      }

      // Check if the key combination matches Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && ["s", "S"].includes(event.key)) {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        log("[ctrl|meta]+s");

        queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");

        return;
      }

      // Check if the key combination matches Ctrl+R or Cmd+R
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        // Prevent the default behavior (refreshing the page)
        event.preventDefault();

        play();
      } else {
        // event.preventDefault();
        log({
          "event.ctrlKey": event.ctrlKey,
          "event.metaKey": event.metaKey,
          "event.keyCode": event.keyCode,
          event,
        });
      }
    }

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, [id, allTabsDataExceptValues, allEditorsValues, indexeddb]);

  useEffect(() => {
    if (!id || !indexeddb) {
      return;
    }

    setIsPageFocused(document.hasFocus()); // https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus

    queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
  }, [id, indexeddb]);

  // useEffect(() => {
  //   if (!id) {
  //     return;
  //   }

  //   const u = unique();

  //   let handler;
  //   function focus() {
  //     log("focus", u);
  //     handler = setTimeout(() => {
  //       queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
  //     }, 2000);
  //   }

  //   window.addEventListener("focus", focus);

  //   function blur() {
  //     setTimeout(() => {
  //       log("blur", u);
  //       queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
  //     }, 100);
  //   }

  //   window.addEventListener("blur", blur);

  //   return () => {
  //     log("unfocus unblur", u);
  //     clearTimeout(handler);
  //     window.removeEventListener("focus", focus);
  //     window.removeEventListener("blur", blur);
  //   };
  // }, [id, allTabsDataExceptValues, allEditorsValues]);

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

  //     queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");

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
    // }, [md5(JSON.stringify(allTabsDataExceptValues))]); // TODO: not sure if I need to really generate md5 here , maybe just listening for allTabs... should be ok
  }, [allTabsDataExceptValues]);

  useEffect(() => {
    let handler;

    if (conflict) {
      handler = setTimeout(() => {
        setConflict(false);
      }, 1000);
    }

    return () => clearTimeout(handler);
  }, [conflict]);

  return (
    <div
      className={classnames({
        single: !Boolean(indexOnTheRight),
        on_the_right: Boolean(indexOnTheRight),
      })}
      tabIndex={0}
    >
      {conflict && <div className="conflict">conflict</div>}
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
          <a href="https://excalidraw.com">https://excalidraw.com</a>
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
                className="add"
              >
                +
              </div>
            </div>

            <div>
              <div
                onClick={() => {
                  queue(() => syncAll(), "dontAutoPullTabsAgainWhenItIsAlreadyOnTheEndOfTheQueue");
                }}
                className="sync"
              >
                sync
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
                  localEditorHasNewChangesTimestamp={localEditorHasNewChangesTimestamp}
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
                passRefToParent={(ref) => {
                  console.log("passRefToParent: ", iterateIndex, ref);
                  editorsRefs.current[iterateIndex] = ref;
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function SortableTabElement(props) {
  const {
    selectedTabIndex,
    label,
    iterateIndex,
    indexOnTheRight,
    setIndexOnTheRight,
    setSelectedTab,
    setEditIndex,
    localEditorHasNewChangesTimestamp,
  } = props;

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
        unsaved: localEditorHasNewChangesTimestamp[iterateIndex],
        bluetab: indexOnTheRight === iterateIndex,
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

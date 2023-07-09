import React, { useEffect, useState, useMemo, useCallback } from "react";

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

const setLocalStorage = debounce((...args) => {
  // console.log("debounce set", ...args);
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
  const [editIndex, setEditIndexDontUseDirectly] = useState(false);

  const [createModal, setCreateModalDontUseDirectly] = useState(false);
  const [label, setLabel] = useState("");

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

  // index key [string]
  // generateDefaultTab
  // editor instance of ace

  const [tabs, setTabsDontUseDirectly] = useState([
    { index: "one_indx", label: "one" },
    { index: "two_indx", label: "two" },
    { index: "three_indx", label: "three" },
  ]);

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
        single: !Boolean(indexOnTheRight),
        on_the_right: Boolean(indexOnTheRight),
      })}
      tabIndex={0}
    >
      {createModal && (
        <Modal title="Create tab" onClose={() => setCreateModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const lab = label.trim();
              if (lab) {
                setTabsDontUseDirectly((tabs) => [...tabs, { index: generateUniq(), label: lab }]);
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
      {editIndex &&
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
                console.log(`editor mounted: `, iterateIndex);
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

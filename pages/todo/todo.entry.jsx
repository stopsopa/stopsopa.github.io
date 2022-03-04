import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

import classnames from "classnames";

import nget from "nlab/get";

import nset from "nlab/set";

import useCustomState from "../useCustomState";

const section = "todo";

import isObject from "nlab/isObject";

import Textarea from "../../components/Textarea";

function processList(objList, completed) {
  let list = Object.entries(objList);

  if (typeof completed === "boolean") {
    list = list.filter(([id, v]) => {
      return Boolean(v.completed) === completed;
    });
  }

  list.reverse();

  list.sort(([_1, a], [_2, b]) => {
    if (Number.isInteger(a.sort) && Number.isInteger(b.sort)) {
      if (a.sort === b.sort) {
        return 0;
      }

      return a.sort < b.sort ? -1 : 1;
    }

    return 0;
  });

  return list;
}

const List = ({ completed = null, edit, list = {}, refreshList, setEdit }) => {
  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const arrList = processList(list, completed);

  return (
    <div className="list">
      {arrList.map(([id, v], i) => (
        <div
          key={id}
          className={classnames("row", {
            edit: edit.id === id,
            completed,
          })}
          onClick={() => setEdit(edit.id && edit.id === id ? {} : { ...v, id })}
        >
          <div>{v.title}</div>
          <div>
            <span>{v.created}</span>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await set({
                  key: id,
                  data: {
                    ...v,
                    completed: !v.completed,
                  },
                });
                await refreshList();
              }}
            >
              {completed ? "uncomplete" : "complete"}
            </button>
            {completed === false && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const sort = processList(list, false);

                  const [element] = sort.splice(i, 1);

                  sort.splice(i - 1, 0, element);

                  sort.forEach(([_, e], i) => (e.sort = i + 1));

                  await set({
                    data: {
                      ...list,
                    },
                  });

                  await refreshList();
                }}
                disabled={i === 0}
              >
                ⬆
              </button>
            )}
            {completed === false && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const sort = processList(list, false);

                  const [element] = sort.splice(i, 1);

                  sort.splice(i + 1, 0, element);

                  sort.forEach(([_, e], i) => (e.sort = i + 1));

                  await set({
                    data: {
                      ...list,
                    },
                  });

                  await refreshList();
                }}
                disabled={i === arrList.length - 1}
              >
                ⬇
              </button>
            )}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Delete "${v.title}"`)) {
                  edit.id === id && setEdit({});
                  await del(id);
                  await refreshList();
                }
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Main = () => {
  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const [list, setList] = useState({});

  const [edit, setEdit] = useState({});

  const refreshList = async function () {
    let list = (await get()) || {};

    setList(list);
  };

  useEffect(() => {
    if (id) {
      refreshList();
    }
  }, [id]);

  if (error) {
    return (
      <pre>
        {JSON.stringify(
          {
            error,
          },
          null,
          4
        )}
      </pre>
    );
  }

  if (!id) {
    return <div>Connecting to custom state...</div>;
  }

  const submit = async () => {
    if (typeof edit.title !== "string" || !edit.title.trim()) {
      return;
    }

    if (edit.id) {
      const { id, ...data } = edit;

      await set({
        key: edit.id,
        data,
      });
    } else {
      await push({
        data: {
          ...edit,
          created: new Date().toISOString().substring(0, 19).replace("T", " "),
        },
      });
    }

    setEdit({});

    await refreshList();
  };

  return (
    <div>
      <h4>Todo:</h4>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input type="text" onChange={(e) => setEdit({ ...edit, title: e.target.value })} value={edit.title || ""} />
        <br />
        <Textarea onChange={(e) => setEdit({ ...edit, description: e.target.value })} value={edit.description || ""} correct={-4} />
        <br />
        <button type="submit" disabled={typeof edit.title !== "string" || !edit.title.trim()}>
          {edit.id ? "edit" : "create"}
        </button>
      </form>
      <h4>Todo:</h4>
      <List edit={edit} list={list} completed={false} refreshList={refreshList} setEdit={setEdit} />
      <h4>Completed:</h4>
      <List edit={edit} list={list} completed={true} refreshList={refreshList} setEdit={setEdit} />
    </div>
  );
};

render(<Main />, document.getElementById("app"));

import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

import useCustomState from "../useCustomState";

const section = "test";

import isObject from "nlab/isObject";

const Main = () => {
  const [groupslist, setGroupslist] = useState(false);

  const [groupname, setGroupnameRaw] = useState("");

  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const refreshGroupList = async function () {
    let list = await get(`groupslist`);

    setGroupslist(list);
  };

  useEffect(() => {
    if (id) {
      refreshGroupList();
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

  const setGroupname = (name) => {
    if (typeof name === "string") {
      name = name.trim();
    }

    setGroupnameRaw(name);
  };

  return (
    <div>
      <h4>Add group:</h4>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          let list = [];

          if (isObject(groupslist)) {
            list = Object.keys(groupslist).map((key) => groupslist[key].groupname.toLowerCase());
          }

          if (groupname) {
            if (list.includes(groupname.toLowerCase())) {
              return alert(`group by name '${groupname}' already exist`);
            }

            await push({
              key: `groupslist`,
              data: {
                groupname,
              },
            });

            setGroupname("");

            await refreshGroupList();
          }
        }}
      >
        <label>
          name:
          <input type="text" value={groupname} onChange={(e) => setGroupname(e.target.value)} /> {groupname}
        </label>
        <br />
        <button type="submit">add</button>
      </form>
      <br />
      groups:
      <br />
      {/*<pre>{JSON.stringify(groupslist, null, 4)}</pre>*/}
      <ul>
        {isObject(groupslist) &&
          Object.keys(groupslist).map((key) => {
            const g = groupslist[key];

            return (
              <li key={key} data-key={key}>
                {g.groupname}{" "}
                <button
                  onClick={async (e) => {
                    await del(`groupslist/${key}`);

                    await refreshGroupList();
                  }}
                >
                  del
                </button>
              </li>
            );
          })}
      </ul>
      <hr />
    </div>
  );
};

render(<Main />, document.getElementById("app"));

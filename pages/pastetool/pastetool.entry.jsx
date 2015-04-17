import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

import useCustomState from "../useCustomState.js";

import Textarea from "../../components/Textarea.js";

const section = "pastetool";

const Wrapper = ({
  error,
  id,
  set,
  get,
  del,
  push,

  ckey,
  children,
  refreshList,
}) => (
  <div>
    <table>
      <tbody>
        <tr>
          <td valign="top">
            <button
              onClick={async () => {
                await del(`list/${ckey}`);

                await refreshList();
              }}
            >
              🗑️
            </button>
          </td>
          <td>{children}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

function unique(pattern) {
  // node.js require('crypto').randomBytes(16).toString('hex');
  pattern || (pattern = "xyxyxy");
  return pattern.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const Main = () => {
  const [list, setList] = useState(false);

  const { error, id, set, get, del, push, reCreateSession, signOut } = useCustomState({
    section,
  });

  async function testPush() {
    await push({
      key: `list`,
      data: {
        mime: "string",
        data: "example data",
      },
    });

    await refreshList();
  }

  async function testSet() {
    await set({
      key: ["list", "testdata_remove_later"],
      data: {
        mime: "string",
        data: `test-data_remove later ${unique()}`,
      },
    });

    await refreshList();
  }

  async function testGet() {
    const data = await get("testdata_remove_later");

    console.log("data: ", data);

    await refreshList();
  }

  const refreshList = async function (nomore) {
    let list = await get(`list`);

    if (!list && !nomore) {
      await testSet();

      location.href = location.href;
    }

    console.log("list", list);

    setList(list);
  };

  useEffect(() => {
    if (id) {
      refreshList();

      document.onpaste = async function (event) {
        const clipboardData = event.clipboardData || event.originalEvent.clipboardData;

        var items = clipboardData.items;

        let type = "string";

        for (let index in items) {
          var item = items[index];

          if (item.kind === "file") {
            type = "file";

            break;
          }
        }

        for (let index in items) {
          var item = items[index];

          log(
            `t: ${typeof index} index >${index}<`,
            items[index].kind,
            "file: ",
            items[index].kind === "file",
            "index == 1",
            index == 1
          );

          if (typeof item.kind === "string") {
            if (type === "string") {
              await push({
                key: `list`,
                data: {
                  mime: "string",
                  data: clipboardData.getData("text/plain"),
                },
              });

              await refreshList();

              break;
            }

            if (type === "file") {
              try {
                var blob = item.getAsFile();

                var reader = new FileReader();

                reader.onload = async function (event) {
                  reader.onload = () => {};

                  await push({
                    key: `list`,
                    data: {
                      mime: "img",
                      data: event.target.result,
                    },
                  });

                  await refreshList();
                };

                reader.readAsDataURL(blob);

                break;
              } catch (e) {
                log("processing file error: ", e);
              }
            }
          }
        }
      };
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

  if (!list) {
    return <div>Loading stored data...</div>;
  }

  return (
    <>
      <button onClick={signOut}>signOut</button>
      <button onClick={reCreateSession}>reCreateSession</button>
      <button onClick={refreshList}>refreshList</button>
      <button onClick={testSet}>testSet</button>
      <button onClick={testGet}>testGet</button>
      <button onClick={testPush}>testPush</button>
      <hr />
      {(function (list) {
        list.reverse();

        return list.map(([key, { data, mime }]) => {
          if (mime === "string") {
            return (
              <Wrapper
                {...{
                  error,
                  id,
                  set,
                  get,
                  del,
                  push,
                  refreshList,
                  key,
                  ckey: key,
                }}
              >
                <Textarea value={data || ""} onClick={(e) => e.target.select()} />
              </Wrapper>
            );
          }
          if (mime === "img") {
            return (
              <Wrapper
                {...{
                  error,
                  id,
                  set,
                  get,
                  del,
                  push,
                  refreshList,
                  key,
                  ckey: key,
                }}
              >
                <img src={data} />
              </Wrapper>
            );
          }
        });
      })(Object.entries(list))}
    </>
  );
};

render(<Main />, document.getElementById("app"));

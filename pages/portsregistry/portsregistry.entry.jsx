import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

import classnames from "classnames";

import nget from "nlab/get";

import nset from "nlab/set";

import useCustomState from "../useCustomState";

const section = "portsregistry";

import isObject from "nlab/isObject";

const generatePort = require("./generatePort");

const generate = generatePort();

generate.addList(require("./lists/ports-generated.json"));

window.generate = generate;

const Main = () => {
  const [ports, setPortsList] = useState(false);

  const defaultInput = () => ({
    port: String(generate()),
    description: "",
  });

  const [extendAll, setExtendAll] = useState(false);

  const [input, setInputRaw] = useState(defaultInput());

  const [expanded, setExpanded] = useState([]);

  const [firstLoad, setFirstLoad] = useState(true);

  const setInput = (key, value) => {
    setInputRaw(nset({ ...input }, key, value));
  };

  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const refreshPortsList = async function () {
    let list = await get(`ports`);

    if (firstLoad) {
      setFirstLoad(false);

      generate.addList(
        Object.entries(list).reduce((acc, [key, value]) => {
          if (value.port) {
            acc.push(value.port);
          }

          return acc;
        }, [])
      );
    }

    setPortsList(list);
  };

  useEffect(() => {
    if (id) {
      refreshPortsList();
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
    const foundNegative = Object.values(input).find((v) => !Boolean(v)) !== undefined;

    const save = !foundNegative;

    if (save && /^\d+$/.test(input.port)) {
      if (Object.values(ports || {}).find((o) => o.port === input.port)) {
        return alert(`port '${input.port}' is already registered`);
      }

      if (!generate.isFree(input.port)) {
        return alert(`port '${input.port}' is already reserved`);
      }

      input.created_at = new Date().toISOString().substring(0, 19).replace("T", " ");

      await push({
        key: `ports`,
        data: input,
      });

      generate.addList([input.port]);

      setInputRaw(defaultInput());

      await refreshPortsList();
    }
  };

  let cls = undefined;

  if (input.port && input.port.trim().length > 0) {
    cls = generate.isFree(input.port) ? "green" : "red";
  }

  return (
    <div>
      <h4>Add port:</h4>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          submit();
        }}
      >
        <table>
          <tbody>
            <tr>
              <td>port:</td>
              <td>
                <input type="text" value={input.port || ""} onChange={(e) => setInput("port", e.target.value)} className={cls} />
              </td>
              <td>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    let current;
                    if (/^\d+$/.test(String(input.port))) {
                      current = generate(parseInt(input.port, 10) + 1);
                    } else {
                      current = generate();
                    }
                    setInput("port", String(current));
                  }}
                >
                  next
                </button>
              </td>
            </tr>
            <tr>
              <td>description:</td>
              <td colSpan={2}>
                <textarea value={input.description || ""} onChange={(e) => setInput("description", e.target.value)} />
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <button type="submit">add</button>
      </form>
      <br />

      <button onClick={() => setExtendAll(!extendAll)}>{extendAll ? "Collapse" : "Expand"} all</button>

      <br />
      <table className="list" border="0">
        <tbody>
          {isObject(ports) &&
            (function (list) {
              list.sort((a, b) => {
                if (a.created_at === b.created_at) {
                  return 0;
                }
                return a.created_at > b.created_at ? 1 : -1;
              });

              return list.reverse().map((g) => (
                <tr key={g.key} data-key={g.key}>
                  <td valign="top">
                    <span className="date">{g.created_at}</span>
                  </td>
                  <td valign="top">
                    <span className="port">{g.port}</span>
                  </td>
                  <td valign="top">
                    <button
                      onClick={async (e) => {
                        if (confirm("Delete?")) {
                          await del(`ports/${g.key}`);

                          await refreshPortsList();
                        }
                      }}
                    >
                      del
                    </button>
                  </td>
                  {(function (d) {
                    if (extendAll) {
                      return <td>{d}</td>;
                    }
                    if (d.length > 50 && !expanded.includes(g.key)) {
                      return (
                        <td>
                          {d.substring(0, 50)}{" "}
                          <button
                            onClick={() =>
                              setExpanded(
                                (function (d) {
                                  d.push(g.key);
                                  return d;
                                })([...expanded])
                              )
                            }
                          >
                            ...
                          </button>
                        </td>
                      );
                    }
                    return <td>{d}</td>;
                  })(g.description)}
                </tr>
              ));
            })(
              Object.entries(ports).reduce((acc, [key, value]) => {
                acc.push({
                  key,
                  ...value,
                });

                return acc;
              }, [])
            )}
        </tbody>
      </table>

      <hr />
    </div>
  );
};

render(<Main />, document.getElementById("app"));

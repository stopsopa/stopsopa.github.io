/**
 * Playground demonstrating every part of the universal interface from pages/useCustomState.ts:
 *
 *   ready, error, username, userId, get, set, push, del, signIn, signOut   (+ `section` option)
 *
 * Purpose:
 * - reference of how a component should consume useCustomState (nothing here is specific to firebase)
 * - manual test bench when the underlying implementation is changed in pages/useCustomState.ts -
 *   if everything on this page still works then other apps should work too
 *
 * How it works:
 * 1. status panel is rendered always - shows lifecycle: ready false -> (authentication) -> true -> signOut -> false
 * 2. when ready: form with "key" and "data" + buttons calling get/set/push/del
 * 3. every call lands in the log with exact code of the call and with what it returned
 * 4. after every call the whole section is fetched again (get() without key) and rendered as a tree
 *
 * All data lands under section "custom_state_demo", so it can't damage data of other apps.
 */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import useCustomState from "../../useCustomState";
import type { StateKey } from "../../useCustomState";
import "./custom_state.entry.css";

const section = "custom_state_demo";

interface DemoTodo {
  text: string;
  done: boolean;
}

/**
 * Type of the whole tree stored in the section - passed to useCustomState<DemoState>().
 * get/set/push are typed from it by the key, see typedExample() below.
 *
 * Index signature is here only because this playground accepts any key typed into the form -
 * normal page/service shouldn't have it, describe exactly what you store.
 */
interface DemoState {
  todos?: Record<string, DemoTodo>;
  settings?: { ui?: { theme?: string } };
  [key: string]: any;
}

interface LogEntry {
  time: string;
  call: string;
  result?: any;
  error?: string;
}

// presets filling the form, to show typical shapes of key and data
const presets: { label: string; key: string; data: string }[] = [
  { label: "collection item", key: "todos", data: `{"text": "Buy bread", "done": false}` },
  { label: "nested key", key: "settings/ui/theme", data: `"dark"` },
  { label: "root of the section", key: "", data: `{"hello": "world"}` },
];

const json = (value: any) => JSON.stringify(value, null, 4);

const Main = () => {
  const { ready, error, username, userId, get, set, push, del, signIn, signOut } = useCustomState<DemoState>({
    section,
  });

  /**
   * Demonstrates typing by the key (keys known in compile time) - hover over variables in the editor.
   * The form below uses keys known only in runtime, so there everything is `any`.
   */
  const typedExample = async () => {
    // data has to be DemoTodo, returns generated key
    const id = await push({ key: "todos", data: { text: "typed todo", done: false } });

    // DemoTodo | null
    const todo = await get(`todos/${id}`);

    if (todo) {
      // array form of the key, data has to be DemoTodo
      await set({ key: ["todos", id], data: { ...todo, done: !todo.done } });
    }

    // Record<string, DemoTodo> | undefined | null
    return get("todos");
  };

  const [keyText, setKeyText] = useState("todos");

  const [asArray, setAsArray] = useState(false);

  const [dataText, setDataText] = useState(presets[0].data);

  const [tree, setTree] = useState<any>(undefined);

  const [log, setLog] = useState<LogEntry[]>([]);

  /**
   * Key from the form in the shape which goes to the interface:
   * empty -> undefined (root of the section)
   * "a/b" -> "a/b" or ["a", "b"] (both forms are equal, checkbox decides which one is sent)
   */
  const buildKey = (): StateKey | undefined => {
    const trimmed = keyText.trim();

    if (trimmed === "") {
      return undefined;
    }

    if (asArray) {
      return trimmed.split("/").filter(Boolean);
    }

    return trimmed;
  };

  const addLog = (entry: Omit<LogEntry, "time">) => {
    setLog((list) => [{ time: new Date().toISOString().substring(11, 23), ...entry }, ...list]);
  };

  const refreshTree = async () => {
    setTree(await get());
  };

  /**
   * Executes one call of the interface, logs it and refreshes the tree
   */
  const run = async (call: string, fn: () => Promise<any>, refresh = true) => {
    try {
      const result = await fn();

      addLog({ call, result });
    } catch (e: any) {
      addLog({ call, error: String(e?.message || e) });
    }

    if (refresh) {
      try {
        await refreshTree();
      } catch (e: any) {
        addLog({ call: "get()", error: String(e?.message || e) });
      }
    }
  };

  /**
   * Parses "data" field of the form, returns { ok: false } when it is not valid json
   */
  const parseData = (): { ok: boolean; data?: any } => {
    try {
      return { ok: true, data: JSON.parse(dataText) };
    } catch (e: any) {
      addLog({ call: "JSON.parse(data)", error: String(e?.message || e) });

      return { ok: false };
    }
  };

  // Ready gate: touch the data only when interface says it is ready
  useEffect(() => {
    if (ready) {
      refreshTree();
    } else {
      setTree(undefined);
    }
  }, [ready]);

  const key = buildKey();

  const keyCode = key === undefined ? "" : JSON.stringify(key);

  return (
    <div className="cs-demo gcp-css">
      <h1>useCustomState demo</h1>

      <section data-testid="status-panel">
        <h2>status</h2>
        <table>
          <tbody>
            <tr>
              <td>section</td>
              <td data-testid="status-section">{section}</td>
              <td>option of the hook - root of the tree for this app, all keys are relative to it</td>
            </tr>
            <tr>
              <td>ready</td>
              <td data-testid="status-ready" className={ready ? "cs-yes" : "cs-no"}>
                {String(ready)}
              </td>
              <td>false during authentication and after signOut(), true when methods can be used</td>
            </tr>
            <tr>
              <td>username</td>
              <td data-testid="status-username">{String(username)}</td>
              <td>human readable name of the user, undefined when not ready</td>
            </tr>
            <tr>
              <td>userId</td>
              <td data-testid="status-userid">{String(userId)}</td>
              <td>stable unique id of the user, undefined when not ready</td>
            </tr>
            <tr>
              <td>error</td>
              <td data-testid="status-error" className={error ? "cs-no" : ""}>
                <pre>{json(error)}</pre>
              </td>
              <td>false when there is no error</td>
            </tr>
          </tbody>
        </table>
        <div className="cs-buttons">
          <button type="button" onClick={() => run("signIn()", signIn, false)} data-testid="button-signin">
            signIn()
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => run("signOut()", signOut, false)}
            data-testid="button-signout"
          >
            signOut()
          </button>
        </div>
      </section>

      {ready ? (
        <>
          <section data-testid="operations-panel">
            <h2>operations</h2>
            <div className="cs-buttons">
              <span>presets:</span>
              {presets.map((preset, i) => (
                <button
                  type="button"
                  className="secondary"
                  key={preset.label}
                  onClick={() => {
                    setKeyText(preset.key);
                    setDataText(preset.data);
                  }}
                  data-testid={`button-preset-${i}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* gcp-css: control first, label directly after it, placeholder must not be empty */}
            <div className="input-wrapper">
              <input
                type="text"
                id="cs-key"
                placeholder=" "
                aria-describedby="cs-key-helper"
                value={keyText}
                onChange={(e) => setKeyText(e.target.value)}
                data-testid="input-key"
              />
              <label htmlFor="cs-key">key</label>
              <div className="helper-text" id="cs-key-helper">
                segments separated with "/", empty = root of the section
              </div>
            </div>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="cs-key-as-array"
                checked={asArray}
                onChange={(e) => setAsArray(e.target.checked)}
                data-testid="checkbox-key-as-array"
              />
              <label htmlFor="cs-key-as-array">send key as array</label>
              <div className="helper-text">
                the same effect, just another form: <code>{keyCode || "undefined"}</code>
              </div>
            </div>
            <div className="input-wrapper">
              <textarea
                id="cs-data"
                placeholder=" "
                aria-describedby="cs-data-helper"
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
                rows={5}
                data-testid="textarea-data"
              />
              <label htmlFor="cs-data">data (json)</label>
              <div className="helper-text" id="cs-data-helper">
                used by set and push
              </div>
            </div>
            <div className="cs-buttons">
              <button type="button" onClick={() => run(`get(${keyCode})`, () => get(key))} data-testid="button-get">
                get
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseData();

                  if (parsed.ok) {
                    run(`set({ key: ${keyCode || "undefined"}, data: ${JSON.stringify(parsed.data)} })`, () =>
                      set({ key, data: parsed.data })
                    );
                  }
                }}
                data-testid="button-set"
              >
                set
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseData();

                  if (parsed.ok) {
                    run(`push({ key: ${keyCode || "undefined"}, data: ${JSON.stringify(parsed.data)} })`, () =>
                      push({ key, data: parsed.data })
                    );
                  }
                }}
                data-testid="button-push"
              >
                push
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => run(`del(${keyCode})`, () => del(key))}
                data-testid="button-del"
              >
                del
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => run("typedExample() /* push + get + set + get, all typed by key */", typedExample)}
                data-testid="button-typed-example"
              >
                typed example
              </button>
            </div>
            <ul>
              <li>get - returns value or whole subtree from under the key (null when nothing there)</li>
              <li>set - overwrites everything under the key with data</li>
              <li>push - adds data as new child of the key, returns generated key of that child</li>
              <li>del - removes the key with whole subtree</li>
            </ul>
          </section>

          <section data-testid="tree-panel">
            <h2 className="cs-heading">
              whole section - get()
              <button
                type="button"
                className="secondary"
                onClick={() => run("get()", () => get())}
                data-testid="button-refresh-tree"
              >
                refresh
              </button>
            </h2>
            <pre data-testid="tree">{json(tree)}</pre>
          </section>
        </>
      ) : (
        <section data-testid="connecting-screen">
          <h2>not ready</h2>
          <div>Authentication in progress or signed out. Methods get/set/push/del are locked until ready: true.</div>
        </section>
      )}

      <section data-testid="log-panel">
        <h2 className="cs-heading">
          log of calls
          <button type="button" className="secondary" onClick={() => setLog([])} data-testid="button-clear-log">
            clear
          </button>
        </h2>
        {log.map((entry, i) => (
          <div key={`${entry.time}-${i}`} className="cs-log-entry" data-testid="log-entry">
            <div>
              <span>{entry.time}</span> <code>await {entry.call}</code>
            </div>
            {entry.error === undefined ? (
              <pre>returned: {entry.result === undefined ? "undefined" : json(entry.result)}</pre>
            ) : (
              <pre className="cs-no">error: {entry.error}</pre>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(<Main />);

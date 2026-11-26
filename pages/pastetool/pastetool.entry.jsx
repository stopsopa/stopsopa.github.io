import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

import useCustomState from "../useCustomState.ts";

import CustomStateGate from "../CustomStateGate.tsx";

import Textarea from "../../components/Textarea.js";

// layout only - controls, buttons and links are styled by /css/gcp-css.css (class gcp-css, see gcp-css skill)
import "./pastetool.entry.css";

const section = "pastetool";

/**
 * Type of the whole tree stored in section "pastetool" (S of useCustomState<S>, see pages/useCustomState.ts)
 * @typedef {{ mime: "string" | "img", data: string }} PasteEntry
 * @typedef {{ list?: Record<string, PasteEntry> }} PasteToolState
 */

/**
 * Card of one pasted item: content (children) on the left, actions on the right.
 * text - when given (string items) "copy" button is rendered and copies it to the clipboard
 */
const Wrapper = ({
  del,

  ckey,
  text,
  children,
  refreshList,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="pt-item" data-testid={`item-${ckey}`}>
      <div className="pt-content">{children}</div>
      <div className="pt-actions">
        {typeof text === "string" && (
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(text);

              setCopied(true);

              setTimeout(() => setCopied(false), 1500);
            }}
            data-testid={`button-copy-${ckey}`}
          >
            {copied ? "copied" : "copy"}
          </button>
        )}
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            await del(`list/${ckey}`);

            await refreshList();
          }}
          data-testid={`button-delete-${ckey}`}
        >
          delete
        </button>
      </div>
    </div>
  );
};

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

  /** @type {import("../useCustomState.ts").UseCustomStateReturn<PasteToolState>} */
  const { error, ready, set, get, del, push, signIn, signOut } = useCustomState({
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
    if (ready) {
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
  }, [ready]);

  if (error || !ready) {
    return <CustomStateGate ready={ready} error={error} signIn={signIn} />;
  }

  if (!list) {
    return <div>Loading stored data...</div>;
  }

  return (
    <div className="pt-app gcp-css">
      <div className="pt-card">
        <h2>Paste tool</h2>
        <p>Paste (CMD + V) anywhere on this page - text or image from the clipboard is stored and listed below.</p>
        <div className="pt-buttons">
          <button type="button" onClick={refreshList} data-testid="button-refresh">
            refresh list
          </button>
          <button type="button" className="secondary" onClick={signOut} data-testid="button-signout">
            sign out
          </button>
          <button type="button" className="secondary" onClick={signIn} data-testid="button-signin">
            sign in
          </button>
        </div>
        <div className="pt-buttons">
          <span className="pt-debug-label">debug:</span>
          <button type="button" className="secondary" onClick={testSet} data-testid="button-test-set">
            testSet
          </button>
          <button type="button" className="secondary" onClick={testGet} data-testid="button-test-get">
            testGet
          </button>
          <button type="button" className="secondary" onClick={testPush} data-testid="button-test-push">
            testPush
          </button>
        </div>
      </div>

      {(function (list) {
        list.reverse();

        return list.map(([key, { data, mime }]) => {
          if (mime === "string") {
            return (
              <Wrapper
                {...{
                  del,
                  refreshList,
                  key,
                  ckey: key,
                  text: data || "",
                }}
              >
                {/* gcp-css: control first, label directly after it, placeholder must not be empty */}
                <div className="input-wrapper">
                  <Textarea
                    id={`pt-text-${key}`}
                    placeholder=" "
                    readOnly
                    correct={2}
                    value={data || ""}
                    onClick={(e) => e.target.select()}
                    data-testid={`textarea-${key}`}
                  />
                  <label htmlFor={`pt-text-${key}`}>text</label>
                </div>
              </Wrapper>
            );
          }
          if (mime === "img") {
            return (
              <Wrapper
                {...{
                  del,
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
    </div>
  );
};

render(<Main />, document.getElementById("app"));

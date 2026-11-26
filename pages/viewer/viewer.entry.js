import React, { useEffect, useState, useRef } from "react";

import { createRoot } from "react-dom/client";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../macro/Ace.jsx";

const mimesMap = {
  "text/yaml": "yaml",
  "text/html": "html",
  "application/javascript": "javascript",
  "text/css": "css",
  "text/markdown": "markdown",
  "application/x-sh": "sh",
  "application/json": "json",
  "application/node": "javascript",
  "text/javascript": "javascript",
  "application/octet-stream": "python",
  "image/svg+xml": "svg",
  "text/jsx": "javascript",
  "text/tsx": "typescript",
  "video/mp2t": "typescript", // check online using path to file pages/typescript/node/lib.ts
  "text/x-scss": "scss",
  "application/xml": "xml",
};

const mimes = structuredClone(mimesMap);

Object.keys(mimesMap).forEach((k) => {
  mimes[k.toLowerCase()] = mimesMap[k];
  mimes[k.toLowerCase().split(";")[0]] = mimesMap[k];
});

function Viewer() {
  const zz = "urlw" + "izzard.schema://url" + "wizzard.hostnegotiated";

  function getFile() {
    return new URL(window.location.href).searchParams.get("file") || "";
  }

  const [file, setFileRaw] = useState(getFile());

  function setFile(value) {
    setFileRaw(decodeURIComponent(value));
  }

  /**
   * Selected tab of markdown mode is kept in the url:
   *   /viewer.html?file=...             - "rendered" (default, no extra parameter)
   *   /viewer.html?file=...&tab=source  - "source"
   */
  function getTab() {
    if (new URL(window.location.href).searchParams.get("tab") === "source") {
      return "source";
    }

    return "rendered";
  }

  const [tab, setTab] = useState(getTab());

  const [ace, setAceRaw] = useState({});

  function setAce(value, mime, more) {
    if (typeof mime !== "string") {
      mime = "text";
    }

    setAceRaw({
      value,
      mime,
      ...more,
    });
  }

  function onSubmit(e, customFile, dontPush) {
    if (e) {
      e.preventDefault();
    }

    if (!customFile) {
      customFile = file;
    }

    (async function () {
      try {
        const changed = `${location.pathname}?file=${encodeURIComponent(customFile)}`;

        let res = await fetch(customFile, {
          method: "HEAD",
        });

        const headers = {};

        res.headers.forEach((value, key) => (headers[key] = value));

        const rawContentTypeHeader = headers["content-type"];

        const contentTypeForAceFromMap = mimes[rawContentTypeHeader.toLowerCase().split(";")[0]];

        if (res.status !== 200) {
          setAce(
            JSON.stringify(
              {
                status: res.status,
                headers,
              },
              null,
              4
            ),
            undefined,
            {
              header: rawContentTypeHeader,
            }
          );

          return;
        }

        setAce("Loading...");

        if (!dontPush) {
          window.history.pushState({}, "", changed);

          // new file submitted by user - back to default tab (url in 'changed' has no &tab=...)
          setTab("rendered");
        }

        res = await fetch(customFile);

        const text = await res.text();

        setAce(text, contentTypeForAceFromMap, {
          header: rawContentTypeHeader,
          file: customFile, // really loaded file (state 'file' changes on every keystroke) - used as src of <zero-md>
        });
      } catch (e) {
        setAce(
          JSON.stringify(
            {
              error: "main catch",
              catch: String(e),
            },
            null,
            4
          )
        );
      }
    })();
  }

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = e.target;

      if (target.tagName.toLowerCase() === "input" && target.hasAttribute("readOnly")) {
        target.select();
      }
    });

    window.addEventListener("popstate", function (event) {
      const file = getFile();

      setFile(file);

      setTab(getTab());

      onSubmit(null, file, true);
    });

    onSubmit(null, file, true);
  }, []);

  /**
   * Markdown mode: when loaded file is markdown we render vanilla-tabs:
   *   tab 1 - markdown rendered by <zero-md> (the same library as in pages/services/encryptor)
   *   tab 2 - raw source in ACE editor (as for any other file)
   * More in viewer.entry.md
   *
   * Tabs markup is rendered always (also for not markdown files) - only buttons are hidden by css ([data-md="0"])
   * and "source" tab is forced. This way <Ace> is never unmounted (unmounting and mounting it again on every
   * loaded file is fragile and pointless).
   */
  const isMarkdown = ace.mime === "markdown";

  const tabsRef = useRef(null);

  /**
   * Tabs are added to the DOM after github.js finished its init, so nothing activates initial tab for us.
   * We do it manually. allLoaded.push() runs callback immediately when github.js is already initialised.
   * markdown -> open tab from state 'tab' ("rendered" - 0, "source" - 1), anything else -> "source" tab (1)
   */
  useEffect(() => {
    window.allLoaded = window.allLoaded || [];

    window.allLoaded.push(() => {
      if (tabsRef.current) {
        const index = isMarkdown && tab === "rendered" ? 0 : 1;

        window.vanillaTabs.activeByIndex(tabsRef.current, index, {
          onChange: ({ index }) => {
            // ACE created in hidden tab has no dimensions - resize event makes it recalculate when tab is shown
            window.dispatchEvent(new Event("resize"));

            /**
             * Memorise clicked tab in the url (replaceState - switching tabs doesn't create history entries).
             * Only for markdown - for other files "source" tab is forced and it is not user's choice.
             */
            if (isMarkdown) {
              const clicked = index === 1 ? "source" : "rendered";

              window.history.replaceState(
                {},
                "",
                `${location.pathname}?file=${encodeURIComponent(getFile())}${clicked === "source" ? "&tab=source" : ""}`
              );

              setTab(clicked);
            }
          },
        });
      }
    });
  }, [isMarkdown, tab]);

  // appended to all generated links with ?file=... below
  const tabSuffix = isMarkdown && tab === "source" ? "&tab=source" : "";

  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="search" onChange={(e) => setFile(e.target.value)} value={file} />
      </form>

      <br />

      <label>
        <span>href:</span>
        <input
          type="search"
          readOnly
          value={`${location.protocol}//${location.host}${location.pathname}?file=${encodeURIComponent(file)}${tabSuffix}`}
        />
      </label>

      <label>
        <span>pathname + search:</span>
        <input type="search" readOnly value={`${location.pathname}?file=${encodeURIComponent(file)}${tabSuffix}`} />
      </label>

      <label>
        <span>zz + href:</span>
        <input
          type="search"
          readOnly
          value={`${zz}${location.pathname}?file=${encodeURIComponent(file)}${tabSuffix}`}
          style={{ color: "green" }}
        />
      </label>

      <label>
        <span>zz + file:</span>
        <input type="search" readOnly value={`${zz}${file}`} style={{ color: "red" }} />
      </label>

      <label>
        <span>download</span>
        <a href={file} download>
          {file}
        </a>
      </label>

      <div
        data-vanilla-tabs
        data-md={isMarkdown ? "1" : "0"}
        ref={tabsRef}
        style={{ "--background-color": "white" }}
        data-testid="viewer-md-tabs"
      >
        <div data-buttons>
          <span data-testid="viewer-md-tab-rendered">rendered</span>
          <span data-testid="viewer-md-tab-source">source</span>
        </div>
        <div data-tabs>
          <div>
            {isMarkdown && (
              <div className="zero-md-container" data-testid="viewer-md-rendered">
                <zero-md key={ace.file} src={ace.file}></zero-md>
              </div>
            )}
          </div>
          <div>
            <Ace content={ace.value || ""} lang={ace.mime || "text"} />
          </div>
        </div>
      </div>

      <h3>extracted meta</h3>

      <Ace
        content={(function ({ value, ...rest }) {
          return JSON.stringify(
            {
              ...rest,
              mimes,
            },
            null,
            4
          );
        })(ace)}
        lang="json"
      />
      <br />
      <br />
    </>
  );
}

const container = document.getElementById("root");

const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(<Viewer />);

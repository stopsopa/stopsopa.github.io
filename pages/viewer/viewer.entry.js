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

/**
 * Names of tabs in the order of buttons/panels in the DOM (index in this array = index for vanilla-tabs).
 * All three are always in the DOM, for not markdown files button "rendered" is hidden by css.
 * More in viewer.entry.md
 */
const tabsOrder = ["rendered", "source", "meta", "links"];

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
   * Selected tab is kept in the url. First visible tab is default and has no parameter:
   *   markdown file:
   *     /viewer.html?file=...      - "rendered" (default)
   *     /viewer.html?file=...&t=s  - "source"
   *     /viewer.html?file=...&t=m  - "meta"
   *     /viewer.html?file=...&t=l  - "links"
   *   any other file:
   *     /viewer.html?file=...      - "source" (default)
   *     /viewer.html?file=...&t=m  - "meta"
   *     /viewer.html?file=...&t=l  - "links"
   *
   * To keep urls short parameter is one letter "t" and its value is the first letter of the tab name
   * (so first letters of names in tabsOrder have to be unique).
   *
   * State 'tab' is full name of the tab found by the letter from the url (empty string when not present/unknown),
   * what is really shown is resolved in 'activeTab' below.
   */
  function getTab() {
    const letter = new URL(window.location.href).searchParams.get("t") || "";

    return tabsOrder.find((name) => name[0] === letter) || "";
  }

  // "source" -> "&t=s"
  function tabParam(name) {
    return `&t=${name[0]}`;
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

          // new file submitted by user - back to default tab (url in 'changed' has no &t=...)
          setTab("");
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
   * Tabs (vanilla-tabs) are rendered always:
   *   "rendered" - only for markdown: rendered by <zero-md> (the same library as in pages/services/encryptor)
   *   "source"   - raw source in ACE editor
   *   "meta"     - extracted meta (content-type header, resolved ACE mode, map of mimes) as json in ACE editor
   *   "links"    - generated links to this viewer / to the file (inputs to copy from)
   * More in viewer.entry.md
   *
   * All buttons and panels are always in the DOM (for not markdown files button "rendered" is hidden
   * by css [data-md="0"]). This way number of buttons and panels never changes and <Ace> is never unmounted
   * (unmounting and mounting it again on every loaded file is fragile and pointless).
   */
  const isMarkdown = ace.mime === "markdown";

  // first visible tab - the one without parameter in the url
  const defaultTab = isMarkdown ? "rendered" : "source";

  // "rendered" requested for not markdown file or unknown name -> default
  const activeTab = tabsOrder.includes(tab) && (isMarkdown || tab !== "rendered") ? tab : defaultTab;

  // appended to all generated links with ?file=... below
  const tabSuffix = activeTab === defaultTab ? "" : tabParam(activeTab);

  const tabsRef = useRef(null);

  /**
   * Tabs are added to the DOM after github.js finished its init, so nothing activates initial tab for us.
   * We do it manually. allLoaded.push() runs callback immediately when github.js is already initialised.
   */
  useEffect(() => {
    window.allLoaded = window.allLoaded || [];

    window.allLoaded.push(() => {
      if (tabsRef.current) {
        const activeIndex = tabsOrder.indexOf(activeTab);

        window.vanillaTabs.activeByIndex(tabsRef.current, activeIndex, {
          onChange: ({ index }) => {
            // ACE created in hidden tab has no dimensions - resize event makes it recalculate when tab is shown
            window.dispatchEvent(new Event("resize"));

            /**
             * Memorise clicked tab in the url (replaceState - switching tabs doesn't create history entries).
             * onChange is called also for our own activeByIndex() above - then index is equal to activeIndex
             * and there is nothing to memorise. Different index means click of the user.
             */
            if (index !== activeIndex) {
              const clicked = tabsOrder[index];

              window.history.replaceState(
                {},
                "",
                `${location.pathname}?file=${encodeURIComponent(getFile())}${
                  clicked === defaultTab ? "" : tabParam(clicked)
                }`
              );

              setTab(clicked);
            }
          },
        });
      }
    });
  }, [isMarkdown, activeTab]);

  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="search" onChange={(e) => setFile(e.target.value)} value={file} data-testid="viewer-file" />
      </form>

      <br />

      <div
        data-vanilla-tabs
        data-md={isMarkdown ? "1" : "0"}
        ref={tabsRef}
        style={{ "--background-color": "white" }}
        data-testid="viewer-tabs"
      >
        <div data-buttons>
          <span data-testid="viewer-tab-rendered">rendered</span>
          <span data-testid="viewer-tab-source">source</span>
          <span data-testid="viewer-tab-meta">meta</span>
          <span data-testid="viewer-tab-links">links</span>
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
          <div>
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
          </div>
          <div>
            <div className="viewer-links" data-testid="viewer-links">
              <label>
                <span>href:</span>
                <input
                  type="search"
                  readOnly
                  value={`${location.protocol}//${location.host}${location.pathname}?file=${encodeURIComponent(
                    file
                  )}${tabSuffix}`}
                  data-testid="viewer-link-href"
                />
              </label>

              <label>
                <span>pathname + search:</span>
                <input
                  type="search"
                  readOnly
                  value={`${location.pathname}?file=${encodeURIComponent(file)}${tabSuffix}`}
                  data-testid="viewer-link-pathname-search"
                />
              </label>

              <label>
                <span>zz + href:</span>
                <input
                  type="search"
                  readOnly
                  value={`${zz}${location.pathname}?file=${encodeURIComponent(file)}${tabSuffix}`}
                  style={{ color: "green" }}
                  data-testid="viewer-link-zz-href"
                />
              </label>

              <label>
                <span>zz + file:</span>
                <input
                  type="search"
                  readOnly
                  value={`${zz}${file}`}
                  style={{ color: "red" }}
                  data-testid="viewer-link-zz-file"
                />
              </label>

              <label>
                <span>download</span>
                <a href={file} download data-testid="viewer-link-download">
                  {file}
                </a>
              </label>
            </div>
          </div>
        </div>
      </div>

      <br />
      <br />
    </>
  );
}

const container = document.getElementById("root");

const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(<Viewer />);

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

  const [file, setFile] = useState(getFile());

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
        }

        res = await fetch(customFile);

        const text = await res.text();

        setAce(text, contentTypeForAceFromMap, {
          header: rawContentTypeHeader,
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

      onSubmit(null, file, true);
    });

    onSubmit(null, file, true);
  }, []);

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
          value={`${location.protocol}//${location.host}${location.pathname}?file=${encodeURIComponent(file)}`}
        />
      </label>

      <label>
        <span>pathname + search:</span>
        <input type="search" readOnly value={`${location.pathname}?file=${encodeURIComponent(file)}`} />
      </label>

      <label>
        <span>zz + href:</span>
        <input type="search" readOnly value={`${zz}${location.pathname}?file=${encodeURIComponent(file)}`} />
      </label>

      <label>
        <span>zz + file:</span>
        <input type="search" readOnly value={`${zz}${file}`} />
      </label>

      <label>
        <span>download</span>
        <a href={file} download>
          {file}
        </a>
      </label>

      <Ace content={ace.value || ""} lang={ace.mime || "text"} />

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

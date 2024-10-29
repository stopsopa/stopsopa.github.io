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
  const [file, setFile] = useState(new URL(window.location.href).searchParams.get("file") || "");

  const [submit, setSubmit] = useState("");

  const [states, setStates] = useState({});

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

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = e.target;

      if (target.tagName.toLowerCase() === "input" && target.hasAttribute("readOnly")) {
        target.select();
      }
    });
  }, []);

  function getRelative() {
    return `${location.pathname}?file=${encodeURIComponent(file)}`;
  }

  useEffect(() => {
    const relative = getRelative();

    const final = `${location.protocol}//${location.host}${relative}`;

    const noencode = `${location.pathname}?file=${file}`;

    const urlwizz = "urlw" + "izzard.schema://url" + "wizzard.hostnegotiated" + noencode;

    const urlwizzdirv = "urlw" + "izzard.schema://url" + "wizzard.hostnegotiated" + file;

    setStates({
      relative,
      final,
      noencode,
      urlwizz,
      urlwizzdir: urlwizzdirv,
    });
  }, [file]);

  useEffect(() => {
    (async function () {
      try {
        const relative = getRelative();

        let res = await fetch(file, {
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

        window.history.pushState({}, "", relative);

        res = await fetch(file);

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
  }, [submit]);

  function onSubmit(e) {
    e.preventDefault();

    setSubmit(file);
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="search" onChange={(e) => setFile(e.target.value)} value={file} />
      </form>

      <br />
      <input type="search" readOnly value={states.final || ""} />

      <input type="search" readOnly value={states.relative || ""} />

      <input type="search" readOnly value={states.noencode || ""} />

      <input type="search" readOnly value={states.urlwizz || ""} />

      <input type="search" readOnly value={states.urlwizzdir || ""} />

      <a href={states.final || ""}>{states.final || ""}</a>

      <a href={file || ""}>{file || ""}</a>

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
    </>
  );
}

const container = document.getElementById("root");

const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(<Viewer />);

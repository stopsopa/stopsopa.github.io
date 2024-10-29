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
  "application/octet-stream": "python",
};

const mimeMapCi = structuredClone(mimesMap);

Object.keys(mimesMap).forEach((k) => {
  mimeMapCi[k.toLowerCase()] = mimesMap[k];
  mimeMapCi[k.toLowerCase().split(";")[0]] = mimesMap[k];
});

const mimes = Object.keys(mimeMapCi);

function Viewer() {
  const [url, setUrl] = useState(new URL(window.location.href).searchParams.get("file"));

  const [submit, setSubmitRaw] = useState(0);

  const [states, setStates] = useState({});

  const [ace, setAceRaw] = useState({});

  function setAce(value, mime) {
    if (typeof mime !== "string") {
      mime = "text";
    }

    setAceRaw({
      value,
      mime,
    });
  }

  function setSubmit() {
    setSubmitRaw((v) => v + 1);
  }

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = e.target;

      if (target.tagName.toLowerCase() === "input") {
        target.select();
      }
    });
  }, []);

  useEffect(() => {
    const file = url;

    const relative = `${location.pathname}?file=${encodeURIComponent(file)}`;

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

    (async function () {
      try {
        log("view", `before first fetch`);
        let res = await fetch(file, {
          method: "HEAD",
        });
        log("view", `after first fetch`, res);

        const headers = {};

        res.headers.forEach((value, key) => (headers[key] = value));

        log("headers", JSON.stringify(headers, null, 4));

        log("condition: ", {
          [`typeof headers["content-type"] !== "string"`]: typeof headers["content-type"] !== "string",
          [`!headers["content-type"].trim()`]: !headers["content-type"].trim(),
          [`!mimes.includes(headers["content-type"].toLowerCase())`]: !mimes.includes(
            headers["content-type"].toLowerCase()
          ),
          [`res.status !== 200`]: res.status !== 200,
          [`!headers["content-type"]`]: !headers["content-type"],
        });

        const hmime = headers["content-type"];

        const _mime = mimeMapCi[hmime.toLowerCase().split(";")[0]];

        log(`headers["content-type"].toLowerCase() >${hmime}< _mime >${_mime}<`);

        if (!_mime || res.status !== 200) {
          setAce(
            JSON.stringify(
              {
                status: res.status,
                headers,
              },
              null,
              4
            )
          );

          return;
        }

        setAce("Loading...");

        window.history.pushState({}, "", relative);

        res = await fetch(file);

        const text = await res.text();

        setAce(text, _mime);
      } catch (e) {
        setAce(
          JSON.stringify(
            {
              error: "main catch",
              catch: e,
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

    setSubmit();
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="text" onChange={(e) => setUrl(e.target.value)} value={url} />
      </form>
      <br />
      <input type="text" id="long" readonly value={states.final || ""} />
      <br />
      <input type="text" id="short" readonly value={states.relative || ""} />
      <br />
      <input type="text" id="raw" readonly value={states.noencode || ""} />
      <br />
      <input type="text" id="urlwizz" readonly value={states.urlwizz || ""} />
      <br />
      <input type="text" id="urlwizzdir" readonly value={states.urlwizzdir || ""} />
      <br />
      <a href={states.final || ""} id="full">
        {states.final || ""}
      </a>
      <hr />
      <a href={url || ""} id="direct">
        {url || ""}
      </a>
      <hr />
      <Ace content={ace.value || ""} lang={ace.mime || "text"} />
      <br />
      <p>allowed mime types:</p>
      <pre>
        {JSON.stringify(
          {
            mime: ace.mime,
            mimeMapCi,
          },
          null,
          4
        )}
      </pre>
    </>
  );
}

const container = document.getElementById("root");

const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(<Viewer />);

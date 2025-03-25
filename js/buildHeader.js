// import env from "./preprocessed.js";

import log from "./log.js";

import manipulation from "./manipulation.js";

export default async function buildHeader() {
  document.querySelector("body > header") ||
    (function () {
      var body = document.body;

      log("attr in body - nohead:", body);

      if (!body.hasAttribute("nohead")) {
        var header = document.createElement("header");

        var a = document.createElement("a");
        a.setAttribute("href", "/index.html");

        var img = document.createElement("img");
        img.setAttribute("src", `${env("GITHUB_SOURCES_PREFIX")}/actions/workflows/pipeline.yml/badge.svg`);

        manipulation.prepend(a, img);
        // <a target="_blank"
        //   rel="noopener noreferrer"
        //   href="https://github.com/stopsopa/stopsopa.github.io/actions/workflows/pipeline.yml/badge.svg"
        // >
        //   <img
        //     src="https://github.com/stopsopa/stopsopa.github.io/actions/workflows/pipeline.yml/badge.svg"
        //     alt="example workflow"
        //     style="max-width: 100%;"
        //   >
        // </a>

        manipulation.prepend(header, a);

        manipulation.prepend(body, header);
      }

      log.blue("DOMContentLoaded NOHEAD", "handling nohead attr finished", "[triggered in github.js]");
    })();

  log.blue("executed NOHEAD", "handling nohead attr");
}

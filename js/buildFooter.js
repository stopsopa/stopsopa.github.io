import manipulation from "./manipulation.js";

import log from "./log.js";

export default async function buildFooter() {
  document.querySelector("body > footer") ||
    (function () {
      var body = document.body;

      log("attr in body - nofoot:", body);

      if (!body.hasAttribute("nofoot")) {
        var header = document.createElement("footer");

        manipulation.append(body, header);
      }

      log.blue("DOMContentLoaded NOFOOT", "handling nofoot attr finished", "[triggered in github.js]");
    })();

  log.blue("executed NOFOOT", "handling nofoot attr");
}

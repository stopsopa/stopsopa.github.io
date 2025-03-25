import slug from "./slug.js";

import manipulation from "./manipulation.js";

import trim from "./trim.js";

import isObject from "./isObject.js";

function unique(list, str) {
  if (isObject(list)) {
    list = Object.keys(list);
  }

  str = slug(str);

  var i = 0,
    tmp;

  do {
    tmp = str || "";

    if (i > 0) {
      if (tmp) {
        tmp += "-";
      }

      tmp += i;
    }

    i += 1;
  } while (!tmp || list.indexOf(tmp) > -1);

  return tmp;
}

export default function addAnchorLinks() {
  var links = {};

  const selectors = "h1, h2, h3, h4, h5, h6";

  selectors.split(",").forEach(function (selector) {
    document.querySelectorAll(trim(selector)).forEach(function (el) {
      const newId = unique(links, el.innerText);

      links[newId] = el;

      if (!el.hasAttribute("id") || !trim(el.getAttribute())) {
        el.setAttribute("id", newId);
      }
    });
  });

  const anchors = new window.AnchorJS();
  anchors.options = {
    visible: "always",
    placement: "left",
  };
  anchors.add(selectors).remove('[id="index"]').remove('[id="table-of-contents"]');

  document.body.addEventListener("click", function (e) {
    var el = e.target;

    var match = el.matches("a.anchorjs-link[href]");

    if (match) {
      const url = location.href.split("#")[0] + el.getAttribute("href");

      console.log("copying to clipboard: ", url);

      // // this doesn't seem to be working
      // // Copy the URL to the clipboard
      // navigator.clipboard
      //   .writeText(url)
      //   .then(() => {
      //     console.log(`Copied link to clipboard: ${url}`);
      //   })
      //   .catch((err) => {
      //     console.error("Could not copy link to clipboard", err);
      //   });

      var textarea = document.createElement("textarea");
      manipulation.append(document.body, textarea);
      textarea.value = url;
      textarea.select();
      document.execCommand("copy");
      textarea.value = "";
      manipulation.remove(textarea);
    }
  });

  return;

  // Add event listener to headers
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((header) => {
    header.addEventListener("click", (event) => {
      // Get the URL of the header
      const url = event.target.id ? `${window.location.href.split("#")[0]}#${event.target.id}` : window.location.href;

      // Copy the URL to the clipboard
      navigator.clipboard
        .writeText(url)
        .then(() => {
          console.log(`Copied link to clipboard: ${url}`);
        })
        .catch((err) => {
          console.error("Could not copy link to clipboard", err);
        });
    });
  });
}

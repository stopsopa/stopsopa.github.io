import log from "./log.js";

import manipulation from "./manipulation.js";

import trim from "./trim.js";

// Table of Contents
// WARNING: it has to be executed in domcontentloaded.js after permalink-my.js
// WARNING: it has to be executed in domcontentloaded.js after permalink-my.js
// WARNING: it has to be executed in domcontentloaded.js after permalink-my.js
// WARNING: it has to be executed in domcontentloaded.js after permalink-my.js
// WARNING: it has to be executed in domcontentloaded.js after permalink-my.js

var body = document.body;

export default function toc() {
  if (body.hasAttribute("toc")) {
    var toc = document.querySelector("div.cards.toc");

    if (!toc) {
      toc = document.createElement("div");

      toc.classList.add("cards");

      toc.classList.add("toc");
    }

    // Table of content
    (function () {
      var head = toc.querySelector("h1");

      if (!head) {
        head = document.createElement("h1");

        manipulation.append(toc, head);
      }

      if (!head.innerText) {
        head.innerText = "Table of Contents";
      }
    })();

    // links
    (function () {
      var ul = toc.querySelector("ul");

      var found = true;

      if (!ul) {
        found = false;

        ul = document.createElement("ul");
      }

      Array.prototype.slice.call(document.querySelectorAll("h2[id]")).forEach(function (el) {
        var a = document.createElement("a");

        a.setAttribute("href", "#" + el.getAttribute("id"));

        a.innerText = trim(el.innerText, " ¶\n");

        var li = document.createElement("li");

        manipulation.append(li, a);

        manipulation.append(ul, li);
      });

      if (!found) {
        manipulation.append(toc, ul);
      }
    })();

    // hr at the end
    (function () {
      var hr = toc.querySelector("div");

      if (!hr) {
        hr = document.createElement("div");

        manipulation.append(toc, hr);
      }

      hr.style.border = "1px solid darkgray";
    })();

    // return to top button
    (function () {
      var a = document.createElement("a");

      a.innerText = "^";

      a.setAttribute("href", "javascript:void(0)");

      a.addEventListener("click", function () {
        history.pushState({}, "", location.pathname);
        window.scrollTo(0, 0);
      });

      a.style.border = "1px solid blue";
      a.style.padding = "10px";
      a.style.fontSize = "30px";
      a.style.position = "fixed";
      a.style.right = "2px";
      a.style.bottom = "2px";
      a.style.backgroundColor = "white";

      manipulation.append(body, a);
    })();

    var inside = document.querySelector(".inside");

    if (inside) {
      manipulation.prepend(inside, toc);
    } else {
      manipulation.prepend(body, toc);
    }

    // header.innerHTML = `footer`;

    log.blue(
      "TOC",
      "[toc] found",
      "[triggered in domcontentloaded.js, delayed async due to DOMContentLoaded and window.async.permalink.then]"
    );
  } else {
    log.blue(
      "TOC",
      "[toc] not found",
      "[triggered in domcontentloaded.js, delayed async due to window.async.permalink.then]"
    );
  }
}

log.green("defined", "window.toc");

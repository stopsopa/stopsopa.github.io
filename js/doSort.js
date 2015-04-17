import trim from "./trim.js";

import manipulation from "./manipulation.js";

import log from "./log.js";

// sorting lists [data-do-sort] attribute

export default function doSort() {
  Array.prototype.slice.call(document.querySelectorAll("[data-do-sort]")).forEach(function (parent) {
    // parent.removeAttribute('data-do-sort');

    var children = manipulation.children(parent);

    var tmp = [];

    children.forEach(function (child) {
      var text = trim(child.tagName ? child.innerText.toLocaleLowerCase() : String(child.textContent));

      text &&
        tmp.push({
          tagName: child.tagName,
          node: child,
          text: text,
        });
    });

    tmp
      .sort(function (a, b) {
        if (a.text === b.text) {
          return 0;
        }

        return a.text < b.text ? 1 : -1;
      })
      .forEach(function (n) {
        manipulation.prepend(parent, n.node);
      });
  });

  log.blue("DOMContentLoaded", "handling [data-do-sort]", "[defined & triggered in github.js]");
}

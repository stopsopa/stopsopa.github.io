import template from "./lib/template.js";

import { generateFileName, enrichData } from "./lib/generateFileName.js";

const log = console.log;

async function loadJson() {
  const res = await fetch("./info.json");

  const json = await res.json();

  return json;
}

const data = await loadJson();

enrichData(data);

// console.log(JSON.stringify(data, null, 4));

const root = document.querySelector("#root");

const tmp = template(document.querySelector('[type="template"]').innerHTML);

root.innerHTML = tmp({
  data,
});

document.querySelector("#toc").addEventListener("click", function (e) {
  document.body.classList.toggle("notoc");
});

(function () {
  const params = new URLSearchParams(location.search);

  if (!params.has("test")) {
    log('get "test" flag is not defined');

    return;
  }

  function findProcessed(filename) {
    const list = Object.entries(data);

    for (let [key, value] of list) {
      for (let { filename: fn, processed } of value) {
        if (fn === filename) {
          return processed;
        }
      }
    }
  }

  log("data: ", data);

  [...document.querySelectorAll(".file")].forEach(async (el) => {
    const file = `../../source/${el.innerHTML}`;

    const processed = findProcessed(el.innerHTML);

    if (!processed.pdf) {
      return;
    }

    const res = await fetch(file, {
      method: "HEAD",
    });

    if (res.status === 200) {
      el.classList.add("green");
    } else {
      el.classList.add("red");
    }

    log("file: ", file, "processed: ", findProcessed(el.innerHTML));
  });
})();

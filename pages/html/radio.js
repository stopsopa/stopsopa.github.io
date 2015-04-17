import handleRadio from "./handleRadio.js";
// urlwizzard.schema://urlwizzard.hostnegotiated/viewer.html?file=%2Fpages%2Fhtml%2FhandleRadio.js

const name = "mode";
const initState = document.querySelector('.radios input[type="radio"]:checked').value;
const delegateParent = document.querySelector(".radios");
const pre = delegateParent.querySelector("pre");
function locallog(...args) {
  pre.innerText = args.join(" ") + "\n" + pre.innerText;
}

const { unbind, list } = handleRadio({
  name,
  // initState, // optional, if not provided :checked value will be used but if no :checked defined just the first one
  delegateParent, // optional, this will tell where to bind delegate, default will fallback to document.body
  initTrigger: true,
  selectorAll: (name) => {
    return `.radios input[type="radio"][name="${name}"]`;
  },
  onChange: (v, { list }) => {
    locallog("radioChanged: ", v);
    for (const { value } of list) {
      locallog("remove", value);
      if (value) {
        // loader.classList.remove(value);
      }
    }
    if (v) {
      locallog("add", v);
      // loader.classList.add(v);
    }
  },
});

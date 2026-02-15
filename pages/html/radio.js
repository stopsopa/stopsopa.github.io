import handleRadio from "./handleRadio.js";

const name = "mode";
const initState = "single";
const delegateParent = document.querySelector(".radios");
const pre = delegateParent.querySelector("pre");
function locallog(...args) {
  pre.innerText = args.join(" ") + "\n" + pre.innerText;
}

const { unbind, list } = handleRadio({
  name,
  initState: "two",
  delegateParent,
  initTrigger: true,
  selectorAll: (name) => {
    return `.radios input[type="radio"][name="${name}"]`;
  },
  onChange: (v) => {
    locallog("radioChanged: ", v);
  },
});

import humanJson from "nlab/humanJson.js";

// node_modules/nlab/humanJson.js

// https://stephanwagner.me/auto-resizing-textarea-with-vanilla-javascript
function textareaAutoResize() {
  function resize(element) {
    var offset = element.offsetHeight - element.clientHeight;
    element.style.height = "auto";
    element.style.height = element.scrollHeight + offset + "px";
  }
  document.querySelectorAll("[data-autoresize]").forEach(function (element) {
    element.style.boxSizing = "border-box";
    element.addEventListener("input", function (event) {
      resize(event.target);
    });
    element.removeAttribute("data-autoresize");
    element.setAttribute("data-autoresize-attached", "true");
  });

  return () => {
    document.querySelectorAll("[data-autoresize-attached]").forEach(function (element) {
      resize(element);
    });
  };
}

window.resizeTextareas = (function () {
  const trigger = textareaAutoResize();

  return () => {
    window.requestAnimationFrame(trigger);
  };
})();

const paste = document.getElementById("paste");
const pasteT = paste.querySelector("textarea");

const copy = document.getElementById("copy");
const copyT = copy.querySelector("textarea");

// enythime anything changes in paste textarea event
pasteT.addEventListener("input", function (e) {
  // get the value of the paste textarea
  const value = e.target.value;

  const obj = JSON.parse(value);

  copyT.value = humanJson(obj, null, 2);

  resizeTextareas();
});

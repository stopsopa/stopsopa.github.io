import createScript from "./createScript.js";

export default function doEval() {
  Array.from(document.querySelectorAll("[data-eval]")).forEach(function (tag) {
    const parent = tag.parentNode;

    tag.removeAttribute("data-eval");

    var text = tag.innerHTML;

    console.log("doEval, tag:", tag, "parent: ", parent, text);

    createScript(text, parent);
  });
}

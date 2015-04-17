import handleInput from "./handleInput.js";
import type { HandleInputEvent } from "./handleInput.js";

import handleCheckboxDynamic from "../checkbox/handleCheckboxDynamic/handleCheckboxDynamic.js";

/**
 * for url http://google.com/test?abc&def#hash
 * returns {abc: true, def: true}
 */
const hasKeys = (function () {
  const url = new URL(location.href);

  const obj: Record<string, boolean> = {};

  [...url.searchParams.keys()].forEach((key) => {
    obj[key] = true;
  });

  return obj;
})();

const form = document.querySelector("form") as HTMLFormElement;
const pre = document.querySelector("pre") as HTMLPreElement;
const resetButton = document.querySelector("#reset") as HTMLButtonElement;

if (!form || !pre || !resetButton) {
  throw new Error("Required DOM elements not found");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const addbox = document.querySelector("#addbox") as HTMLDivElement;
const addbutton = document.querySelector("#addbutton") as HTMLButtonElement;

if (addbox && addbutton) {
  const sets = [
    { name: "d", value: "value d" },
    { name: "e", value: "value ee" },
    { name: "ff", value: "value f" },
    { name: "h", value: "value h" },
  ];
  function getNextSet() {
    return sets.shift();
  }

  addbutton.addEventListener("click", () => {
    const set = getNextSet();
    if (!set) {
      console.log("all sets are used");
      return;
    }

    const div = document.createElement("div");
    div.innerHTML = `
      <label>
        input ${set.name} <input type="text" name="${set.name}" value="${set.value}" />
      </label>
      <button type="button" name="${set.name}">remove</button>
    `;
    addbox.appendChild(div);
  });

  form.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    if (el.tagName === "BUTTON" && el.innerText === "remove") {
      const row = el.parentElement;
      row?.remove();
    }
  });
}

const preTarget = document.querySelector("#target pre") as HTMLPreElement;
const preValue = document.querySelector("#value pre") as HTMLPreElement;
const preType = document.querySelector("#type pre") as HTMLPreElement;
const preData = document.querySelector("#data pre") as HTMLPreElement;
const preKey = document.querySelector("#key pre") as HTMLPreElement;
const preName = document.querySelector("#name pre") as HTMLPreElement;

resetButton.addEventListener("click", () => {
  preTarget.innerHTML = "";
  preValue.innerHTML = "";
  preType.innerHTML = "";
  preKey.innerHTML = "";
  preData.innerHTML = "";
  if (preName) preName.innerHTML = "";
});

if (!preTarget || !preValue || !preType) {
  console.log({
    preTarget,
    preValue,
    preType,
  });
  throw new Error("preTarget or preValue or preType not found");
}

const checkboxes = document.querySelector("#checkboxes") as HTMLElement;

let unbind: () => void;
handleCheckboxDynamic(
  checkboxes,
  (e, checkboxes) => {
    const events = checkboxes.reduce((acc, el) => {
      acc.push(el.id as HandleInputEvent);

      return acc;
    }, [] as HandleInputEvent[]);

    if (unbind) {
      unbind();
    }

    unbind = handleInput(
      form,
      (e) => {
        const target = e?.target as HTMLInputElement;

        preTarget.innerText = target?.constructor?.name + "\n" + preTarget.innerText;
        preType.innerText = `>${e?.type}<` + "\n" + preType.innerText;
        // @ts-ignore
        preData.innerText = `>${e?.data}<` + "\n" + preData.innerText;
        // @ts-ignore
        preKey.innerText = `>${e?.key}<` + "\n" + preKey.innerText;
        if (preName) preName.innerText = `>${target?.name}<` + "\n" + preName.innerText;
        preValue.innerText = `>${target?.value}<` + "\n" + preValue.innerText;

        console.log("handleInput.event:", e);
      },
      {
        onLoad: hasKeys.onLoad,
        observeMutations: hasKeys.observeMutations,
        events,
      }
    );
  },
  { onLoad: true }
);

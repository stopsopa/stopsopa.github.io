import handleInput from "./handleInput.js";
import type { HandleInputEvent } from "./handleInput.js";

import handleCheckboxDynamic from "../checkbox/handleCheckboxDynamic/handleCheckboxDynamic.js";

const form = document.querySelector("form") as HTMLFormElement;
const pre = document.querySelector("pre") as HTMLPreElement;
const resetButton = document.querySelector("#reset") as HTMLButtonElement;

if (!form || !pre || !resetButton) {
  throw new Error("Required DOM elements not found");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const preTarget = document.querySelector("#target pre") as HTMLPreElement;
const preValue = document.querySelector("#value pre") as HTMLPreElement;
const preType = document.querySelector("#type pre") as HTMLPreElement;
const preData = document.querySelector("#data pre") as HTMLPreElement;
const preKey = document.querySelector("#key pre") as HTMLPreElement;

resetButton.addEventListener("click", () => {
  preTarget.innerHTML = "";
  preValue.innerHTML = "";
  preType.innerHTML = "";
  preKey.innerHTML = "";
  preData.innerHTML = "";
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
        preValue.innerText = `>${target?.value}<` + "\n" + preValue.innerText;

        console.log("handleInput.event:", e);
      },
      { onLoad: true, events }
    );
  },
  { onLoad: true }
);

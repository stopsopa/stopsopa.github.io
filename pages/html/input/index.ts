import handleInput from "./handleInput.js";

import handleCheckboxDynamic from "../checkbox/handleCheckboxDynamic/handleCheckboxDynamic.js";

const form = document.querySelector("form") as HTMLFormElement;
const pre = document.querySelector("pre") as HTMLPreElement;
const resetButton = document.querySelector("button[type=reset]") as HTMLButtonElement;

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

resetButton.addEventListener("click", () => {
  preTarget.innerHTML = "";
  preValue.innerHTML = "";
  preType.innerHTML = "";
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
    const data = checkboxes.map((c) => ({
      id: c.id,
      checked: c.checked,
    }));

    console.log("handleCheckboxDynamic:", data);

    if (unbind) {
      unbind();
    }

    unbind = handleInput(
      form,
      (e) => {
        const target = e?.target as HTMLInputElement;

        preTarget.innerText = target?.constructor?.name + "\n" + preTarget.innerText;
        preType.innerText = `>${e?.type}<` + "\n" + preType.innerText;
        // preData.innerText = `>${e?.data}<` + "\n" + preData.innerText;
        preValue.innerText = `>${target?.value}<` + "\n" + preValue.innerText;

        console.log("event:", e);
      },
      { onLoad: true }
    );
  },
  { onLoad: true }
);

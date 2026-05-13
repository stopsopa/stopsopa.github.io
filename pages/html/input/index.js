import handleInput from "./handleInput.js";
import handleCheckboxDynamic from "../checkbox/handleCheckboxDynamic/handleCheckboxDynamic.js";
const form = document.querySelector("form");
const pre = document.querySelector("pre");
const resetButton = document.querySelector("button[type=reset]");
if (!form || !pre || !resetButton) {
  throw new Error("Required DOM elements not found");
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
const preTarget = document.querySelector("#target pre");
const preValue = document.querySelector("#value pre");
const preType = document.querySelector("#type pre");
const preData = document.querySelector("#data pre");
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
    preType
  });
  throw new Error("preTarget or preValue or preType not found");
}
const checkboxes = document.querySelector("#checkboxes");
let unbind;
handleCheckboxDynamic(
  checkboxes,
  (e, checkboxes2) => {
    const data = checkboxes2.map((c) => ({
      id: c.id,
      checked: c.checked
    }));
    console.log("handleCheckboxDynamic:", data);
    if (unbind) {
      unbind();
    }
    unbind = handleInput(
      form,
      (e2) => {
        const target = e2?.target;
        preTarget.innerText = target?.constructor?.name + "\n" + preTarget.innerText;
        preType.innerText = `>${e2?.type}<
` + preType.innerText;
        preValue.innerText = `>${target?.value}<
` + preValue.innerText;
        console.log("event:", e2);
      },
      { onLoad: true }
    );
  },
  { onLoad: true }
);

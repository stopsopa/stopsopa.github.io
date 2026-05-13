import handleInput from "./handleInput.js";
import handleCheckboxDynamic from "../checkbox/handleCheckboxDynamic/handleCheckboxDynamic.js";
const form = document.querySelector("form");
const pre = document.querySelector("pre");
const resetButton = document.querySelector("#reset");
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
const preKey = document.querySelector("#key pre");
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
    preType
  });
  throw new Error("preTarget or preValue or preType not found");
}
const checkboxes = document.querySelector("#checkboxes");
let unbind;
handleCheckboxDynamic(
  checkboxes,
  (e, checkboxes2) => {
    const events = checkboxes2.reduce((acc, el) => {
      acc.push(el.id);
      return acc;
    }, []);
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
        preData.innerText = `>${e2?.data}<
` + preData.innerText;
        preKey.innerText = `>${e2?.key}<
` + preKey.innerText;
        preValue.innerText = `>${target?.value}<
` + preValue.innerText;

        console.log("handleInput.event:", e2);
      },
      { onLoad: true, events }
    );
  },
  { onLoad: true }
);

import handleCheckbox from "./handleCheckbox.js";

const form = document.querySelector("form") as HTMLFormElement;

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const pre = document.querySelector("pre") as HTMLPreElement;

handleCheckbox(
  form,
  {
    a: 'input[name="a"]',
    b: 'input[name="b"]',
    c: 'input[name="c"]',
  },
  (e, values) => {
    console.log("handleCheckbox:", e, values);
    pre.innerHTML = JSON.stringify(values, null, 2) + "\n" + pre.innerHTML;
  },
  {
    onLoad: true,
  }
);

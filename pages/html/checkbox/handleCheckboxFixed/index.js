import handleCheckboxFixed from "./handleCheckboxFixed.ts";
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
const pre = document.querySelector("pre");
handleCheckboxFixed(
  form,
  {
    a: { selector: 'input[name="a"]', checked: false },
    b: { selector: 'input[name="b"]', checked: true },
    c: { selector: 'input[name="c"]', checked: true }
  },
  (e, values) => {
    console.log("handleCheckboxFixed:", e, values);
    pre.innerHTML = JSON.stringify(values, null, 2) + "\n" + pre.innerHTML;
  },
  {
    onLoad: true
  }
);

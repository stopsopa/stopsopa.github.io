import handleCheckboxDynamic from "./handleCheckboxDynamic.ts";

const form = document.querySelector("form") as HTMLFormElement;
const addbox = document.querySelector("#addbox") as HTMLDivElement;
const addbutton = document.querySelector("#addbutton") as HTMLButtonElement;

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const pre = document.querySelector("pre") as HTMLPreElement;

addbutton.addEventListener("click", () => {
  const set = getNextSet();
  if (!set) {
    console.log("all sets are used");
    return;
  }

  const div = document.createElement("div");
  div.innerHTML = `
<label>
  <input type="checkbox" name="${set.name}" value="${set.value}" />
  checkbox ${set.name}

</label>
<button name="${set.name}">remove</button>
  `;
  addbox.appendChild(div);
});

form.addEventListener("click", (e) => {
  const el = e.target as HTMLElement;
  if (el.tagName === "BUTTON" && el.innerText === "remove") {
    const row = el.parentElement;
    // remove that row
    row?.remove();
  }
});

handleCheckboxDynamic(
  form,
  (e, values) => {
    console.log("handleCheckboxDynamic:", e, values);
    pre.innerHTML = JSON.stringify(values) + "\n" + pre.innerHTML;
  },
  {
    onLoad: true,
  }
);

const sets = [
  {
    name: "d",
    value: "value d",
  },
  {
    name: "e",
    value: "value ee",
  },
  {
    name: "ff",
    value: "value f",
  },
  {
    name: "h",
    value: "value h",
  },
];
function getNextSet() {
  return sets.shift();
}

import handleCheckboxDynamic from "./handleCheckboxDynamic.ts";

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

console.log("get from url".repeat(100), hasKeys);

const form = document.querySelector("form") as HTMLFormElement;
const addbox = document.querySelector("#addbox") as HTMLDivElement;
const addbutton = document.querySelector("#addbutton") as HTMLButtonElement;

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const pre = document.querySelector(".pre pre") as HTMLPreElement;

addbutton.addEventListener("click", () => {
  const set = getNextSet();
  if (!set) {
    console.log("all sets are used");
    return;
  }

  const div = document.createElement("div");
  div.innerHTML = `
<label>
  <input type="checkbox" name="${set.name}" value="${set.value}" ${set.checked ? "checked" : ""}/>
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
  (e, checkboxes) => {
    const data = checkboxes.map((c) => ({
      name: c.name,
      value: c.value,
      checked: c.checked,
    }));
    console.log("handleCheckboxDynamic:", e, data);
    pre.innerHTML = JSON.stringify(data) + "\n" + pre.innerHTML;
  },
  {
    onLoad: hasKeys.onLoad,
    observeMutations: hasKeys.observeMutations,
  }
);

const sets = [
  {
    name: "d",
    value: "value d",
    checked: true,
  },
  {
    name: "e",
    value: "value ee",
    checked: false,
  },
  {
    name: "ff",
    value: "value f",
    checked: true,
  },
  {
    name: "h",
    value: "value h",
    checked: false,
  },
];
function getNextSet() {
  return sets.shift();
}

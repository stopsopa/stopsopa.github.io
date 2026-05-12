// pages/html/checkbox/handleCheckboxDynamic/handleCheckboxDynamic.ts
function handleCheckboxDynamic(parentToBind, event, options) {
  function safeKeys(value) {
    return value && typeof value === "object" ? Object.keys(value) : [];
  }
  if (!parentToBind) {
    parentToBind = document.body;
  }
  const {
    onLoad = false,
    events = ["change"],
    findCheckboxes = (parent) => parent.querySelectorAll("input[type=checkbox]"),
    detectElement = (el) => el.matches("input[type=checkbox]"),
    extractKey = (el) => el.id || el?.name,
    alwaysReturnAllCheckboxes = false,
    observeMutations = false
  } = options || {};
  {
    const keys = safeKeys(events);
    const seen = new Set(keys);
    if (keys.length === 0 || keys.length !== seen.size) {
      throw new Error(`handleCheckboxDynamic: invalid 'events': has to many keys: ${keys.length}`);
    }
  }
  function extract(el) {
    const values = [];
    const checkboxes = [...findCheckboxes(parentToBind)];
    let found = false;
    for (const checkbox of checkboxes) {
      if (detectElement(checkbox)) {
        if (!found && el && el === checkbox) {
          found = true;
        }
        const key = extractKey(checkbox);
        if (typeof key !== "string" || !key.trim()) {
          throw new Error(`handleCheckboxDynamic: invalid 'elements': invalid key`);
        }
        if (alwaysReturnAllCheckboxes || checkbox.checked) {
          values.push(checkbox);
        }
      }
    }
    return { found, checkboxes: values };
  }
  function handler(e) {
    const el = e.target;
    const { found, checkboxes } = extract(el);
    if (found) {
      event(e, checkboxes);
    }
  }
  const unbind = [];
  for (const event2 of events) {
    parentToBind.addEventListener(event2, handler);
    unbind.push(() => {
      parentToBind.removeEventListener(event2, handler);
    });
  }
  let observer = null;
  if (observeMutations) {
    observer = new MutationObserver((mutations) => {
      const affected = mutations.some((mutation) => {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (detectElement(node)) return true;
            if (node?.querySelector("input[type=checkbox]")) return true;
          }
        }
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            if (detectElement(node)) return true;
            if (node?.querySelector("input[type=checkbox]")) return true;
          }
        }
        return false;
      });
      if (affected) {
        const { checkboxes } = extract();
        event(new Event("mutation"), checkboxes);
      }
    });
    observer.observe(parentToBind, { childList: true, subtree: true });
  }
  if (onLoad) {
    const { checkboxes } = extract();
    event(new Event("load"), checkboxes);
  }
  return () => {
    unbind.forEach((un) => un());
    observer?.disconnect();
  };
}

// pages/html/checkbox/handleCheckboxDynamic/index.ts
var hasKeys = (function() {
  const url = new URL(location.href);
  const obj = {};
  [...url.searchParams.keys()].forEach((key) => {
    obj[key] = true;
  });
  return obj;
})();
console.log("get from url".repeat(100), hasKeys);
var form = document.querySelector("form");
var addbox = document.querySelector("#addbox");
var addbutton = document.querySelector("#addbutton");
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
var pre = document.querySelector(".pre pre");
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
  const el = e.target;
  if (el.tagName === "BUTTON" && el.innerText === "remove") {
    const row = el.parentElement;
    row?.remove();
  }
});
handleCheckboxDynamic(
  form,
  (e, checkboxes) => {
    const data = checkboxes.map((c) => ({
      name: c.name,
      value: c.value,
      checked: c.checked
    }));
    console.log("handleCheckboxDynamic:", e, data);
    pre.innerHTML = JSON.stringify(data) + "\n" + pre.innerHTML;
  },
  {
    onLoad: hasKeys.onLoad,
    observeMutations: hasKeys.observeMutations
  }
);
var sets = [
  {
    name: "d",
    value: "value d",
    checked: true
  },
  {
    name: "e",
    value: "value ee",
    checked: false
  },
  {
    name: "ff",
    value: "value f",
    checked: true
  },
  {
    name: "h",
    value: "value h",
    checked: false
  }
];
function getNextSet() {
  return sets.shift();
}

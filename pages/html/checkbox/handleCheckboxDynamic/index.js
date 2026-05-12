// pages/html/checkbox/handleCheckboxDynamic/handleCheckboxDynamic.ts
function handleCheckboxDynamic(parentToBind, elements, event, options = {}) {
  if (!parentToBind) {
    parentToBind = document.body;
  }
  const { onLoad = false, events = ["change"] } = options;
  const keys = safeKeys(elements);
  const seen = new Set(keys);
  if (keys.length === 0 || keys.length !== seen.size) {
    throw new Error(`handleCheckboxFixed: invalid 'elements': has to many keys: ${keys.length}`);
  }
  function extract(el) {
    const values = {};
    let found = false;
    for (const key of keys) {
      if (!found && el && el.matches(elements[key].selector)) {
        found = true;
      }
      values[key] = parentToBind.querySelector(elements[key].selector)?.checked ?? false;
    }
    return { found, values };
  }
  function handler(e) {
    const el = e.target;
    const { found, values } = extract(el);
    if (found) {
      event(e, values);
    }
  }
  const unbind = [];
  for (const event2 of events) {
    parentToBind.addEventListener(event2, handler);
    unbind.push(() => {
      parentToBind.removeEventListener(event2, handler);
    });
  }
  if (onLoad) {
    const { values } = extract();
    event(new Event("load"), values);
  }
  return () => {
    unbind.forEach((un) => un());
  };
}
function safeKeys(value) {
  return value && typeof value === "object" ? Object.keys(value) : [];
}

// pages/html/checkbox/handleCheckboxDynamic/index.ts
var form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
var pre = document.querySelector("pre");
handleCheckboxDynamic(
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

// pages/html/checkbox/handleCheckboxFixed/handleCheckboxFixed.ts
function handleCheckboxFixed(parentToBind, elements, event, options = {}) {
  function safeKeys(value) {
    return value && typeof value === "object" ? Object.keys(value) : [];
  }
  if (!parentToBind) {
    parentToBind = document.body;
  }
  const { onLoad = false, events = ["change"], dontSetDefaultValues = false } = options;
  {
    const keys2 = safeKeys(events);
    const seen2 = new Set(keys2);
    if (keys2.length === 0 || keys2.length !== seen2.size) {
      throw new Error(`handleCheckboxFixed: invalid 'events': has to many keys: ${keys2.length}`);
    }
  }
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
  if (!dontSetDefaultValues) {
    for (const key of keys) {
      const el = parentToBind.querySelector(elements[key].selector);
      if (el && typeof elements[key].checked === "boolean") {
        el.checked = elements[key].checked;
      }
    }
  }
  if (onLoad) {
    const { values } = extract();
    event(new Event("load"), values);
  }
  return () => {
    unbind.forEach((un) => un());
  };
}

// pages/html/checkbox/handleCheckboxFixed/index.ts
var form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
});
var pre = document.querySelector("pre");
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

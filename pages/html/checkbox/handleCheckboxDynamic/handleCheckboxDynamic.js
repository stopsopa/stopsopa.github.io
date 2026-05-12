// pages/html/checkbox/handleCheckboxDynamic/handleCheckboxDynamic.ts
function handleCheckboxDynamic(parentToBind, elements, event, options = {}) {
  if (!parentToBind) {
    parentToBind = document.body;
  }
  const { onLoad = false, events = ["change"], dontSetDefaultValues = false } = options;
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
function safeKeys(value) {
  return value && typeof value === "object" ? Object.keys(value) : [];
}
export {
  handleCheckboxDynamic as default
};

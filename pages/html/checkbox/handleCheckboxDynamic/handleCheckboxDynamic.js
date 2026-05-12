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
    extractValue = (el) => el?.value
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
        const value = extractValue(checkbox);
        if (typeof value !== "string" || !value.trim()) {
          throw new Error(`handleCheckboxDynamic: invalid 'elements': invalid value for key >${key}< value >${value}<`);
        }
        if (checkbox.checked) {
          values.push([key, value]);
        }
      }
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
export {
  handleCheckboxDynamic as default
};

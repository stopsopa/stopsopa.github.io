// pages/html/handleRadio.ts
function handleRadio(opt) {
  let tool;
  const {
    name,
    selectorAll = (name2) => {
      return `input[type="radio"][name="${name2}"]`;
    },
    selectorOne = (name2, state) => {
      const s2 = selectorAll(name2);
      return `${s2}[value="${state}"]`;
    },
    initState,
    initTrigger = false,
    autoBind = true,
  } = opt;
  let { delegateParent, onChange } = opt;
  if (typeof onChange !== "function") {
    onChange = () => {};
  }
  let isBound = false;
  if (!delegateParent) {
    delegateParent = document.body;
  }
  if (typeof selectorAll !== "function") {
    throw new Error("handleRadio: selectorAll must be a function");
  }
  const s = selectorAll(name);
  if (initState) {
    const sOne = selectorOne(name, initState);
    const el = delegateParent.querySelector(sOne);
    if (el) {
      el.checked = true;
    }
  }
  let active = delegateParent.querySelector(`${s}:checked`);
  if (!active) {
    active = delegateParent.querySelector(s);
    if (active) {
      active.checked = true;
    }
  }
  const delegateFn = (e) => {
    const target = e.target;
    var match = target.matches(s);
    if (match) {
      const v = target.value;
      onChange(v, tool);
    }
  };
  if (autoBind) {
    delegateParent.addEventListener("click", delegateFn);
    isBound = true;
  }
  tool = {
    unbind: () => {
      delegateParent.removeEventListener("click", delegateFn);
      isBound = false;
    },
    bind: () => {
      delegateParent.removeEventListener("click", delegateFn);
      delegateParent.addEventListener("click", delegateFn);
      isBound = true;
    },
    getStatus: () => {
      return isBound;
    },
    get list() {
      return Array.from(delegateParent.querySelectorAll(s)).map((el) => ({
        el,
        checked: el.checked,
        value: el.value,
      }));
    },
    checkByValue: (value) => {
      const selector = selectorOne(name, value);
      const el = delegateParent.querySelector(selector);
      if (el) {
        el.checked = true;
      }
    },
  };
  if (initTrigger) {
    const activeEl = delegateParent.querySelector(`${s}:checked`);
    if (activeEl) {
      onChange(activeEl.value, tool);
    }
  }
  return tool;
}
export { handleRadio as default };

export default function handleRadio(opt) {
  let tool;
  const {
    name,
    selectorAll = (name) => {
      return `input[type="radio"][name="${name}"]`;
    },
    selectorOne = (name, state) => {
      const s = selectorAll(name);
      return `${s}[value="${state}"]`;
    },
    initState,
    initTrigger = false,
  } = opt;

  let { delegateParent, onChange } = opt;

  if (typeof onChange !== "function") {
    onChange = () => {};
  }

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
  delegateParent.addEventListener("click", delegateFn);

  tool = {
    unbind: () => {
      delegateParent.removeEventListener("click", delegateFn);
    },
    list: [...delegateParent.querySelectorAll(s)].reduce((acc, el) => {
      acc.push({
        el,
        checked: el.checked,
        value: el.value,
      });
      return acc;
    }, []),
    checkByValue: (value) => {
      const sOne = selectorOne(name, value);
      const el = delegateParent.querySelector(sOne);

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

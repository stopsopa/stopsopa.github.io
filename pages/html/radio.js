const name = "mode";
const initState = "single";
const delegateParent = document.querySelector(".radios");
const pre = delegateParent.querySelector("pre");
function locallog(...args) {
  pre.innerText = args.join(" ") + "\n" + pre.innerText;
}

const { unbind, all } = handleRadio({
  name,
  initState: "two",
  delegateParent,
  initTrigger: true,
  onChange: (v) => {
    locallog("radioChanged: ", v);
  },
});

function handleRadio(opt) {
  const {
    name,
    selectorAll = (name) => {
      return `.radios input[type="radio"][name="${name}"]`;
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

  if (typeof s !== "string") {
    throw new Error("handleRadio: selector must return a string");
  }

  if (initState) {
    const sOne = selectorOne(name, initState);
    const el = delegateParent.querySelector(sOne);

    if (el) {
      el.checked = true;
    }
  }

  const delegateFn = (e) => {
    const target = e.target;

    var match = target.matches(s);

    if (match) {
      const v = target.value;
      onChange(v);
    }
  };
  delegateParent.addEventListener("click", delegateFn);

  if (initTrigger) {
    const v = delegateParent.querySelector(`${s}:checked`).value;
    onChange(v);
  }

  return {
    unbind: () => {
      delegateParent.removeEventListener("click", delegateFn);
    },
    all: [...delegateParent.querySelectorAll(s)].reduce((acc, el) => {
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
}

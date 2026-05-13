function handleInput(parentToBind, event, options = {}) {
  if (!parentToBind) {
    parentToBind = document.body;
  }
  const {
    onLoad = false,
    events = ["input", "change"],
    findInputs = (parent) => parent.querySelectorAll(`input[type="text"]`),
    detectElement = (el) => el.matches(`input[type="text"]`),
    observeMutations = false
  } = options;
  function handler(e) {
    const el = e?.target;
    if (detectElement(el)) {
      event(e, el);
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
      const inputs = /* @__PURE__ */ new Set();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (detectElement(node)) {
            inputs.add(node);
          }
          [...findInputs(node)].forEach((el) => {
            if (detectElement(el)) {
              inputs.add(el);
            }
          });
        }
        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (detectElement(node)) {
            inputs.add(node);
          }
          [...findInputs(node)].forEach((el) => {
            if (detectElement(el)) {
              inputs.add(el);
            }
          });
        }
      }
      for (const input of inputs) {
        const e = new Event("mutation");
        Object.defineProperty(e, "target", { writable: false, value: input });
        event(e, input);
      }
    });
    observer.observe(parentToBind, { childList: true, subtree: true });
  }
  if (onLoad) {
    const inputs = [...findInputs(parentToBind)];
    for (const input of inputs) {
      if (detectElement(input)) {
        const e = new Event("load");
        Object.defineProperty(e, "target", { writable: false, value: input });
        event(e, input);
      }
    }
  }
  return () => {
    unbind.forEach((un) => un());
    observer?.disconnect();
  };
}
export {
  handleInput as default
};

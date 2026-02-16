export default function bindHover(opt = {}) {
  const {
    anchorSelector = "[data-popover-hover]",
    delayAttribute = "data-popover-hover",
    showDelay = 300,
    hideDelay = 500,
    extractDelay = (anchorElement) => {
      const attr = anchorElement.getAttribute(delayAttribute) || "";
      if (!attr.includes(":")) {
        return { show: showDelay, hide: hideDelay };
      }
      const [sStr, hStr] = attr.split(":");
      const s = parseInt(sStr, 10);
      const h = parseInt(hStr, 10);
      return {
        show: !isNaN(s) && s >= 0 ? s : showDelay,
        hide: !isNaN(h) && h >= 0 ? h : hideDelay,
      };
    },
  } = opt;

  const th = (msg) => new Error(`bindHover.js error: ${msg}`);

  const map = new WeakMap();
  function findStore(el) {
    if (!el || el === document.body || !el.closest) return null;

    const popoverEl = el.closest("[popover]");
    const fullSelector = `[popovertarget]${anchorSelector}`;

    const invoker =
      el.closest(fullSelector) ||
      (popoverEl ? document.querySelector(`[popovertarget="${popoverEl.id}"]${anchorSelector}`) : null);

    if (!invoker) return null;

    let store = map.get(invoker);
    if (!store) {
      const popover = document.getElementById(invoker.getAttribute("popovertarget"));
      if (!popover) throw new Error("Popover not found");
      const { show, hide } = extractDelay(invoker);
      store = { invoker, popover, timeout: null, show, hide };
      map.set(invoker, store);
    }
    return store;
  }

  function showWithDelay(store) {
    clearTimeout(store.timeout);
    if (store.popover.matches(":popover-open")) return;

    store.timeout = setTimeout(() => {
      store.popover.showPopover({ source: store.invoker });
    }, store.show);
  }

  function hideWithDelay(store) {
    clearTimeout(store.timeout);
    store.timeout = setTimeout(() => {
      store.popover.hidePopover();
    }, store.hide);
  }

  document.body.addEventListener("mouseover", (e) => {
    const store = findStore(e.target);
    if (store) {
      showWithDelay(store);
    }
  });

  document.body.addEventListener("mouseout", (e) => {
    const store = findStore(e.target);
    if (store) {
      // Only hide if we are moving to something that is NOT part of the same hover group
      const nextStore = findStore(e.relatedTarget);
      if (nextStore !== store) {
        hideWithDelay(store);
      }
    }
  });
}

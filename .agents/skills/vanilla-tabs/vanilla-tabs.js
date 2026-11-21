/**
 * https://github.com/stopsopa/tabs
 *
 * GENERATED FILE - don't edit. Edit vanilla-tabs.ts and run: /bin/bash transpile.sh
 */
window.vanillaTabs = (function () {
  const onChangeEvents = {};
  const dataidkey = "data-vanilla-tab-id";
  const changeEventName = "vanilla-tabs:change";
  let i = 0;
  const warn = (function () {
    try {
      return (...args) => console.warn("vanilla-tabs:", ...args);
    } catch (e) {
      return () => {};
    }
  })();
  const th = (msg, ..._context) => new Error(`vanilla-tabs error: ${msg}`);
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function isNode(value) {
    return isObjectLike(value) && !isPlainObject(value);
  }
  function children(parent, selector) {
    const container = parent.querySelector(selector);
    return container ? Array.from(container.children) : [];
  }
  let bound = false;
  const prepared = /* @__PURE__ */ new WeakSet();
  let resizeObserver;
  let observer;
  const tool = {
    /**
     * One time preparation of single [data-vanilla-tabs] element:
     *  - colors from attributes data-background-color & data-lines-color
     *  - prev/next arrows for the case when buttons don't fit in available width
     */
    setup: function (parent) {
      const buttons = parent.querySelector(":scope > [data-buttons]");
      if (!buttons) {
        return;
      }
      [
        ["data-background-color", "--vanilla-tabs-background-color"],
        ["data-lines-color", "--vanilla-tabs-lines-color"],
      ].forEach(([attr, variable]) => {
        const value = parent.getAttribute(attr);
        if (typeof value === "string" && value.trim()) {
          parent.style.setProperty(variable, value.trim());
        }
      });
      [
        ["prev", "‹", "previous tabs"],
        ["next", "›", "next tabs"],
      ].forEach(([dir, label, aria]) => {
        if (parent.querySelector(`:scope > [data-vanilla-tabs-nav="${dir}"]`)) {
          return;
        }
        const nav = document.createElement("button");
        nav.setAttribute("type", "button");
        nav.setAttribute("data-vanilla-tabs-nav", dir);
        nav.setAttribute("aria-label", aria);
        nav.textContent = label;
        parent.appendChild(nav);
      });
      if (!prepared.has(buttons)) {
        prepared.add(buttons);
        buttons.addEventListener("scroll", () => this.updateOverflow(parent), {
          passive: true,
        });
        if (typeof ResizeObserver === "function") {
          if (!resizeObserver) {
            resizeObserver = new ResizeObserver((entries) => {
              entries.forEach((entry) => {
                const root = entry.target.parentElement;
                if (root) {
                  this.updateOverflow(root);
                }
              });
            });
          }
          resizeObserver.observe(buttons);
        }
      }
      this.updateOverflow(parent);
    },
    /**
     * Shows/hides arrows and enables/disables them depending on scroll position.
     * Called automatically on resize, scroll and (in watch mode) when buttons are added/removed.
     * Call it manually if you change buttons and you don't use watchMutationsEnable()
     */
    updateOverflow: function (parent) {
      const buttons = parent.querySelector(":scope > [data-buttons]");
      if (!buttons) {
        return;
      }
      const overflow = buttons.scrollWidth > parent.clientWidth;
      if (overflow !== parent.hasAttribute("data-overflow")) {
        parent.toggleAttribute("data-overflow", overflow);
        const active = buttons.querySelector(":scope > .active");
        if (active) {
          this.scrollToButton(active);
        }
      }
      const max = buttons.scrollWidth - buttons.clientWidth;
      const prev = parent.querySelector(':scope > [data-vanilla-tabs-nav="prev"]');
      const next = parent.querySelector(':scope > [data-vanilla-tabs-nav="next"]');
      if (prev) {
        prev.disabled = buttons.scrollLeft <= 1;
      }
      if (next) {
        next.disabled = buttons.scrollLeft >= max - 1;
      }
    },
    /**
     * Scrolls only the row of buttons (never the page) to make given button fully visible
     */
    scrollToButton: function (button) {
      const container = button.parentElement;
      if (!container) {
        return;
      }
      const c = container.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      if (b.left < c.left) {
        container.scrollLeft -= c.left - b.left;
      } else if (b.right > c.right) {
        container.scrollLeft += b.right - c.right;
      }
    },
    getNewId: function () {
      i += 1;
      return `vanilla-tabs-${i}`;
    },
    produceId: function (parent) {
      if (!isNode(parent)) {
        throw th(`parent argument is not valid DOM element`, parent);
      }
      let id = parent.getAttribute(dataidkey);
      if (typeof id !== "string") {
        parent.setAttribute(dataidkey, (id = this.getNewId()));
      }
      return id;
    },
    active: function (opt) {
      const ids = [];
      const { onChange } = { ...opt };
      Array.from(document.querySelectorAll("[data-vanilla-tabs]"))
        .map((parent) => {
          ids.push(this.produceId(parent));
          this.setup(parent);
          return parent.querySelector(":scope > [data-buttons]");
        })
        .map((buttons) => {
          if (!buttons) {
            return null;
          }
          return buttons.querySelector(":scope > .active") || buttons.querySelector(":scope > *");
        })
        .forEach((target) => {
          const parent = target?.parentElement?.parentElement;
          if (target && parent) {
            this.activeByButtonElement(parent, target, {
              onChange,
            });
          }
        });
      return ids;
    },
    activeByButtonElement: function (parent, target, extra) {
      const id = this.produceId(parent);
      let { buttons, onChange } = { ...extra };
      if (!buttons) {
        buttons = children(parent, "[data-buttons]");
      }
      const zeroIndex = buttons.indexOf(target) ?? 0;
      this.activeByIndex(parent, zeroIndex, { buttons, onChange });
      return id;
    },
    bindOnChange: function (id, onChange) {
      if (typeof onChange === "function") {
        onChangeEvents[id] = onChange;
      }
    },
    activeByIndex: function (parent, zeroIndex = 0, extra) {
      const id = this.produceId(parent);
      let { buttons, tabs, onChange } = { ...extra };
      this.bindOnChange(id, onChange);
      if (!buttons) {
        buttons = children(parent, "[data-buttons]");
      }
      if (buttons.length === 0) {
        warn(`buttons not found`, parent);
        return id;
      }
      if (!tabs) {
        tabs = children(parent, "[data-tabs]");
      }
      if (tabs.length === 0) {
        warn(`tabs not found`, parent);
        return id;
      }
      if (buttons.length !== tabs.length) {
        throw th(`buttons and tabs length mismatch`, parent);
      }
      if (!(Number.isInteger(zeroIndex) && !Number.isNaN(zeroIndex) && zeroIndex > -1)) {
        throw th(`zeroIndex not found`, zeroIndex, parent);
      }
      {
        const onChange2 = onChangeEvents[id];
        const list = tabs;
        buttons.forEach(function (button, i2) {
          if (i2 === zeroIndex) {
            const changed = !button.classList.contains("active") || !list[i2].classList.contains("active");
            button.classList.add("active");
            list[i2].classList.add("active");
            tool.scrollToButton(button);
            if (changed) {
              const detail = {
                parent,
                button,
                tab: list[i2],
                index: i2,
              };
              list[i2].dispatchEvent(new CustomEvent(changeEventName, { bubbles: true, detail }));
            }
            if (onChange2) {
              onChange2({
                button,
                tab: list[i2],
                index: i2,
              });
            }
          } else {
            button.classList.remove("active");
            list[i2].classList.remove("active");
          }
        });
      }
      return id;
    },
    bind: function () {
      if (bound) {
        warn(`already bound`);
        return this;
      }
      bound = true;
      const event = (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const nav = target.closest("[data-vanilla-tabs] > [data-vanilla-tabs-nav]");
        if (nav) {
          const buttons = nav.parentElement?.querySelector(":scope > [data-buttons]");
          if (buttons) {
            const direction = nav.getAttribute("data-vanilla-tabs-nav") === "prev" ? -1 : 1;
            buttons.scrollBy({
              left: direction * Math.max(buttons.clientWidth * 0.7, 50),
              behavior: "smooth",
            });
          }
          return;
        }
        const match = target.matches("[data-vanilla-tabs] > [data-buttons] > *");
        const parent = target.parentElement?.parentElement;
        if (match && parent) {
          const buttons = children(parent, "[data-buttons]");
          const zeroIndex = buttons.indexOf(target) ?? 0;
          this.activeByIndex(parent, zeroIndex, { buttons });
        }
      };
      document.body.addEventListener("click", event);
      return () => {
        document.body.removeEventListener("click", event);
      };
    },
    on: function (parent, callback) {
      if (!isNode(parent)) {
        throw th(`on(): parent argument is not valid DOM element`, parent);
      }
      const handler = (e) => {
        const detail = e.detail;
        if (detail && detail.parent === parent) {
          callback(detail, e);
        }
      };
      parent.addEventListener(changeEventName, handler);
      return () => {
        parent.removeEventListener(changeEventName, handler);
      };
    },
    watchMutationsEnable: function () {
      if (observer) {
        return;
      }
      observer = new MutationObserver(function (mutations) {
        const found = mutations.some(function (mutation) {
          if (mutation.type === "childList") {
            return Array.from(mutation.addedNodes).some(function (node) {
              return (
                node instanceof Element &&
                (node.matches("[data-buttons]") || Boolean(node.querySelector("[data-buttons]")))
              );
            });
          }
          return false;
        });
        if (found) {
          tool.active();
        }
        const changed = /* @__PURE__ */ new Set();
        mutations.forEach(function (mutation) {
          const target = mutation.target;
          if (
            mutation.type === "childList" &&
            target instanceof Element &&
            target.matches("[data-vanilla-tabs] > [data-buttons]") &&
            target.parentElement
          ) {
            changed.add(target.parentElement);
          }
        });
        changed.forEach(function (parent) {
          tool.setup(parent);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },
    watchMutationsDisable: function () {
      if (observer && typeof observer.disconnect === "function") {
        observer.disconnect();
      }
      observer = void 0;
    },
    autoenable: function () {
      if (tool.autoenableUnbind) {
        return;
      }
      const unbind = tool.bind();
      tool.active();
      tool.watchMutationsEnable();
      tool.autoenableUnbind = function () {
        tool.watchMutationsDisable();
        if (typeof unbind === "function") {
          unbind();
        }
        bound = false;
        delete tool.autoenableUnbind;
      };
    },
  };
  const autoenable = (function () {
    if (document.body.classList.contains("vanilla-tabs-autoenable")) {
      return true;
    }
    return Array.from(document.querySelectorAll("script")).some((el) => {
      const src = el.getAttribute("src");
      if (typeof src === "string" && src.length > 0) {
        const url = new URL(src, window.location.href);
        if (url.searchParams.has("vanilla-tabs-autoenable")) {
          return true;
        }
      }
      return false;
    });
  })();
  if (autoenable) {
    tool.autoenable();
  }
  return tool;
})();

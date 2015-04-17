/**
 * https://github.com/stopsopa/tabs
 */
window.vanillaTabs = (function () {
  const onChangeEvents = {};

  const dataidkey = "data-vanilla-tab-id";

  let i = 0;

  const warn = (function () {
    try {
      return (...args) => console.warn("vanilla-tabs:", ...args);
    } catch (e) {
      return () => {};
    }
  })();

  const th = (msg) => new Error(`vanilla-tabs error: ${msg}`);

  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function isPlainObject(value) {
    // simplified version of isPlainObject then the one in lodash
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function isNode(value) {
    return isObjectLike(value) && !isPlainObject(value);
  }

  let bound = false;
  return {
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

          return parent.querySelector(":scope > [data-buttons]");
        })
        .map((parent) => {
          let active = parent.querySelector(":scope > .active");

          if (!active) {
            active = parent.querySelector(":scope > *");
          }

          return active;
        })
        .filter(Boolean)
        .forEach((target) => {
          this.activeByButtonElement(target.parentNode.parentNode, target, {
            onChange,
          });
        });

      return ids;
    },
    activeByButtonElement: function (parent, target, extra) {
      const id = this.produceId(parent);

      let { buttons, onChange } = { ...extra };

      if (!buttons) {
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
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
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
      }

      if (buttons.length === 0) {
        warn(`buttons not found`, parent);

        return id;
      }

      if (!tabs) {
        tabs = Array.from(parent.querySelector("[data-tabs]").children);
      }

      if (tabs.length === 0) {
        warn(`tabs not found`, parent);

        return id;
      }

      if (buttons.length !== tabs.length) {
        throw th(`buttons and tabs length mismatch`, parent);
      }

      if (
        !(
          Number.isInteger(zeroIndex) &&
          !Number.isNaN(zeroIndex) &&
          zeroIndex > -1
        )
      ) {
        throw th(`zeroIndex not found`, zeroIndex, parent, target);
      }

      {
        const onChange = onChangeEvents[id];

        buttons.forEach(function (button, i) {
          if (i === zeroIndex) {
            button.classList.add("active");

            tabs[i].classList.add("active");

            if (onChange) {
              onChange({
                button,
                tab: tabs[i],
                index: i,
              });
            }
          } else {
            button.classList.remove("active");

            tabs[i].classList.remove("active");
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
        var target = e.target;

        var match = target.matches("[data-vanilla-tabs] > [data-buttons] > *");

        if (match) {
          const parent = target.parentNode.parentNode;

          const buttons = Array.from(
            parent.querySelector("[data-buttons]").children
          );

          const zeroIndex = buttons.indexOf(target) ?? 0;

          this.activeByIndex(parent, zeroIndex, { buttons });
        }
      };

      document.body.addEventListener("click", event);

      return () => {
        document.body.removeEventListener("click", event);
      };
    },
  };
})();

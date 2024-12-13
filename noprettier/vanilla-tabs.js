/**
 * https://github.com/stopsopa/tabs
 */
window.vanilaTabs = (function () {
  const dataidkey = "data-vanilla-tab-id";

  let i = 0;

  const warn = (function () {
    try {
      return (...args) => console.warn("vanilla-tabs:", ...args);
    } catch (e) {
      return () => {};
    }
  })();

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
        warn(`parent argument is not valid DOM element`, parent);

        return this;
      }

      let id = parent.getAttribute(dataidkey);

      if (typeof id !== "string") {
        parent.setAttribute(dataidkey, (id = this.getNewId()));
      }

      return id;
    },
    active: function () {
      const ids = [];

      Array.from(document.querySelectorAll("[data-vanila-tabs]"))

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
          this.activeByButtonElement(target.parentNode.parentNode, target);
        });

      return ids;
    },
    activeByButtonElement: function (parent, target, extra) {
      const id = this.produceId(parent);

      if (!isNode(target)) {
        warn(`target argument is not valid DOM element`, parent, target);

        return id;
      }

      let { buttons } = { ...extra };

      if (!buttons) {
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
      }

      const zeroIndex = buttons.indexOf(target) ?? 0;

      this.activeByIndex(parent, zeroIndex, { buttons });

      return id;
    },
    activeByIndex: function (parent, zeroIndex = 0, extra) {
      const id = this.produceId(parent);

      let { buttons, divs } = { ...extra };

      if (!buttons) {
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
      }

      if (buttons.length === 0) {
        warn(`buttons not found`, parent);

        return id;
      }

      if (!divs) {
        divs = Array.from(parent.querySelector("[data-tabs]").children);
      }

      if (divs.length === 0) {
        warn(`divs not found`, parent);

        return id;
      }

      if (buttons.length !== divs.length) {
        warn(`buttons and divs length mismatch`, parent);

        return id;
      }

      if (
        !(
          Number.isInteger(zeroIndex) &&
          !Number.isNaN(zeroIndex) &&
          zeroIndex > -1
        )
      ) {
        warn(`zeroIndex not found`, zeroIndex, parent, target);

        return id;
      }

      buttons.forEach(function (button, i) {
        if (i === zeroIndex) {
          button.classList.add("active");
          divs[i].classList.add("active");
        } else {
          button.classList.remove("active");
          divs[i].classList.remove("active");
        }
      });

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

        var match = target.matches("[data-vanila-tabs] > [data-buttons] > *");

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

// from: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements

const logg = (...args) => console.log("custom1.js", ...args);

class Custom1 extends HTMLElement {
  static observedAttributes = ["color", "size"];

  constructor() {
    super();
  }

  connectedCallback() {
    logg("Custom element added to page.");
  }

  disconnectedCallback() {
    logg("Custom element removed from page.");
  }

  adoptedCallback() {
    logg("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    logg(`Attribute ${name} has changed.`, {
      name,
      oldValue,
      newValue,
    });
  }
}
logg("load custom1.js");

customElements.define("custom-1", Custom1);

{
  const name = "custom-2";
  class Custom2 extends HTMLElement {
    static observedAttributes = ["redon"];
    constructor() {
      super();
      this._internals = this.attachInternals();

      this.addEventListener("click", this._onClick.bind(this));

      //   const divElem = document.createElement("div");
      //   // divElem.textContent = this.getAttribute('text');
      //   divElem.textContent = name;

      //   const shadowRoot = this.attachShadow({ mode: "open" });
      //   shadowRoot.appendChild(divElem);
    }

    get checked() {
      const val = this._internals.states.has("--red");
      console.log("get checked: ", val);
      return val;
    }

    set checked(flag) {
      console.log("set checked: ", flag);
      if (flag) {
        this._internals.states.add("--red");
      } else {
        this._internals.states.delete("--red");
      }
    }

    _onClick(event) {
      console.log("onClick: ");
      this.checked = !this.checked;
    }

    /**
     * For some weird reason toggling it with the attribute does not work.
     */
    attributeChangedCallback(name, oldValue, newValue) {
      logg(`Attribute ${name} has changed.`, {
        name,
        oldValue,
        newValue,
      });

      this.checked = typeof newValue === "string";

      console.log("state: ", this.checked);
    }
  }

  // Register the custom element
  customElements.define(name, Custom2);
}

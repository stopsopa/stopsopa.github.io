/**
 * https://codepen.io/stopsopa/pen/NWodyGJ
 */

class RotatingBox extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
        <style>
          /* Encapsulated CSS within the shadow DOM */
          .rotating-box {
            background-color: lightgray;
            width: 100px;
            height: 100px;
            margin-left: 100px;
            margin-top: 100px;
            transition: all 2s ease-in-out;
          }
          .left {
            transform: rotate(80deg);
          }
          .right {
            transform: rotate(-80deg);
          }
        </style>
        <div class="rotating-box"></div>
      `;

    const box = this.shadowRoot.querySelector(".rotating-box");
    const hasClass = (el, name) => el.classList.contains(name);
    const addClass = (el, name) => el.classList.add(name);
    const removeClass = (el, name) => el.classList.remove(name);

    const loop = () => {
      if (hasClass(box, "right")) {
        removeClass(box, "right");
        addClass(box, "left");
      } else {
        removeClass(box, "left");
        addClass(box, "right");
      }
    };
    setInterval(loop, 2000);
    setTimeout(loop, 100);
  }
}

customElements.define("rotating-box", RotatingBox);
export default RotatingBox;

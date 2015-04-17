import range, { getEasingKeys } from "./range.js";

// const log = console.log;

const target = document.querySelector("pre");

const input = document.querySelector("#range");

const easing = document.querySelector("#easing");

// let easingValue = "linear";
let easingValue = "easeInExpo";

let test = true;
test = false;

const event = (e) => {
  const v = parseInt(e.target.value);

  const b = [];

  for (let i = 0; i < v; i += 1) {
    // b.push(`i : >${String(i).padStart(3, " ")}< >${range(v, i, "xxx", true)}<`);
    b.push(
      `i : >${String(i).padStart(3, " ")}< >${JSON.stringify(
        range({ length: v, zeroIndexed: i, str: "xxx", easing: easingValue, test, firstLengthWhenEnabled: 0 })
      )}<`
    );
  }

  target.innerHTML = b.join("\n");
};

input.addEventListener("input", event);
input.addEventListener("change", event);
function trigger() {
  event({
    target: { value: input.value },
  });
}
trigger();

{
  const list = [];
  function activate(easing) {
    list.forEach((s) => {
      s.classList.remove("active");
      if (s.dataset.easing === easing) {
        s.classList.add("active");
      }
    });
  }
  getEasingKeys().forEach((e) => {
    const span = document.createElement("span");
    span.dataset.easing = e;
    span.classList.add(e);

    span.innerHTML = `
    █
<a href="https://easings.net/#${e}" target="_blank">${e}</a>        
        `;

    easing.appendChild(span);
    list.push(span);

    span.addEventListener("click", () => {
      easingValue = e;
      activate(e);
      trigger();
    });
  });
  activate(easingValue);
  //   easing.innerHTML = getEasingKeys().join(" ");
}

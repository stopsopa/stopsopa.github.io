// pages/html/input/input.ts
function handleInput(element, event, onLoad = true) {
  element.addEventListener("input", event);
  element.addEventListener("change", event);
  if (onLoad) {
    event(new Event("input"));
  }
}
export {
  handleInput as default
};

export default function handleInput(element: HTMLInputElement, event: (e: Event) => void, onLoad = true) {
  element.addEventListener("input", event);
  element.addEventListener("change", event);

  if (onLoad) {
    event(new Event("input"));
  }
}

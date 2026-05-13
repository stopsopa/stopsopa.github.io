export type HandleInputEvent = "input" | "change" | "keydown" | "keyup";

export type HandleInputOptions = {
  onLoad?: boolean;
  events?: HandleInputEvent[];
  findInputs?: (parentToBind: HTMLElement) => HTMLElement[];
  detectElement?: (el: HTMLElement) => boolean;
  observeMutations?: boolean;
};

export default function handleInput(
  parentToBind: HTMLElement,
  event: (e: Event, input: HTMLInputElement) => void,
  options: HandleInputOptions = {}
): () => void {
  if (!parentToBind) {
    parentToBind = document.body;
  }

  const {
    onLoad = false,
    events = ["input", "change"],
    findInputs = (parent: HTMLElement) => parent.querySelectorAll(`input[type="text"]`),
    detectElement = (el: HTMLElement) => el.matches(`input[type="text"]`),
    observeMutations = false,
  } = options;

  function handler(e: Event) {
    const el = e?.target as HTMLInputElement;

    if (detectElement(el)) {
      event(e, el);
    }
  }

  const unbind: (() => void)[] = [];
  for (const event of events) {
    parentToBind.addEventListener(event, handler);
    unbind.push(() => {
      parentToBind.removeEventListener(event, handler);
    });
  }

  let observer: MutationObserver | null = null;

  if (observeMutations) {
    observer = new MutationObserver((mutations) => {
      const inputs = new Set<HTMLInputElement>();

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (detectElement(node)) {
            inputs.add(node as HTMLInputElement);
          }

          [...findInputs(node)].forEach((el) => {
            if (detectElement(el as HTMLElement)) {
              inputs.add(el as HTMLInputElement);
            }
          });
        }

        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (detectElement(node)) {
            inputs.add(node as HTMLInputElement);
          }

          [...findInputs(node)].forEach((el) => {
            if (detectElement(el as HTMLElement)) {
              inputs.add(el as HTMLInputElement);
            }
          });
        }
      }

      for (const input of inputs) {
        const e = new Event("mutation");
        Object.defineProperty(e, "target", { writable: false, value: input });
        event(e, input);
      }
    });

    observer.observe(parentToBind, { childList: true, subtree: true });
  }

  if (onLoad) {
    const inputs = [...findInputs(parentToBind)] as HTMLInputElement[];

    for (const input of inputs) {
      if (detectElement(input)) {
        const e = new Event("load");
        Object.defineProperty(e, "target", { writable: false, value: input });
        event(e, input);
      }
    }
  }

  return () => {
    unbind.forEach((un) => un());
    observer?.disconnect();
  };
}

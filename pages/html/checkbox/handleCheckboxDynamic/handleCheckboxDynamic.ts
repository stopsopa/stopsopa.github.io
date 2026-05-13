/**
 * This implementation return values too
 *
 * This one will not be able to set defaults
 *
 * Names and values can repeat in checkbox elements
 */
export type HandleInputEvent = "change";

export type HandleCheckboxDynamicOptions = {
  onLoad?: boolean;
  events?: HandleInputEvent[];
  findCheckboxes?: (parentToBind: HTMLElement) => HTMLElement[];
  detectElement?: (el: HTMLElement) => boolean;
  extractKey?: (el: HTMLElement) => string;
  observeMutations?: boolean;
  alwaysReturnAllCheckboxes?: boolean;
};

export type HandleCheckboxDynamicSelectedCheckboxes = HTMLInputElement[];

export default function handleCheckboxDynamic(
  parentToBind: HTMLElement,
  event: (e: Event, checkboxes: HandleCheckboxDynamicSelectedCheckboxes) => void,
  options?: HandleCheckboxDynamicOptions
): () => void {
  function safeKeys(value: any): string[] {
    return value && typeof value === "object" ? Object.keys(value) : [];
  }

  if (!parentToBind) {
    parentToBind = document.body;
  }

  const {
    onLoad = false,
    events = ["change"],
    findCheckboxes = (parent: HTMLElement) => parent.querySelectorAll(`input[type="checkbox"]`),
    detectElement = (el: HTMLElement) => el.matches(`input[type="checkbox"]`),
    extractKey = (el: HTMLElement) => el.id || (el as HTMLInputElement)?.name,
    alwaysReturnAllCheckboxes = false,
    observeMutations = false,
  } = options || {};

  {
    const keys = safeKeys(events);
    const seen = new Set<string>(keys);
    if (keys.length === 0 || keys.length !== seen.size) {
      throw new Error(`handleCheckboxDynamic: invalid 'events': has to many keys: ${keys.length}`);
    }
  }

  function extract(el?: HTMLInputElement): { found: boolean; checkboxes: HandleCheckboxDynamicSelectedCheckboxes } {
    const values: HandleCheckboxDynamicSelectedCheckboxes = [];
    const checkboxes = [...findCheckboxes(parentToBind)] as HTMLInputElement[];

    let found = false;
    for (const checkbox of checkboxes) {
      if (detectElement(checkbox)) {
        if (!found && el && el === checkbox) {
          found = true;
        }

        const key = extractKey(checkbox);

        if (typeof key !== "string" || !key.trim()) {
          throw new Error(`handleCheckboxDynamic: invalid 'elements': invalid key`);
        }

        if (alwaysReturnAllCheckboxes || checkbox.checked) {
          values.push(checkbox);
        }
      }
    }

    return { found, checkboxes: values };
  }

  function handler(e: Event) {
    const el = e?.target as HTMLInputElement;
    const { found, checkboxes } = extract(el);

    if (found) {
      event(e, checkboxes);
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
      const affected = mutations.some((mutation) => {
        // Check added nodes
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (detectElement(node)) return true;
            if (node?.querySelector(`input[type="checkbox"]`)) return true;
          }
        }
        // Check removed nodes
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            if (detectElement(node)) return true;
            if (node?.querySelector(`input[type="checkbox"]`)) return true;
          }
        }
        return false;
      });

      if (affected) {
        const { checkboxes } = extract();
        event(new Event("mutation"), checkboxes);
      }
    });

    observer.observe(parentToBind, { childList: true, subtree: true });
  }

  if (onLoad) {
    const { checkboxes } = extract();
    event(new Event("load"), checkboxes);
  }

  return () => {
    unbind.forEach((un) => un());
    observer?.disconnect();
  };
}

export type HandleInputEvent = "change";

export type HandleCheckboxOptions = {
  onLoad?: boolean;
  events?: HandleInputEvent[];
};

type ValuesType = Record<string, boolean>;

export default function handleCheckbox(
  parentToBind: HTMLElement,
  elements: Record<string, string>, // unique name and selector for checkbox
  event: (e: Event, values: Record<string, boolean>) => void,
  options: HandleCheckboxOptions = {}
) {
  if (!parentToBind) {
    parentToBind = document.body;
  }

  const { onLoad = false, events = ["change"] } = options;

  const keys = safeKeys(elements);

  const seen = new Set<string>(keys);

  if (keys.length === 0 || keys.length !== seen.size) {
    throw new Error(`handleCheckbox: invalid 'elements': has to many keys: ${keys.length}`);
  }

  function extract(el?: HTMLInputElement): { found: boolean; values: ValuesType } {
    const values: ValuesType = {};

    let found = false;
    for (const key of keys) {
      if (!found && el && el.matches(elements[key])) {
        found = true;
      }

      values[key] = (parentToBind.querySelector(elements[key]) as HTMLInputElement)?.checked ?? false;
    }

    return { found, values };
  }

  function handler(e: Event) {
    const el = e.target as HTMLInputElement;

    const { found, values } = extract(el);

    if (found) {
      event(e, values);
    }
  }

  const unbind: (() => void)[] = [];
  for (const event of events) {
    parentToBind.addEventListener(event, handler);
    unbind.push(() => {
      parentToBind.removeEventListener(event, handler);
    });
  }

  if (onLoad) {
    const { values } = extract();

    event(new Event("load"), values);
  }

  return () => {
    unbind.forEach((un) => un());
  };
}

function safeKeys(value: any): string[] {
  return value && typeof value === "object" ? Object.keys(value) : [];
}

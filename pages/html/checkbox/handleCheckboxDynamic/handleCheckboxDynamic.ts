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
  extractValue?: (el: HTMLElement) => string;
};

export type HandleCheckboxDynamicValuesType = Array<[string, string]>;

export default function handleCheckboxDynamic(
  parentToBind: HTMLElement,

  event: (e: Event, values: HandleCheckboxDynamicValuesType) => void,

  options?: HandleCheckboxDynamicOptions
) {
  function safeKeys(value: any): string[] {
    return value && typeof value === "object" ? Object.keys(value) : [];
  }

  if (!parentToBind) {
    parentToBind = document.body;
  }

  const {
    onLoad = false,
    events = ["change"],
    findCheckboxes = (parent: HTMLElement) => parent.querySelectorAll("input[type=checkbox]"),
    detectElement = (el: HTMLElement) => el.matches("input[type=checkbox]"),
    extractKey = (el: HTMLElement) => el.id || (el as HTMLInputElement)?.name,
    extractValue = (el: HTMLElement) => (el as HTMLInputElement)?.value,
  } = options || {};

  {
    const keys = safeKeys(events);

    const seen = new Set<string>(keys);

    if (keys.length === 0 || keys.length !== seen.size) {
      throw new Error(`handleCheckboxDynamic: invalid 'events': has to many keys: ${keys.length}`);
    }
  }

  function extract(el?: HTMLInputElement): { found: boolean; values: HandleCheckboxDynamicValuesType } {
    const values: HandleCheckboxDynamicValuesType = [];

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

        const value = extractValue(checkbox);

        if (typeof value !== "string" || !value.trim()) {
          throw new Error(`handleCheckboxDynamic: invalid 'elements': invalid value for key >${key}< value >${value}<`);
        }

        if (checkbox.checked) {
          values.push([key, value]);
        }
      }
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

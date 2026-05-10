/**
 * Lightweight utility to manage a group of radio buttons using event delegation.
 *
 * Features:
 * - Event Delegation: Attaches one listener to a parent (defaults to document.body).
 * - State Management: Can set initial value (initState) and ensures a radio is checked.
 * - Callback: Fires `onChange(value, tool)` whenever a radio is clicked.
 * - Programmatic Control: Returns a `tool` object to check values, list states, or unbind.
 *
 */
export type HandleRadioTool = {
  unbind: () => void;
  bind: () => void;
  getStatus: () => boolean;
  readonly list: { el: HTMLInputElement; checked: boolean; value: string }[];
  checkByValue: (value: string) => void;
};

export type HandleRadioOptions = {
  name: string;
  selectorAll?: (name: string) => string;
  selectorOne?: (name: string, state: string) => string;
  initState?: string;
  initTrigger?: boolean;
  autoBind?: boolean;
  delegateParent?: HTMLElement;
  onChange?: (value: string, tool: HandleRadioTool) => void;
};

export default function handleRadio(opt: HandleRadioOptions): HandleRadioTool {
  let tool: HandleRadioTool;

  const {
    name,
    selectorAll = (name) => {
      return `input[type="radio"][name="${name}"]`;
    },
    selectorOne = (name, state) => {
      const s = selectorAll(name);
      return `${s}[value="${state}"]`;
    },
    initState,
    initTrigger = false,
    autoBind = true,
  } = opt;

  let { delegateParent, onChange } = opt;

  if (typeof onChange !== "function") {
    onChange = () => {};
  }

  let isBound = false;

  if (!delegateParent) {
    delegateParent = document.body;
  }

  if (typeof selectorAll !== "function") {
    throw new Error("handleRadio: selectorAll must be a function");
  }

  const s = selectorAll(name);

  if (initState) {
    const sOne = selectorOne(name, initState);

    const el = delegateParent.querySelector(sOne) as HTMLInputElement | null;

    if (el) {
      el.checked = true;
    }
  }

  let active = delegateParent.querySelector(`${s}:checked`) as HTMLInputElement | null;

  if (!active) {
    active = delegateParent.querySelector(s) as HTMLInputElement | null;

    if (active) {
      active.checked = true;
    }
  }

  const delegateFn = (e: Event) => {
    const target = e.target as HTMLInputElement;

    var match = target.matches(s);

    if (match) {
      const v = target.value;

      onChange(v, tool);
    }
  };

  if (autoBind) {
    delegateParent.addEventListener("click", delegateFn);
    isBound = true;
  }

  tool = {
    unbind: () => {
      delegateParent.removeEventListener("click", delegateFn);
      isBound = false;
    },
    bind: () => {
      delegateParent.removeEventListener("click", delegateFn);
      delegateParent.addEventListener("click", delegateFn);
      isBound = true;
    },
    getStatus: () => {
      return isBound;
    },
    get list() {
      return Array.from(delegateParent.querySelectorAll(s)).map((el: any) => ({
        el,
        checked: el.checked,
        value: el.value,
      }));
    },
    checkByValue: (value) => {
      const selector = selectorOne(name, value);

      const el = delegateParent.querySelector(selector) as HTMLInputElement | null;

      if (el) {
        el.checked = true;
      }
    },
  };

  if (initTrigger) {
    const activeEl = delegateParent.querySelector(`${s}:checked`) as HTMLInputElement | null;

    if (activeEl) {
      onChange(activeEl.value, tool);
    }
  }

  return tool;
}

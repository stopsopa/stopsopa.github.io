import { addCss, removeCss } from "./addCss";

/**
 * Don't forget to import both
 *
 * import '../components/TextareaResize.css';
 * import '../components/TextareaResize';
 *
 * To take exclusive control (don't allow user to resize textarea himself) add
 *   resize: none;
 */

let count = 0;
let handleInput: ((e: Event) => void) | null = null;
let observer: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;

let originalValueDescriptor: PropertyDescriptor | undefined;

const th = (msg: string) => new Error(`TextareaResize.ts error: ${msg}`);

function resizeTextarea(target: HTMLTextAreaElement, mode: "update" | "delete") {
  if (target.matches("textarea[data-textareaautoresize]")) {
    const id = target.getAttribute("data-textareaautoresize");

    if (typeof id !== "string" || !id.trim()) {
      console.error(
        `textarea[data-textareaautoresize] should have non-empty data-textareaautoresize attribute, target:`,
        target
      );
      return;
    }

    {
      const selector = `textarea[data-textareaautoresize="${id}"]`;
      const list = Array.from(document.querySelectorAll(selector));

      if (list.length > 1) {
        throw th(`There should be just one ${selector} but there are ${list.length}`);
      }
    }

    // console.log("triggered", target, mode, log);

    if (mode === "update") {
      addCss(`textarea[data-textareaautoresize="${id}"]{opacity: 0;height: auto;}`, {
        id,
      });

      requestAnimationFrame(() => {
        const height = target.scrollHeight;

        addCss(`textarea[data-textareaautoresize="${id}"]{overflow-y: hidden;resize: none;height:${height}px;}`, {
          id,
        });
      });

      return;
    }

    removeCss({ id });
  }
}

function handleAddedNode(node: Node) {
  if (!(node instanceof Element)) {
    return;
  }

  if (node instanceof HTMLTextAreaElement) {
    resizeTextarea(node, "update");
    resizeObserver?.observe(node);
  }

  node.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => {
    resizeTextarea(textarea, "update");
    resizeObserver?.observe(textarea);
  });
}

function handleRemovedNode(node: Node) {
  if (!(node instanceof Element)) {
    return;
  }

  if (node instanceof HTMLTextAreaElement) {
    resizeTextarea(node, "delete");
    resizeObserver?.unobserve(node);
  }

  node.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => {
    resizeTextarea(textarea, "delete");
    resizeObserver?.unobserve(textarea);
  });
}

function initListener() {
  if (count === 0) {
    handleInput = (e: Event) => {
      const target = e.target;

      if (target instanceof HTMLTextAreaElement) {
        resizeTextarea(target, "update");
      }
    };

    document.addEventListener("input", handleInput);

    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(handleAddedNode);
        mutation.removedNodes.forEach(handleRemovedNode);

        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "width" &&
          mutation.target instanceof HTMLTextAreaElement
        ) {
          resizeTextarea(mutation.target, "update");
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["width"],
    });

    resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target instanceof HTMLTextAreaElement) {
          resizeTextarea(entry.target, "update");
        }
      });
    });

    document.querySelectorAll<HTMLTextAreaElement>("textarea[data-textareaautoresize]").forEach((textarea) => {
      resizeObserver?.observe(textarea);
    });

    originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");

    if (originalValueDescriptor?.get && originalValueDescriptor?.set) {
      const originalGet = originalValueDescriptor.get;
      const originalSet = originalValueDescriptor.set;

      Object.defineProperty(HTMLTextAreaElement.prototype, "value", {
        configurable: originalValueDescriptor.configurable,
        enumerable: originalValueDescriptor.enumerable,

        get() {
          return originalGet.call(this);
        },

        set(value: string) {
          originalSet.call(this, value);

          resizeTextarea(this, "update");
        },
      });
    }
  }

  count++;
}

function tearDownListener() {
  if (count > 0) {
    count--;

    if (count === 0) {
      if (handleInput !== null) {
        document.removeEventListener("input", handleInput);
        handleInput = null;
      }

      if (observer !== null) {
        observer.disconnect();
        observer = null;
      }

      if (resizeObserver !== null) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      if (originalValueDescriptor) {
        Object.defineProperty(HTMLTextAreaElement.prototype, "value", originalValueDescriptor);

        originalValueDescriptor = undefined;
      }
    }
  }
}

// Auto-initialize if in browser
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initListener);
  } else {
    initListener();
  }
}

// Named exports
export { initListener as initTextareaAutoResize, tearDownListener as tearDownTextareaAutoResize };

// Default export
export default {
  initTextareaAutoResize: initListener,
  tearDownTextareaAutoResize: tearDownListener,
};

type OptType = {
  id?: string;
};

export function removeCss(options: OptType = {}) {
  const { id } = options;

  if (typeof id !== "string" || !id.trim()) {
    return;
  }

  const styleId = `css_${id.trim()}`;
  const styleElement = document.querySelector(`#${styleId}`);

  if (styleElement) {
    styleElement.remove();
  }
}

export function addCss(css: string, options: OptType = {}) {
  // debugger;
  const { id } = options;

  let styleId: string | undefined;
  let styleElement: HTMLStyleElement | undefined;

  const head = document.head || document.getElementsByTagName("head")[0];

  if (typeof id === "string" && id.trim()) {
    styleId = `css_${id.trim()}`;

    styleElement = document.querySelector(`#${styleId}`) as HTMLStyleElement;
  }

  if (!styleElement) {
    styleElement = document.createElement("style");

    if (styleId) {
      styleElement.id = styleId;
    }

    head.appendChild(styleElement);
  }

  styleElement.textContent = css;

  return {
    unmountStyle: () => {
      styleElement?.remove();
    },
    styleElement,
  };
}

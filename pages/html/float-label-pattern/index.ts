/**
 * Script of the demo page index.html (see index.md for names of the sections: S-TOGGLES, S-RENDER...).
 *
 * This is the source. index.js right next to it is generated from this file
 * (transpile.sh + transpile.ignore) - don't edit index.js by hand.
 *
 * Loaded as native browser ES module: <script type="module" src="index.js"></script>
 * Module scripts run after the whole html is parsed, so all elements queried below already exist.
 *
 * None of this is needed to use floating-label-pattern.css - the library has no javascript.
 */

// Makes this file a module for typescript. Without any import/export it is treated as a global script
// and its functions (render()...) collide with functions of the same name in other *.ts files of the repo.
export {};

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const WRAPPERS = ".layout-right :is(.input-wrapper, .checkbox-wrapper, .radio-wrapper)";
const CONTROLS = "input, select, textarea";

const formEl = document.querySelector<HTMLFormElement>(".layout-right form")!;
const sourceEl = document.querySelector<HTMLPreElement>("#source")!;
const rangeEl = document.querySelector<HTMLInputElement>("#range")!;
const copyButton = document.querySelector<HTMLButtonElement>("#source-copy")!;

/* -------------------------------------------------------------
   S-TOGGLES: checkboxes in the left column (C-ERRORS, C-DISABLED, C-HELPER)
   ------------------------------------------------------------- */
document.body.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  const wrappers = document.querySelectorAll<HTMLElement>(WRAPPERS);

  if (el.id === "toggle-all-errors") {
    wrappers.forEach((w) => setError(w, el.checked));
    return;
  }

  if (el.id === "toggle-all-disabled") {
    wrappers.forEach((w) => {
      w.querySelectorAll<Control>(CONTROLS).forEach((control) => {
        control.disabled = el.checked;
      });
    });
    return;
  }

  if (el.id === "toggle-helper-all") {
    wrappers.forEach((w) => w.classList.toggle("hide-helper", el.checked));
    return;
  }
});

/* -------------------------------------------------------------
   S-SETERROR
   ------------------------------------------------------------- */
/**
 * Visual part is just data-error attribute on the wrapper - that's all css needs.
 *
 * The rest is for screen readers (see comment next to the first field in index.html):
 *   - aria-invalid="true" says "this field has an error"
 *   - error element id is added to aria-describedby only when error is visible
 * Relies on id convention: control "name" -> "name-helper" and "name-error"
 */
function setError(wrapper: HTMLElement, on: boolean) {
  wrapper.toggleAttribute("data-error", on);

  wrapper.querySelectorAll<Control>(CONTROLS).forEach((control) => {
    const ids = [control.id + "-helper"];
    if (on) {
      ids.push(control.id + "-error");
      control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("aria-invalid");
    }
    const existing = ids.filter((id) => document.getElementById(id));
    if (existing.length) {
      control.setAttribute("aria-describedby", existing.join(" "));
    } else {
      control.removeAttribute("aria-describedby");
    }
  });
}

/* -------------------------------------------------------------
   S-RENDER: html source of the form
   ------------------------------------------------------------- */
/**
 * Walks through the real <form> element and prints its html into <pre id="source">.
 * Every printed element is wrapped in its own <span>, and we remember which span belongs
 * to which form element - that's how hovering over the form finds its html.
 *
 * It is LIVE: printed again every time the form changes (typing, selecting, checking,
 * and also data-error / disabled / hide-helper set by the controls on the left).
 * Current state of controls is printed the way you would write it in html to get
 * the form in exactly this state: value="..." / checked / selected / text of textarea.
 *
 * Not printed on purpose:
 *   - style attributes (form width from the range input, textarea height) - demo only stuff
 *   - value of type="password" - browser might autofill real saved password here
 */
const elementToSource = new Map<Element, HTMLSpanElement>();

const VOID = ["input", "br", "hr", "img", "meta", "link"];
// elements printed in the same line as surrounding text ("some <a>link</a>." - no extra spaces)
const INLINE = ["a", "b", "i", "em", "strong", "span", "code", "small"];
const MAX_LINE = 90;

function span(className?: string, text?: string) {
  const s = document.createElement("span");
  if (className) s.className = className;
  if (text !== undefined) s.textContent = text;
  return s;
}

// &nbsp; has to be printed as entity, otherwise it is copied as invisible character
function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/ /g, "&nbsp;");
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function tagName(node: Node) {
  return node instanceof Element ? node.tagName.toLowerCase() : "";
}

// attributes from html + attributes describing current state of the control
function attributes(el: Element) {
  const type = (el.getAttribute("type") || "text").toLowerCase();

  // Map keeps the order from html, state attributes not present in html land at the end
  const attrs = new Map(Array.from(el.attributes).map((a) => [a.name, a.value]));
  attrs.delete("style");

  const flag = (name: string, on: boolean) => (on ? attrs.set(name, "") : attrs.delete(name));

  if (el instanceof HTMLInputElement) {
    if (type === "checkbox" || type === "radio") {
      flag("checked", el.checked);
    } else if (!["submit", "button", "reset", "password", "file", "hidden"].includes(type)) {
      if (el.value === "") {
        attrs.delete("value");
      } else {
        attrs.set("value", el.value);
      }
    }
  }
  if (el instanceof HTMLOptionElement) {
    flag("selected", el.selected);
  }

  return Array.from(attrs, ([name, value]) => (value === "" ? name : `${name}="${escapeAttr(value)}"`));
}

function openTag(el: Element, indent: string) {
  const tag = tagName(el);
  const attrs = attributes(el);
  const end = VOID.includes(tag) ? " />" : ">";
  const oneLine = `<${tag}${attrs.map((a) => " " + a).join("")}${end}`;
  if (indent.length + oneLine.length <= MAX_LINE || attrs.length < 2) {
    return oneLine;
  }
  // too long: one attribute per line
  return `<${tag}\n${attrs.map((a) => `${indent}  ${a}\n`).join("")}${indent}${end.trim()}`;
}

function text(node: Node) {
  return (node.textContent || "").replace(/\s+/g, " ").trim();
}

function isInline(node: Node) {
  return node.nodeType === Node.TEXT_NODE || INLINE.includes(tagName(node));
}

// text mixed with inline elements, all in one line
function renderInline(node: Node, target: HTMLElement) {
  if (!(node instanceof Element)) {
    target.append((node.textContent || "").replace(/\s+/g, " "));
    return;
  }
  const box = span("src-el");
  elementToSource.set(node, box);
  target.append(box);
  box.append(span("src-tag", openTag(node, "")));
  node.childNodes.forEach((c) => renderInline(c, box));
  box.append(span("src-tag", `</${tagName(node)}>`));
}

function render(node: Node, indent: string, target: HTMLElement) {
  if (node.nodeType === Node.COMMENT_NODE) {
    // keep comment's own line breaks, just move it to our indentation
    const lines = (node.textContent || "").split("\n");
    const strip = Math.min(
      ...lines
        .slice(1)
        .filter((l) => l.trim())
        .map((l) => l.match(/^ */)![0].length)
    );
    const body = lines
      .map((l, i) => (i === 0 ? l : l.trim() ? indent + l.slice(isFinite(strip) ? strip - 2 : 0) : ""))
      .join("\n")
      .replace(/\s+$/, lines.length > 1 ? "\n" + indent : " ");
    target.append(indent, span("src-comment", `<!--${body}-->`), "\n");
    return;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const t = text(node);
    if (t) target.append(indent + t + "\n");
    return;
  }

  if (!(node instanceof Element)) return;

  const tag = tagName(node);
  const box = span("src-el");
  elementToSource.set(node, box);
  target.append(indent, box, "\n");

  box.append(span("src-tag", openTag(node, indent)));
  if (VOID.includes(tag)) return;

  if (node instanceof HTMLTextAreaElement) {
    // current text, printed as it is: inside textarea every space and new line counts
    box.append(escapeText(node.value), span("src-tag", `</${tag}>`));
    return;
  }

  const children = Array.from(node.childNodes).filter((c) => c.nodeType !== Node.TEXT_NODE || text(c));
  const onlyText = children.every((c) => c.nodeType === Node.TEXT_NODE);
  const inner = text(node);

  if (onlyText && indent.length + inner.length + tag.length * 2 < MAX_LINE + 20) {
    // <label for="name">Project Name *</label>
    box.append(inner);
  } else if (children.every(isInline)) {
    const line = span();
    children.forEach((c) => renderInline(c, line));
    // spaces at the edges are replaced with our own line breaks + indentation
    const first = line.firstChild!;
    const last = line.lastChild!;
    if (first.nodeType === Node.TEXT_NODE) first.textContent = (first.textContent || "").trimStart();
    if (last.nodeType === Node.TEXT_NODE) last.textContent = (last.textContent || "").trimEnd();
    box.append("\n" + indent + "  ", line, "\n" + indent);
  } else {
    box.append("\n");
    children.forEach((c) => render(c, indent + "  ", box));
    box.append(indent);
  }
  box.append(span("src-tag", `</${tag}>`));
}

function renderSource() {
  const scroll = sourceEl.scrollTop;
  elementToSource.clear();
  sourceEl.textContent = "";
  render(formEl, "", sourceEl);
  sourceEl.scrollTop = scroll;
}

renderSource();

/* -------------------------------------------------------------
   S-HOVER: hover over the form -> highlight html of the element under the mouse
   ------------------------------------------------------------- */
// element of the form, not the <span> - spans are recreated on every render
let hovered: Element | null = null;

function highlight(el: Element | null, scroll = false) {
  const old = sourceEl.querySelector(".src-hover");
  if (old) old.classList.remove("src-hover");
  hovered = el;
  const box = el && elementToSource.get(el);
  if (!box) return;
  box.classList.add("src-hover");
  if (!scroll) return;

  // scroll only the <pre>, not the page (that's why not scrollIntoView())
  const pre = sourceEl.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  if (b.top < pre.top || b.bottom > pre.bottom) {
    const margin = Math.max(20, (pre.height - b.height) / 2);
    sourceEl.scrollTop += b.top - pre.top - margin;
  }
}

formEl.addEventListener("mouseover", (e) => {
  let el = e.target as Element | null;
  // elements added later (not in the printed html) -> use closest printed parent
  while (el && !elementToSource.has(el)) el = el.parentElement;
  if (el !== hovered) highlight(el, true);
});
formEl.addEventListener("mouseleave", () => highlight(null));

/* -------------------------------------------------------------
   S-LIVE: form changed -> print html again (once per frame, no matter how many changes)
   ------------------------------------------------------------- */
let scheduled = false;

function scheduleRender() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renderSource();
    highlight(hovered);
  });
}

// typing, selecting, checking - these change properties, not attributes, so only events tell us
formEl.addEventListener("input", scheduleRender);
formEl.addEventListener("change", scheduleRender);
// values are restored after the reset event, not before
formEl.addEventListener("reset", () => setTimeout(scheduleRender));

// data-error, disabled, class, aria-* ... set by any script
new MutationObserver((mutations) => {
  // style is not printed (see comment above), so its changes are not interesting
  if (mutations.some((m) => m.attributeName !== "style")) scheduleRender();
}).observe(formEl, { attributes: true, childList: true, characterData: true, subtree: true });

/* -------------------------------------------------------------
   S-COPY: "copy all" button
   ------------------------------------------------------------- */
copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(sourceEl.textContent || "");
  copyButton.textContent = "copied";
  setTimeout(() => (copyButton.textContent = "copy all"), 1500);
});

/* -------------------------------------------------------------
   S-WIDTH: range input (C-WIDTH) sets width of the form
   ------------------------------------------------------------- */
// width of the form from css, before we start changing it
const realWidth = formEl.getBoundingClientRect().width;

function applyWidth() {
  const percent = parseInt(rangeEl.value, 10) / 100;
  formEl.style.width = Math.floor(realWidth * percent) + "px";
}

rangeEl.addEventListener("change", applyWidth);
rangeEl.addEventListener("input", applyWidth);
applyWidth();

/* -------------------------------------------------------------
   S-AUTOGROW: textarea grows with its text
   ------------------------------------------------------------- */
document.body.addEventListener("input", (e) => {
  const t = e.target;
  if (t instanceof HTMLTextAreaElement) {
    t.style.height = "auto";
    // scrollHeight doesn't include border, offsetHeight - clientHeight is height of both borders
    t.style.height = t.scrollHeight + (t.offsetHeight - t.clientHeight) + "px";
  }
});

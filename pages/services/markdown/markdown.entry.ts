/**
 * Markdown Editor entry point
 *
 * Two-column live markdown editor with URL-memorized state.
 *
 * URL params:
 *   d     - lz-string compressed content of the textarea
 *   split - left panel width in percent (10-90), absent = 50/50 default
 */

import * as LZString from "lz-string";
import "../../../lib/TextareaResize";

/* -----------------------------------------------------------------------
 * DOM refs
 * ----------------------------------------------------------------------- */
const textarea = document.getElementById("md-textarea") as HTMLTextAreaElement;
const zeroMd = document.getElementById("md-zero-md") as HTMLElement;
const leftPanel = document.getElementById("md-left") as HTMLElement;
const rightPanel = document.getElementById("md-right") as HTMLElement;
const dividerEl = document.getElementById("md-divider") as HTMLElement;
const resetBtn = document.getElementById("md-reset-split") as HTMLButtonElement;
const editorEl = document.getElementById("md-editor") as HTMLElement;

/* -----------------------------------------------------------------------
 * URL helpers
 * ----------------------------------------------------------------------- */

function getUrlParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

function setUrlParam(key: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url.toString());
}

function deleteUrlParam(key: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  window.history.replaceState({}, "", url.toString());
}

/* -----------------------------------------------------------------------
 * Markdown rendering via zero-md
 * ----------------------------------------------------------------------- */

function renderMarkdown(content: string) {
  if (content.trim()) {
    const script = document.createElement("script");
    script.type = "text/markdown";
    script.textContent = content;
    zeroMd.innerHTML = "";
    zeroMd.appendChild(script);
  } else {
    zeroMd.innerHTML = "";
  }
}

/* -----------------------------------------------------------------------
 * Textarea input → compress → URL param 'd'
 * ----------------------------------------------------------------------- */

function onTextareaInput() {
  const content = textarea.value;
  renderMarkdown(content);
  if (content) {
    const compressed = LZString.compressToEncodedURIComponent(content);
    setUrlParam("d", compressed);
  } else {
    deleteUrlParam("d");
  }
}

textarea.addEventListener("input", onTextareaInput);

/* -----------------------------------------------------------------------
 * Split / Divider
 * ----------------------------------------------------------------------- */

/*
 * Left panel width stored as integer percent in URL param 'split'.
 * When absent, both panels use flex: 1 (equal split).
 */

function applySplit(pct: number) {
  const clamped = Math.max(10, Math.min(90, pct));
  leftPanel.style.flex = "none";
  leftPanel.style.width = `${clamped}%`;
  rightPanel.style.flex = "none";
  rightPanel.style.width = `${100 - clamped}%`;
}

function clearSplit() {
  leftPanel.style.flex = "1";
  leftPanel.style.width = "";
  rightPanel.style.flex = "1";
  rightPanel.style.width = "";
}

function saveSplit(pct: number) {
  setUrlParam("split", String(Math.round(pct)));
}

function restoreSplitFromUrl() {
  const raw = getUrlParam("split");
  if (raw !== null) {
    const pct = parseFloat(raw);
    if (!isNaN(pct)) {
      applySplit(pct);
      return;
    }
  }
  clearSplit();
}

/** Reset button: remove split param and restore equal flex division */
function resetSplit() {
  clearSplit();
  deleteUrlParam("split");
  positionResetBtn();
}

resetBtn.addEventListener("click", resetSplit);

/* -----------------------------------------------------------------------
 * Reset button positioning
 * Keeps the button horizontally centered on the divider line.
 * Called after layout changes (split applied, window resize).
 * ----------------------------------------------------------------------- */

function positionResetBtn() {
  const dividerRect = dividerEl.getBoundingClientRect();
  const editorRect = editorEl.getBoundingClientRect();
  const centerX = dividerRect.left - editorRect.left + dividerRect.width / 2;
  resetBtn.style.left = `${centerX}px`;
}

/* -----------------------------------------------------------------------
 * Divider drag
 * ----------------------------------------------------------------------- */

let isDragging = false;
let dragStartX = 0;
let dragStartLeftPct = 50;

function getCurrentLeftPct(): number {
  const totalWidth = editorEl.offsetWidth - dividerEl.offsetWidth;
  if (totalWidth <= 0) return 50;
  return (leftPanel.offsetWidth / totalWidth) * 100;
}

dividerEl.addEventListener("pointerdown", (e: PointerEvent) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartLeftPct = getCurrentLeftPct();
  dividerEl.classList.add("dragging");
  dividerEl.setPointerCapture(e.pointerId);
  e.preventDefault();
});

dividerEl.addEventListener("pointermove", (e: PointerEvent) => {
  if (!isDragging) return;
  const totalWidth = editorEl.offsetWidth - dividerEl.offsetWidth;
  if (totalWidth <= 0) return;
  const deltaPct = ((e.clientX - dragStartX) / totalWidth) * 100;
  const newPct = Math.max(10, Math.min(90, dragStartLeftPct + deltaPct));
  applySplit(newPct);
  saveSplit(newPct);
  positionResetBtn();
});

dividerEl.addEventListener("pointerup", (_e: PointerEvent) => {
  isDragging = false;
  dividerEl.classList.remove("dragging");
});

dividerEl.addEventListener("pointercancel", (_e: PointerEvent) => {
  isDragging = false;
  dividerEl.classList.remove("dragging");
});

/* -----------------------------------------------------------------------
 * Init
 * ----------------------------------------------------------------------- */

(function init() {
  // Restore split from URL (or default to equal 50/50)
  restoreSplitFromUrl();

  // Position reset button over divider center
  positionResetBtn();

  // Restore content from URL param 'd'
  const compressed = getUrlParam("d");
  if (compressed) {
    const content = LZString.decompressFromEncodedURIComponent(compressed);
    if (content !== null && content !== "") {
      textarea.value = content;
      renderMarkdown(content);
    }
  }

  // Re-position reset btn on window resize
  window.addEventListener("resize", positionResetBtn);
})();

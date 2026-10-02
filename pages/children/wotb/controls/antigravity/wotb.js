/**
 * =================
 * Transpiled with transpile.ts
 * =================
 */
let config = [];
let activeSlotIndex = null;
let pendingConflict = null;
let isShiftActive = false;
let isCtrlActive = false;
let isAltActive = false;
let isCmdActive = false;
const KEYBOARD_ROWS = [
  // Function keys row
  [
    { code: "Escape", defaultLabel: "Esc" },
    { code: "F1", defaultLabel: "F1" },
    { code: "F2", defaultLabel: "F2" },
    { code: "F3", defaultLabel: "F3" },
    { code: "F4", defaultLabel: "F4" },
    { code: "F5", defaultLabel: "F5" },
    { code: "F6", defaultLabel: "F6" },
    { code: "F7", defaultLabel: "F7" },
    { code: "F8", defaultLabel: "F8" },
    { code: "F9", defaultLabel: "F9" },
    { code: "F10", defaultLabel: "F10" },
    { code: "F11", defaultLabel: "F11" },
    { code: "F12", defaultLabel: "F12" },
  ],
  // Number row
  [
    { code: "Backquote", defaultLabel: "`", shiftLabel: "~", altLabel: "`", shiftAltLabel: "`" },
    { code: "Digit1", defaultLabel: "1", shiftLabel: "!", altLabel: "\xA1", shiftAltLabel: "\u2044" },
    { code: "Digit2", defaultLabel: "2", shiftLabel: "@", altLabel: "\u2122", shiftAltLabel: "\u20AC" },
    { code: "Digit3", defaultLabel: "3", shiftLabel: "#", altLabel: "\xA3", shiftAltLabel: "\u2039" },
    { code: "Digit4", defaultLabel: "4", shiftLabel: "$", altLabel: "\xA2", shiftAltLabel: "\u203A" },
    { code: "Digit5", defaultLabel: "5", shiftLabel: "%", altLabel: "\u221E", shiftAltLabel: "\uFB01" },
    { code: "Digit6", defaultLabel: "6", shiftLabel: "^", altLabel: "\xA7", shiftAltLabel: "\uFB02" },
    { code: "Digit7", defaultLabel: "7", shiftLabel: "&", altLabel: "\xB6", shiftAltLabel: "\u2021" },
    { code: "Digit8", defaultLabel: "8", shiftLabel: "*", altLabel: "\u2022", shiftAltLabel: "\xB0" },
    { code: "Digit9", defaultLabel: "9", shiftLabel: "(", altLabel: "\xAA", shiftAltLabel: "\xB7" },
    { code: "Digit0", defaultLabel: "0", shiftLabel: ")", altLabel: "\xBA", shiftAltLabel: "\u201A" },
    { code: "Minus", defaultLabel: "-", shiftLabel: "_", altLabel: "\u2013", shiftAltLabel: "\u2014" },
    { code: "Equal", defaultLabel: "=", shiftLabel: "+", altLabel: "\u2260", shiftAltLabel: "\xB1" },
    { code: "Backspace", defaultLabel: "Delete", width: "1.5" },
  ],
  // QWERTY row
  [
    { code: "Tab", defaultLabel: "Tab", width: "1.5" },
    { code: "KeyQ", defaultLabel: "Q", shiftLabel: "Q", altLabel: "\u0153", shiftAltLabel: "\u0152" },
    { code: "KeyW", defaultLabel: "W", shiftLabel: "W", altLabel: "\u2211", shiftAltLabel: "\u201E" },
    { code: "KeyE", defaultLabel: "E", shiftLabel: "E", altLabel: "\xB4", shiftAltLabel: "\u2030" },
    { code: "KeyR", defaultLabel: "R", shiftLabel: "R", altLabel: "\xAE", shiftAltLabel: "\u2030" },
    { code: "KeyT", defaultLabel: "T", shiftLabel: "T", altLabel: "\u2020", shiftAltLabel: "\u02C7" },
    { code: "KeyY", defaultLabel: "Y", shiftLabel: "Y", altLabel: "\xA5", shiftAltLabel: "\xC1" },
    { code: "KeyU", defaultLabel: "U", shiftLabel: "U", altLabel: "\xA8", shiftAltLabel: "\xA8" },
    { code: "KeyI", defaultLabel: "I", shiftLabel: "I", altLabel: "\u02C6", shiftAltLabel: "\u02C6" },
    { code: "KeyO", defaultLabel: "O", shiftLabel: "O", altLabel: "\xF8", shiftAltLabel: "\xD8" },
    { code: "KeyP", defaultLabel: "P", shiftLabel: "P", altLabel: "\u03C0", shiftAltLabel: "\u220F" },
    { code: "BracketLeft", defaultLabel: "[", shiftLabel: "{", altLabel: "\u201C", shiftAltLabel: "\u201D" },
    { code: "BracketRight", defaultLabel: "]", shiftLabel: "}", altLabel: "\u2018", shiftAltLabel: "\u2019" },
    { code: "Backslash", defaultLabel: "\\", shiftLabel: "|", altLabel: "\xAB", shiftAltLabel: "\xBB" },
  ],
  // Home row
  [
    { code: "CapsLock", defaultLabel: "Caps", width: "1.75" },
    { code: "KeyA", defaultLabel: "A", shiftLabel: "A", altLabel: "\xE5", shiftAltLabel: "\xC5" },
    { code: "KeyS", defaultLabel: "S", shiftLabel: "S", altLabel: "\xDF", shiftAltLabel: "\xCD" },
    { code: "KeyD", defaultLabel: "D", shiftLabel: "D", altLabel: "\u2202", shiftAltLabel: "\xCE" },
    { code: "KeyF", defaultLabel: "F", shiftLabel: "F", altLabel: "\u0192", shiftAltLabel: "\xCF" },
    { code: "KeyG", defaultLabel: "G", shiftLabel: "G", altLabel: "\xA9", shiftAltLabel: "\u02DD" },
    { code: "KeyH", defaultLabel: "H", shiftLabel: "H", altLabel: "\u02D9", shiftAltLabel: "\xD3" },
    { code: "KeyJ", defaultLabel: "J", shiftLabel: "J", altLabel: "\u2206", shiftAltLabel: "\xD4" },
    { code: "KeyK", defaultLabel: "K", shiftLabel: "K", altLabel: "\u02DA", shiftAltLabel: "\uF8FF" },
    { code: "KeyL", defaultLabel: "L", shiftLabel: "L", altLabel: "\xAC", shiftAltLabel: "\xD2" },
    { code: "Semicolon", defaultLabel: ";", shiftLabel: ":", altLabel: "\u2026", shiftAltLabel: "\xDA" },
    { code: "Quote", defaultLabel: "'", shiftLabel: '"', altLabel: "\xE6", shiftAltLabel: "\xC6" },
    { code: "Enter", defaultLabel: "Enter", width: "1.75" },
  ],
  // Bottom row
  [
    { code: "ShiftLeft", defaultLabel: "LShift", width: "2" },
    { code: "KeyZ", defaultLabel: "Z", shiftLabel: "Z", altLabel: "\u03A9", shiftAltLabel: "\xB8" },
    { code: "KeyX", defaultLabel: "X", shiftLabel: "X", altLabel: "\u2248", shiftAltLabel: "\u02DB" },
    { code: "KeyC", defaultLabel: "C", shiftLabel: "C", altLabel: "\xE7", shiftAltLabel: "\xC7" },
    { code: "KeyV", defaultLabel: "V", shiftLabel: "V", altLabel: "\u221A", shiftAltLabel: "\u25CA" },
    { code: "KeyB", defaultLabel: "B", shiftLabel: "B", altLabel: "\u222B", shiftAltLabel: "\u0131" },
    { code: "KeyN", defaultLabel: "N", shiftLabel: "N", altLabel: "\u02DC", shiftAltLabel: "\u02DC" },
    { code: "KeyM", defaultLabel: "M", shiftLabel: "M", altLabel: "\xB5", shiftAltLabel: "\xC2" },
    { code: "Comma", defaultLabel: ",", shiftLabel: "<", altLabel: "\u2264", shiftAltLabel: "\xAF" },
    { code: "Period", defaultLabel: ".", shiftLabel: ">", altLabel: "\u2265", shiftAltLabel: "\u02D8" },
    { code: "Slash", defaultLabel: "/", shiftLabel: "?", altLabel: "\xF7", shiftAltLabel: "\xBF" },
    { code: "ShiftRight", defaultLabel: "RShift", width: "2" },
  ],
  // Modifier & Space row
  [
    { code: "ControlLeft", defaultLabel: "LCtrl", width: "1.25" },
    { code: "AltLeft", defaultLabel: "Option", width: "1.25" },
    { code: "MetaLeft", defaultLabel: "Cmd", width: "1.25" },
    { code: "Space", defaultLabel: "Space", width: "5" },
    { code: "MetaRight", defaultLabel: "Cmd", width: "1.25" },
    { code: "AltRight", defaultLabel: "Option", width: "1.25" },
    { code: "ControlRight", defaultLabel: "RCtrl", width: "1.25" },
    { code: "ArrowLeft", defaultLabel: "\u2190" },
    { code: "ArrowUp", defaultLabel: "\u2191" },
    { code: "ArrowDown", defaultLabel: "\u2193" },
    { code: "ArrowRight", defaultLabel: "\u2192" },
  ],
];
const DEFAULT_CONFIG = [
  { type: "range", label: "mouse sensitivity", default: 97, value: 97, min: 0, max: 100, step: 1 },
  { type: "range", label: "mouse sensitivity in aiming mode", default: 100, value: 100, min: 0, max: 100, step: 1 },
  { type: "checkbox", label: "inverted zoom", default: false, value: false },
  { type: "checkbox", label: "invert vertical mouse movement", default: false, value: false },
  { type: "checkbox", label: "aiming mode", subtitle: "Manual zoom", default: false, value: false },
  {
    type: "checkbox",
    label: "reverse zoom",
    subtitle: "The camera provides a wider angle behind the vehicle while reversing",
    default: true,
    value: true,
  },
  { type: "cell", label: "move forward", default: "W", value: "W" },
  { type: "cell", label: "shell 1", default: "`", value: "`" },
  { type: "cell", label: "capture the base!", subtitle: "Command in Battle", default: "F4", value: "F4" },
  { type: "cell", label: "move backward", default: "S", value: "S" },
  { type: "cell", label: "shell 2", default: "Z", value: "Z" },
  { type: "cell", label: "affirmative!", subtitle: "Command in Battle", default: "F5", value: "F5" },
  { type: "cell", label: "turn left", default: "A", value: "A" },
  { type: "cell", label: "shell 3", default: "X", value: "X" },
  { type: "cell", label: "negative!", subtitle: "Command in Battle", default: "F6", value: "F6" },
  { type: "cell", label: "turn right", default: "D", value: "D" },
  { type: "cell", label: "consumables 1", subtitle: "Slot one", default: "1", value: "1" },
  { type: "cell", label: "help!", subtitle: "Command in Battle", default: "F", value: "F" },
  { type: "cell", label: "fire", default: "L MOUSE", value: "L MOUSE" },
  { type: "cell", label: "consumables 2", subtitle: "Slot two", default: "2", value: "2" },
  { type: "cell", label: "moving here!", subtitle: "Command in Battle", default: "]", value: "]" },
  { type: "cell", label: "auto-aim", default: "R MOUSE", value: "R MOUSE" },
  { type: "cell", label: "consumables 3", subtitle: "Slot three", default: "3", value: "3" },
  { type: "cell", label: "driving to base a", subtitle: "Command in Battle", default: "LCTRL+1", value: "LCTRL+1" },
  { type: "cell", label: "sniper mode", default: "LShift", value: "LShift" },
  { type: "cell", label: "ability 1", default: "Space", value: "Space" },
  { type: "cell", label: "driving to base b", subtitle: "Command in Battle", default: "LCTRL+2", value: "LCTRL+2" },
  { type: "cell", label: "quick commands", default: "V", value: "V" },
  { type: "cell", label: "driving to base c", subtitle: "Command in Battle", default: "LCTRL+3", value: "LCTRL+3" },
  { type: "cell", label: "hide minimap", default: "M", value: "M" },
  { type: "cell", label: "team chat", default: "Enter", value: "Enter" },
  { type: "cell", label: "driving to base d", subtitle: "Command in Battle", default: "LCTRL+4", value: "LCTRL+4" },
  { type: "cell", label: "zoom minimap out", default: "-", value: "-" },
  { type: "cell", label: "platoon chat", default: "LCTRL+Enter", value: "LCTRL+Enter" },
  { type: "cell", label: "driving to base e", subtitle: "Command in Battle", default: "LCTRL+5", value: "LCTRL+5" },
  { type: "cell", label: "zoom minimap in", default: "=", value: "=" },
  { type: "cell", label: "gun reload", default: "R", value: "R" },
  { type: "cell", label: "driving to base f", subtitle: "Command in Battle", default: "LCTRL+6", value: "LCTRL+6" },
  { type: "cell", label: "list of players", default: "Tab", value: "Tab" },
  { type: "cell", label: "booster slot 1", default: "Y", value: "Y" },
  { type: "cell", label: "attack!", subtitle: "Command in Battle", default: "N", value: "N" },
  { type: "cell", label: "booster slot 6", default: "H", value: "H" },
];
async function loadConfig() {
  try {
    const res = await fetch("./json.json");
    if (res.ok) {
      config = await res.json();
    } else {
      config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  } catch (_e) {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  renderAll();
}
function getKeyDisplayLabel(keyDef) {
  if (isShiftActive && isAltActive && keyDef.shiftAltLabel) {
    return keyDef.shiftAltLabel;
  }
  if (isShiftActive && keyDef.shiftLabel) {
    return keyDef.shiftLabel;
  }
  if (isAltActive && keyDef.altLabel) {
    return keyDef.altLabel;
  }
  return keyDef.defaultLabel;
}
function renderAll() {
  renderTopControls();
  renderKeyGrid();
}
function renderTopControls() {
  const topContainer = document.getElementById("top-controls");
  if (!topContainer) return;
  topContainer.innerHTML = "";
  const rangeAndCheckboxes = config.filter((item) => item.type === "range" || item.type === "checkbox");
  const rangeItems = rangeAndCheckboxes.filter((item) => item.type === "range");
  rangeItems.forEach((rangeItem) => {
    const row = document.createElement("div");
    row.className = "top-row range-row";
    const labelBox = document.createElement("div");
    labelBox.className = "range-label";
    labelBox.innerHTML = `<strong>${rangeItem.label.toUpperCase()}:</strong> <span class="range-val">${
      rangeItem.value
    }%</span>`;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(rangeItem.min ?? 0);
    slider.max = String(rangeItem.max ?? 100);
    slider.step = String(rangeItem.step ?? 1);
    slider.value = String(rangeItem.value);
    slider.className = "range-input";
    slider.addEventListener("input", (e) => {
      const target = e.target;
      const numVal = Number(target.value);
      rangeItem.value = numVal;
      const valSpan = labelBox.querySelector(".range-val");
      if (valSpan) valSpan.textContent = `${numVal}%`;
    });
    row.appendChild(labelBox);
    row.appendChild(slider);
    topContainer.appendChild(row);
  });
  const checkboxItems = rangeAndCheckboxes.filter((item) => item.type === "checkbox");
  const checkboxGrid = document.createElement("div");
  checkboxGrid.className = "checkbox-grid";
  checkboxItems.forEach((chkItem) => {
    const itemBox = document.createElement("div");
    itemBox.className = "checkbox-cell";
    const info = document.createElement("div");
    info.className = "cell-info";
    const title = document.createElement("span");
    title.className = "cell-title";
    title.textContent = chkItem.label.toUpperCase();
    info.appendChild(title);
    if (chkItem.subtitle) {
      const sub = document.createElement("span");
      sub.className = "cell-subtitle";
      sub.textContent = chkItem.subtitle;
      info.appendChild(sub);
    }
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = chkItem.value;
    checkbox.className = "custom-checkbox";
    checkbox.addEventListener("change", (e) => {
      const target = e.target;
      chkItem.value = target.checked;
    });
    itemBox.appendChild(info);
    itemBox.appendChild(checkbox);
    checkboxGrid.appendChild(itemBox);
  });
  topContainer.appendChild(checkboxGrid);
}
function renderKeyGrid() {
  const gridContainer = document.getElementById("key-grid");
  if (!gridContainer) return;
  gridContainer.innerHTML = "";
  config.forEach((item, index) => {
    if (item.type !== "cell") return;
    const cellEl = document.createElement("div");
    cellEl.className = "key-cell";
    const info = document.createElement("div");
    info.className = "cell-info";
    const title = document.createElement("span");
    title.className = "cell-title";
    title.textContent = item.label.toUpperCase();
    info.appendChild(title);
    if (item.subtitle) {
      const sub = document.createElement("span");
      sub.className = "cell-subtitle";
      sub.textContent = item.subtitle;
      info.appendChild(sub);
    }
    const keyButton = document.createElement("button");
    keyButton.type = "button";
    keyButton.className = "key-button";
    keyButton.textContent = item.value !== null ? item.value : "[NONE]";
    if (item.value === null) {
      keyButton.classList.add("key-empty");
    }
    keyButton.addEventListener("click", () => {
      openKeyboardModal(index);
    });
    cellEl.appendChild(info);
    cellEl.appendChild(keyButton);
    gridContainer.appendChild(cellEl);
  });
}
function openKeyboardModal(cellIndex) {
  activeSlotIndex = cellIndex;
  const item = config[cellIndex];
  if (!item || item.type !== "cell") return;
  const modal = document.getElementById("keyboard-modal");
  const targetLabel = document.getElementById("modal-target-label");
  const currentValSpan = document.getElementById("modal-current-val");
  if (targetLabel) targetLabel.textContent = item.label.toUpperCase();
  if (currentValSpan) currentValSpan.textContent = item.value ? item.value : "[NONE]";
  isShiftActive = false;
  isCtrlActive = false;
  isAltActive = false;
  isCmdActive = false;
  updateModifierUI();
  renderVisualKeyboard();
  if (modal) modal.style.display = "flex";
}
function closeKeyboardModal() {
  const modal = document.getElementById("keyboard-modal");
  if (modal) modal.style.display = "none";
  activeSlotIndex = null;
}
function updateModifierUI() {
  const btnShift = document.getElementById("mod-shift");
  const btnCtrl = document.getElementById("mod-ctrl");
  const btnAlt = document.getElementById("mod-alt");
  const btnCmd = document.getElementById("mod-cmd");
  if (btnShift) btnShift.classList.toggle("active", isShiftActive);
  if (btnCtrl) btnCtrl.classList.toggle("active", isCtrlActive);
  if (btnAlt) btnAlt.classList.toggle("active", isAltActive);
  if (btnCmd) btnCmd.classList.toggle("active", isCmdActive);
}
function renderVisualKeyboard() {
  const container = document.getElementById("virtual-keyboard");
  if (!container) return;
  container.innerHTML = "";
  KEYBOARD_ROWS.forEach((rowDefs) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    rowDefs.forEach((kDef) => {
      const keyBtn = document.createElement("button");
      keyBtn.type = "button";
      keyBtn.className = "kb-key";
      if (kDef.width) {
        keyBtn.style.flex = kDef.width;
      }
      const displayLabel = getKeyDisplayLabel(kDef);
      keyBtn.textContent = displayLabel;
      keyBtn.addEventListener("click", () => {
        handleKeySelection(kDef.defaultLabel);
      });
      rowEl.appendChild(keyBtn);
    });
    container.appendChild(rowEl);
  });
}
function buildFinalKeyString(baseKey) {
  if (
    baseKey === "LCtrl" ||
    baseKey === "RCtrl" ||
    baseKey === "LShift" ||
    baseKey === "RShift" ||
    baseKey === "Option" ||
    baseKey === "Cmd"
  ) {
    return baseKey;
  }
  const parts = [];
  if (isCtrlActive) parts.push("LCTRL");
  if (isShiftActive) parts.push("LSHIFT");
  if (isAltActive) parts.push("LALT");
  if (isCmdActive) parts.push("CMD");
  if (parts.length > 0) {
    return `${parts.join("+")}+${baseKey}`;
  }
  return baseKey;
}
function handleKeySelection(rawKey) {
  if (activeSlotIndex === null) return;
  const finalKey = buildFinalKeyString(rawKey);
  const conflictIndex = config.findIndex(
    (item, idx) => idx !== activeSlotIndex && item.type === "cell" && item.value === finalKey
  );
  if (conflictIndex !== -1) {
    showConflictPrompt(activeSlotIndex, conflictIndex, finalKey);
  } else {
    const targetItem = config[activeSlotIndex];
    if (targetItem && targetItem.type === "cell") {
      targetItem.value = finalKey;
    }
    closeKeyboardModal();
    renderKeyGrid();
  }
}
function showConflictPrompt(targetIndex, conflictIndex, newKey) {
  pendingConflict = { targetIndex, conflictIndex, newKey };
  const targetItem = config[targetIndex];
  const conflictingItem = config[conflictIndex];
  const conflictBanner = document.getElementById("conflict-modal");
  const conflictText = document.getElementById("conflict-message");
  if (conflictText && targetItem && conflictingItem) {
    conflictText.innerHTML = `Key <strong>"${newKey}"</strong> is already bound to <strong>"${conflictingItem.label.toUpperCase()}"</strong>.<br>Do you want to override and clear <strong>"${conflictingItem.label.toUpperCase()}"</strong>?`;
  }
  if (conflictBanner) conflictBanner.style.display = "flex";
}
function confirmConflictOverride() {
  if (!pendingConflict) return;
  const { targetIndex, conflictIndex, newKey } = pendingConflict;
  const targetItem = config[targetIndex];
  const conflictingItem = config[conflictIndex];
  if (targetItem && targetItem.type === "cell") {
    targetItem.value = newKey;
  }
  if (conflictingItem && conflictingItem.type === "cell") {
    conflictingItem.value = null;
  }
  pendingConflict = null;
  const conflictBanner = document.getElementById("conflict-modal");
  if (conflictBanner) conflictBanner.style.display = "none";
  closeKeyboardModal();
  renderKeyGrid();
}
function cancelConflictOverride() {
  pendingConflict = null;
  const conflictBanner = document.getElementById("conflict-modal");
  if (conflictBanner) conflictBanner.style.display = "none";
}
function clearCurrentSlot() {
  if (activeSlotIndex !== null) {
    const item = config[activeSlotIndex];
    if (item && item.type === "cell") {
      item.value = null;
    }
    closeKeyboardModal();
    renderKeyGrid();
  }
}
function downloadConfigJSON() {
  const jsonStr = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "json.json";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
function resetToDefaults() {
  config.forEach((item) => {
    item.value = item.default;
  });
  renderAll();
}
function setupEventListeners() {
  document.getElementById("modal-close-btn")?.addEventListener("click", closeKeyboardModal);
  document.getElementById("modal-clear-btn")?.addEventListener("click", clearCurrentSlot);
  document.getElementById("conflict-override-btn")?.addEventListener("click", confirmConflictOverride);
  document.getElementById("conflict-cancel-btn")?.addEventListener("click", cancelConflictOverride);
  document.getElementById("download-json-btn")?.addEventListener("click", downloadConfigJSON);
  document.getElementById("reset-defaults-btn")?.addEventListener("click", resetToDefaults);
  document.getElementById("mod-shift")?.addEventListener("click", () => {
    isShiftActive = !isShiftActive;
    updateModifierUI();
    renderVisualKeyboard();
  });
  document.getElementById("mod-ctrl")?.addEventListener("click", () => {
    isCtrlActive = !isCtrlActive;
    updateModifierUI();
    renderVisualKeyboard();
  });
  document.getElementById("mod-alt")?.addEventListener("click", () => {
    isAltActive = !isAltActive;
    updateModifierUI();
    renderVisualKeyboard();
  });
  document.getElementById("mod-cmd")?.addEventListener("click", () => {
    isCmdActive = !isCmdActive;
    updateModifierUI();
    renderVisualKeyboard();
  });
  document.querySelectorAll(".mouse-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mouseVal = btn.getAttribute("data-key");
      if (mouseVal) handleKeySelection(mouseVal);
    });
  });
  window.addEventListener("keydown", (e) => {
    const modal = document.getElementById("keyboard-modal");
    if (!modal || modal.style.display === "none") return;
    if (e.key === "Escape") {
      closeKeyboardModal();
      return;
    }
    if (
      e.shiftKey !== isShiftActive ||
      e.altKey !== isAltActive ||
      e.ctrlKey !== isCtrlActive ||
      e.metaKey !== isCmdActive
    ) {
      isShiftActive = e.shiftKey;
      isAltActive = e.altKey;
      isCtrlActive = e.ctrlKey;
      isCmdActive = e.metaKey;
      updateModifierUI();
      renderVisualKeyboard();
    }
  });
  window.addEventListener("keyup", (e) => {
    const modal = document.getElementById("keyboard-modal");
    if (!modal || modal.style.display === "none") return;
    if (
      e.shiftKey !== isShiftActive ||
      e.altKey !== isAltActive ||
      e.ctrlKey !== isCtrlActive ||
      e.metaKey !== isCmdActive
    ) {
      isShiftActive = e.shiftKey;
      isAltActive = e.altKey;
      isCtrlActive = e.ctrlKey;
      isCmdActive = e.metaKey;
      updateModifierUI();
      renderVisualKeyboard();
    }
  });
}
window.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadConfig();
});

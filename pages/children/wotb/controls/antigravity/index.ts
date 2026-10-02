/*
 * Type definitions for WOTB Control Settings
 * Backbone format for all control rows and cells
 */

export interface BaseControlSetting {
  label: string;
  subtitle?: string;
}

export interface RangeControlSetting extends BaseControlSetting {
  type: "range";
  default: number;
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface CheckboxControlSetting extends BaseControlSetting {
  type: "checkbox";
  default: boolean;
  value: boolean;
}

export interface CellControlSetting extends BaseControlSetting {
  type: "cell";
  default: string | null;
  value: string | null;
}

export type ControlSetting = RangeControlSetting | CheckboxControlSetting | CellControlSetting;
export type ControlsConfig = ControlSetting[];

/*
 * State variables for managing controls configuration,
 * modal dialogs, and active keyboard modifiers
 */
let config: ControlsConfig = [];
let activeSlotIndex: number | null = null;
let pendingConflict: { targetIndex: number; conflictIndex: number; newKey: string } | null = null;

let isShiftActive = false;
let isCtrlActive = false;
let isAltActive = false;
let isCmdActive = false;

/*
 * Mac keyboard key maps for default, Shift, Option (Alt), and Shift+Option
 * Simulates real Mac keyboard character mappings
 */
interface KeyDef {
  code: string;
  defaultLabel: string;
  shiftLabel?: string;
  altLabel?: string;
  shiftAltLabel?: string;
  width?: string;
}

const KEYBOARD_ROWS: KeyDef[][] = [
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
    { code: "Digit1", defaultLabel: "1", shiftLabel: "!", altLabel: "¡", shiftAltLabel: "⁄" },
    { code: "Digit2", defaultLabel: "2", shiftLabel: "@", altLabel: "™", shiftAltLabel: "€" },
    { code: "Digit3", defaultLabel: "3", shiftLabel: "#", altLabel: "£", shiftAltLabel: "‹" },
    { code: "Digit4", defaultLabel: "4", shiftLabel: "$", altLabel: "¢", shiftAltLabel: "›" },
    { code: "Digit5", defaultLabel: "5", shiftLabel: "%", altLabel: "∞", shiftAltLabel: "ﬁ" },
    { code: "Digit6", defaultLabel: "6", shiftLabel: "^", altLabel: "§", shiftAltLabel: "ﬂ" },
    { code: "Digit7", defaultLabel: "7", shiftLabel: "&", altLabel: "¶", shiftAltLabel: "‡" },
    { code: "Digit8", defaultLabel: "8", shiftLabel: "*", altLabel: "•", shiftAltLabel: "°" },
    { code: "Digit9", defaultLabel: "9", shiftLabel: "(", altLabel: "ª", shiftAltLabel: "·" },
    { code: "Digit0", defaultLabel: "0", shiftLabel: ")", altLabel: "º", shiftAltLabel: "‚" },
    { code: "Minus", defaultLabel: "-", shiftLabel: "_", altLabel: "–", shiftAltLabel: "—" },
    { code: "Equal", defaultLabel: "=", shiftLabel: "+", altLabel: "≠", shiftAltLabel: "±" },
    { code: "Backspace", defaultLabel: "Delete", width: "1.5" },
  ],
  // QWERTY row
  [
    { code: "Tab", defaultLabel: "Tab", width: "1.5" },
    { code: "KeyQ", defaultLabel: "Q", shiftLabel: "Q", altLabel: "œ", shiftAltLabel: "Œ" },
    { code: "KeyW", defaultLabel: "W", shiftLabel: "W", altLabel: "∑", shiftAltLabel: "„" },
    { code: "KeyE", defaultLabel: "E", shiftLabel: "E", altLabel: "´", shiftAltLabel: "‰" },
    { code: "KeyR", defaultLabel: "R", shiftLabel: "R", altLabel: "®", shiftAltLabel: "‰" },
    { code: "KeyT", defaultLabel: "T", shiftLabel: "T", altLabel: "†", shiftAltLabel: "ˇ" },
    { code: "KeyY", defaultLabel: "Y", shiftLabel: "Y", altLabel: "¥", shiftAltLabel: "Á" },
    { code: "KeyU", defaultLabel: "U", shiftLabel: "U", altLabel: "¨", shiftAltLabel: "¨" },
    { code: "KeyI", defaultLabel: "I", shiftLabel: "I", altLabel: "ˆ", shiftAltLabel: "ˆ" },
    { code: "KeyO", defaultLabel: "O", shiftLabel: "O", altLabel: "ø", shiftAltLabel: "Ø" },
    { code: "KeyP", defaultLabel: "P", shiftLabel: "P", altLabel: "π", shiftAltLabel: "∏" },
    { code: "BracketLeft", defaultLabel: "[", shiftLabel: "{", altLabel: "“", shiftAltLabel: "”" },
    { code: "BracketRight", defaultLabel: "]", shiftLabel: "}", altLabel: "‘", shiftAltLabel: "’" },
    { code: "Backslash", defaultLabel: "\\", shiftLabel: "|", altLabel: "«", shiftAltLabel: "»" },
  ],
  // Home row
  [
    { code: "CapsLock", defaultLabel: "Caps", width: "1.75" },
    { code: "KeyA", defaultLabel: "A", shiftLabel: "A", altLabel: "å", shiftAltLabel: "Å" },
    { code: "KeyS", defaultLabel: "S", shiftLabel: "S", altLabel: "ß", shiftAltLabel: "Í" },
    { code: "KeyD", defaultLabel: "D", shiftLabel: "D", altLabel: "∂", shiftAltLabel: "Î" },
    { code: "KeyF", defaultLabel: "F", shiftLabel: "F", altLabel: "ƒ", shiftAltLabel: "Ï" },
    { code: "KeyG", defaultLabel: "G", shiftLabel: "G", altLabel: "©", shiftAltLabel: "˝" },
    { code: "KeyH", defaultLabel: "H", shiftLabel: "H", altLabel: "˙", shiftAltLabel: "Ó" },
    { code: "KeyJ", defaultLabel: "J", shiftLabel: "J", altLabel: "∆", shiftAltLabel: "Ô" },
    { code: "KeyK", defaultLabel: "K", shiftLabel: "K", altLabel: "˚", shiftAltLabel: "" },
    { code: "KeyL", defaultLabel: "L", shiftLabel: "L", altLabel: "¬", shiftAltLabel: "Ò" },
    { code: "Semicolon", defaultLabel: ";", shiftLabel: ":", altLabel: "…", shiftAltLabel: "Ú" },
    { code: "Quote", defaultLabel: "'", shiftLabel: '"', altLabel: "æ", shiftAltLabel: "Æ" },
    { code: "Enter", defaultLabel: "Enter", width: "1.75" },
  ],
  // Bottom row
  [
    { code: "ShiftLeft", defaultLabel: "LShift", width: "2" },
    { code: "KeyZ", defaultLabel: "Z", shiftLabel: "Z", altLabel: "Ω", shiftAltLabel: "¸" },
    { code: "KeyX", defaultLabel: "X", shiftLabel: "X", altLabel: "≈", shiftAltLabel: "˛" },
    { code: "KeyC", defaultLabel: "C", shiftLabel: "C", altLabel: "ç", shiftAltLabel: "Ç" },
    { code: "KeyV", defaultLabel: "V", shiftLabel: "V", altLabel: "√", shiftAltLabel: "◊" },
    { code: "KeyB", defaultLabel: "B", shiftLabel: "B", altLabel: "∫", shiftAltLabel: "ı" },
    { code: "KeyN", defaultLabel: "N", shiftLabel: "N", altLabel: "˜", shiftAltLabel: "˜" },
    { code: "KeyM", defaultLabel: "M", shiftLabel: "M", altLabel: "µ", shiftAltLabel: "Â" },
    { code: "Comma", defaultLabel: ",", shiftLabel: "<", altLabel: "≤", shiftAltLabel: "¯" },
    { code: "Period", defaultLabel: ".", shiftLabel: ">", altLabel: "≥", shiftAltLabel: "˘" },
    { code: "Slash", defaultLabel: "/", shiftLabel: "?", altLabel: "÷", shiftAltLabel: "¿" },
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
    { code: "ArrowLeft", defaultLabel: "←" },
    { code: "ArrowUp", defaultLabel: "↑" },
    { code: "ArrowDown", defaultLabel: "↓" },
    { code: "ArrowRight", defaultLabel: "→" },
  ],
];

/*
 * Fallback configuration loaded if fetching json.json fails
 * Provides exact defaults identical to screenshot
 */
const DEFAULT_CONFIG: ControlsConfig = [
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

/*
 * Load configuration from json.json or fallback array
 * Populates grid and initializes all user interactions
 */
async function loadConfig(): Promise<void> {
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

/*
 * Calculate displayed key face character based on active Mac modifiers
 */
function getKeyDisplayLabel(keyDef: KeyDef): string {
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

/*
 * Render entire controls container: top sliders, checkboxes, and 3-column key grid
 */
function renderAll(): void {
  renderTopControls();
  renderKeyGrid();
}

/*
 * Render top rows: range sliders and toggle checkboxes
 */
function renderTopControls(): void {
  const topContainer = document.getElementById("top-controls");
  if (!topContainer) return;
  topContainer.innerHTML = "";

  const rangeAndCheckboxes = config.filter((item) => item.type === "range" || item.type === "checkbox");

  // Group range items
  const rangeItems = rangeAndCheckboxes.filter((item): item is RangeControlSetting => item.type === "range");
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
      const target = e.target as HTMLInputElement;
      const numVal = Number(target.value);
      rangeItem.value = numVal;
      const valSpan = labelBox.querySelector(".range-val");
      if (valSpan) valSpan.textContent = `${numVal}%`;
    });

    row.appendChild(labelBox);
    row.appendChild(slider);
    topContainer.appendChild(row);
  });

  // Group checkbox items into 2-column rows
  const checkboxItems = rangeAndCheckboxes.filter((item): item is CheckboxControlSetting => item.type === "checkbox");
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
      const target = e.target as HTMLInputElement;
      chkItem.value = target.checked;
    });

    itemBox.appendChild(info);
    itemBox.appendChild(checkbox);
    checkboxGrid.appendChild(itemBox);
  });

  topContainer.appendChild(checkboxGrid);
}

/*
 * Render the 3-column customizable keybinding grid
 */
function renderKeyGrid(): void {
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

/*
 * Open keyboard selector popup for a specific cell slot
 */
function openKeyboardModal(cellIndex: number): void {
  activeSlotIndex = cellIndex;
  const item = config[cellIndex];
  if (!item || item.type !== "cell") return;

  const modal = document.getElementById("keyboard-modal");
  const targetLabel = document.getElementById("modal-target-label");
  const currentValSpan = document.getElementById("modal-current-val");

  if (targetLabel) targetLabel.textContent = item.label.toUpperCase();
  if (currentValSpan) currentValSpan.textContent = item.value ? item.value : "[NONE]";

  // Reset modifier toggles on open
  isShiftActive = false;
  isCtrlActive = false;
  isAltActive = false;
  isCmdActive = false;

  updateModifierUI();
  renderVisualKeyboard();

  if (modal) modal.style.display = "flex";
}

/*
 * Close keyboard selector popup
 */
function closeKeyboardModal(): void {
  const modal = document.getElementById("keyboard-modal");
  if (modal) modal.style.display = "none";
  activeSlotIndex = null;
}

/*
 * Update modifier state indicator buttons in the modal
 */
function updateModifierUI(): void {
  const btnShift = document.getElementById("mod-shift");
  const btnCtrl = document.getElementById("mod-ctrl");
  const btnAlt = document.getElementById("mod-alt");
  const btnCmd = document.getElementById("mod-cmd");

  if (btnShift) btnShift.classList.toggle("active", isShiftActive);
  if (btnCtrl) btnCtrl.classList.toggle("active", isCtrlActive);
  if (btnAlt) btnAlt.classList.toggle("active", isAltActive);
  if (btnCmd) btnCmd.classList.toggle("active", isCmdActive);
}

/*
 * Render keys inside visual popup keyboard with current dynamic labels
 */
function renderVisualKeyboard(): void {
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

/*
 * Build final key representation taking active modifiers into account
 */
function buildFinalKeyString(baseKey: string): string {
  // If base key is already a modifier, just return it
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

  // Prepend active modifier prefixes if selected
  const parts: string[] = [];
  if (isCtrlActive) parts.push("LCTRL");
  if (isShiftActive) parts.push("LSHIFT");
  if (isAltActive) parts.push("LALT");
  if (isCmdActive) parts.push("CMD");

  if (parts.length > 0) {
    return `${parts.join("+")}+${baseKey}`;
  }
  return baseKey;
}

/*
 * Handle key selection, checking for conflicts across all cells
 */
function handleKeySelection(rawKey: string): void {
  if (activeSlotIndex === null) return;

  const finalKey = buildFinalKeyString(rawKey);

  // Check for conflicts with other cells
  const conflictIndex = config.findIndex(
    (item, idx) => idx !== activeSlotIndex && item.type === "cell" && item.value === finalKey
  );

  if (conflictIndex !== -1) {
    // Conflict detected: show conflict modal and wait for user override/cancel
    showConflictPrompt(activeSlotIndex, conflictIndex, finalKey);
  } else {
    // No conflict: assign immediately
    const targetItem = config[activeSlotIndex];
    if (targetItem && targetItem.type === "cell") {
      targetItem.value = finalKey;
    }
    closeKeyboardModal();
    renderKeyGrid();
  }
}

/*
 * Show conflict notification allowing user to override or cancel
 */
function showConflictPrompt(targetIndex: number, conflictIndex: number, newKey: string): void {
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

/*
 * Confirm conflict override: reassigns key and sets conflicting slot to null
 */
function confirmConflictOverride(): void {
  if (!pendingConflict) return;

  const { targetIndex, conflictIndex, newKey } = pendingConflict;
  const targetItem = config[targetIndex];
  const conflictingItem = config[conflictIndex];

  if (targetItem && targetItem.type === "cell") {
    targetItem.value = newKey;
  }
  if (conflictingItem && conflictingItem.type === "cell") {
    conflictingItem.value = null; // Clear old slot to null
  }

  pendingConflict = null;
  const conflictBanner = document.getElementById("conflict-modal");
  if (conflictBanner) conflictBanner.style.display = "none";

  closeKeyboardModal();
  renderKeyGrid();
}

/*
 * Cancel conflict override: preserves existing assignments
 */
function cancelConflictOverride(): void {
  pendingConflict = null;
  const conflictBanner = document.getElementById("conflict-modal");
  if (conflictBanner) conflictBanner.style.display = "none";
}

/*
 * Clear current cell slot value to null (unassign)
 */
function clearCurrentSlot(): void {
  if (activeSlotIndex !== null) {
    const item = config[activeSlotIndex];
    if (item && item.type === "cell") {
      item.value = null;
    }
    closeKeyboardModal();
    renderKeyGrid();
  }
}

/*
 * Download current controls configuration as json file
 */
function downloadConfigJSON(): void {
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

/*
 * Reset all control values back to their default values
 */
function resetToDefaults(): void {
  config.forEach((item) => {
    item.value = item.default;
  });
  renderAll();
}

/*
 * Setup event listeners for modal controls, modifiers, mouse buttons, and download button
 */
function setupEventListeners(): void {
  // Modal close buttons
  document.getElementById("modal-close-btn")?.addEventListener("click", closeKeyboardModal);
  document.getElementById("modal-clear-btn")?.addEventListener("click", clearCurrentSlot);

  // Conflict modal buttons
  document.getElementById("conflict-override-btn")?.addEventListener("click", confirmConflictOverride);
  document.getElementById("conflict-cancel-btn")?.addEventListener("click", cancelConflictOverride);

  // Download & Reset buttons
  document.getElementById("download-json-btn")?.addEventListener("click", downloadConfigJSON);
  document.getElementById("reset-defaults-btn")?.addEventListener("click", resetToDefaults);

  // Modifier toggles
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

  // Dedicated mouse buttons in keyboard modal
  document.querySelectorAll<HTMLButtonElement>(".mouse-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mouseVal = btn.getAttribute("data-key");
      if (mouseVal) handleKeySelection(mouseVal);
    });
  });

  // Physical keyboard listeners when modal is open
  window.addEventListener("keydown", (e) => {
    const modal = document.getElementById("keyboard-modal");
    if (!modal || modal.style.display === "none") return;

    if (e.key === "Escape") {
      closeKeyboardModal();
      return;
    }

    // Mirror physical modifier states
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

// Initial bootstrap on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadConfig();
});

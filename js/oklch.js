// oklch.js – Core logic for the OKLCH Color Tool UI
// ---------------------------------------------------
// This script implements:
//   • State management (list of colors, selected index)
//   • Rendering of sidebar color boxes with actions (duplicate, delete, copy)
//   • UI bindings for sliders, number inputs, unit toggles, alpha enable
//   • Live preview and CSS output
//   • URL <-> state serialization using ~ for % (percent‑to‑tilde)
//   • Micro‑animations (toast feedback) and transparent‑grid handling

// Utility helpers ---------------------------------------------------
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

// Convert between internal representation and CSS string
function colorToString(col) {
  const { L, C, H, A, lUnit, cUnit, hUnit, aUnit } = col;
  const l = lUnit === '%' ? `${L}%` : L;
  const c = cUnit === '%' ? `${C}%` : C;
  const h = `${H}${hUnit}`;
  const aPart = A !== null ? ` / ${aUnit === '%' ? `${A}%` : A}` : '';
  return `oklch(${l} ${c} ${h}${aPart})`;
}

// Encode a single color for URL (compact, no wrapper)
function encodeColor(col) {
  const { L, C, H, A, lUnit, cUnit, hUnit, aUnit } = col;
  const l = lUnit === '%' ? `${L}~` : L; // ~ replaces %
  const c = cUnit === '%' ? `${C}~` : C;
  const h = `${H}${hUnit}`;
  const a = A !== null ? `,${aUnit === '%' ? `${A}~` : A}` : '';
  return `${l},${c},${h}${a}`;
}

function decodeColor(str) {
  // Expected format: L[,C,H[,A]] where % is represented by ~
  const parts = str.split(',');
  const [Lraw, Craw, Hraw, Araw] = parts;
  const parseVal = (v, unit) => {
    if (!v) return null;
    if (v.endsWith('~')) return { value: v.slice(0, -1), unit: '%' };
    return { value: v, unit };
  };
  const L = parseVal(Lraw, '%');
  const C = parseVal(Craw, '%');
  const H = { value: Hraw.replace(/(deg|rad|grad|turn)$/, ''), unit: Hraw.match(/(deg|rad|grad|turn)$/)[0] };
  const A = Araw ? parseVal(Araw, '%') : null;
  return {
    L: Number(L.value), lUnit: L.unit,
    C: Number(C.value), cUnit: C.unit,
    H: Number(H.value), hUnit: H.unit,
    A: A ? Number(A.value) : null,
    aUnit: A ? A.unit : null,
  };
}

// State ---------------------------------------------------
let colors = [];
let selectedIdx = -1;

// DOM references ---------------------------------------------------
const colorListEl = qs('#color-items');
const addBtn = qs('#add-color-btn');
const form = qs('#color-form');
const previewEl = qs('#color-preview');
const cssOut = qs('#css-output');
const duplicateBtn = qs('#duplicate-btn');
const alphaEnable = qs('#a-enabled');
const alphaControls = qs('#alpha-controls');

// Input elements (generated later) ---------------------------------------------------
let inputs = {};

// Toast helper ---------------------------------------------------
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = 'rgba(0,0,0,0.7)';
  toast.style.color = '#fff';
  toast.style.padding = '8px 12px';
  toast.style.borderRadius = '6px';
  toast.style.zIndex = 1000;
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s';
  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = '1'));
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}

// Rendering ---------------------------------------------------
function renderList() {
  colorListEl.innerHTML = '';
  colors.forEach((col, idx) => {
    const li = document.createElement('li');
    li.className = 'color-item';
    if (idx === selectedIdx) li.classList.add('selected');
    li.dataset.idx = idx;
    // Background color
    li.style.background = colorToString(col);
    // Contrast text color
    const isDark = getLuminance(col) < 0.5;
    li.style.color = isDark ? '#fff' : '#000';
    li.textContent = colorToString(col);
    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'actions';
    const dup = document.createElement('button');
    dup.textContent = 'Dup';
    dup.title = 'Duplicate';
    dup.addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateColor(idx);
    });
    const del = document.createElement('button');
    del.textContent = '✕';
    del.title = 'Delete';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteColor(idx);
    });
    const copy = document.createElement('button');
    copy.textContent = 'Copy';
    copy.title = 'Copy to clipboard';
    copy.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(colorToString(col)).then(() => showToast('Copied!'));
    });
    actions.append(dup, del, copy);
    li.appendChild(actions);
    li.addEventListener('click', () => selectColor(idx));
    colorListEl.appendChild(li);
  });
}

function renderForm() {
  if (selectedIdx < 0) return;
  const col = colors[selectedIdx];
  // Populate inputs
  inputs.lNumber.value = col.L;
  inputs.lSlider.value = col.L;
  inputs.cNumber.value = col.C;
  inputs.cSlider.value = col.C;
  inputs.hNumber.value = col.H;
  inputs.hSlider.value = col.H;
  // Units
  qsa('input[name="l-unit"]').forEach((el) => (el.checked = el.value === col.lUnit));
  qsa('input[name="c-unit"]').forEach((el) => (el.checked = el.value === col.cUnit));
  qsa('input[name="h-unit"]').forEach((el) => (el.checked = el.value === col.hUnit));
  // Alpha
  if (col.A !== null) {
    alphaEnable.checked = true;
    alphaControls.style.display = '';
    inputs.aNumber.value = col.A;
    inputs.aSlider.value = col.A;
    qsa('input[name="a-unit"]').forEach((el) => (el.checked = el.value === col.aUnit));
  } else {
    alphaEnable.checked = false;
    alphaControls.style.display = 'none';
  }
}

function renderPreview() {
  if (selectedIdx < 0) return;
  const col = colors[selectedIdx];
  const css = colorToString(col);
  previewEl.style.background = css;
  cssOut.textContent = css;
}

function updateURL() {
  const encoded = colors.map(encodeColor).join('|');
  const url = new URL(window.location);
  url.searchParams.set('colors', encoded);
  history.replaceState(null, '', url);
}

// Luminance helper for contrast (simple approximation)
function getLuminance(col) {
  // Convert to sRGB using the OKLCH to sRGB conversion (approx). For speed we use lightness only.
  return col.L / 100; // rough but sufficient for contrast decision
}

// Interaction handlers ---------------------------------------------------
function selectColor(idx) {
  selectedIdx = idx;
  renderList();
  renderForm();
  renderPreview();
}

function addColor() {
  const newCol = {
    L: 50,
    C: 0,
    H: 0,
    A: null,
    lUnit: '%',
    cUnit: '%',
    hUnit: 'deg',
    aUnit: '%',
  };
  colors.push(newCol);
  selectColor(colors.length - 1);
  updateURL();
}

function duplicateColor(idx) {
  const copy = { ...colors[idx] };
  colors.splice(idx + 1, 0, copy);
  selectColor(idx + 1);
  updateURL();
}

function deleteColor(idx) {
  colors.splice(idx, 1);
  if (colors.length === 0) {
    selectedIdx = -1;
  } else if (idx >= colors.length) {
    selectedIdx = colors.length - 1;
  } else {
    selectedIdx = idx;
  }
  renderList();
  renderForm();
  renderPreview();
  updateURL();
}

function bindInputs() {
  // Slider ↔ number sync and state update
  const sync = (type, key) => {
    inputs[`${type}Slider`].addEventListener('input', (e) => {
      const val = Number(e.target.value);
      inputs[`${type}Number`].value = val;
      colors[selectedIdx][key] = val;
      renderPreview();
      updateURL();
    });
    inputs[`${type}Number`].addEventListener('change', (e) => {
      let val = Number(e.target.value);
      const min = Number(inputs[`${type}Slider`].min);
      const max = Number(inputs[`${type}Slider`].max);
      if (val < min) val = min;
      if (val > max) val = max;
      inputs[`${type}Slider`].value = val;
      colors[selectedIdx][key] = val;
      renderPreview();
      updateURL();
    });
  };
  sync('l', 'L');
  sync('c', 'C');
  sync('h', 'H');
  sync('a', 'A');

  // Unit toggles
  qsa('input[name="l-unit"]').forEach((el) =>
    el.addEventListener('change', () => {
      colors[selectedIdx].lUnit = el.value;
      renderForm();
      renderPreview();
      updateURL();
    })
  );
  qsa('input[name="c-unit"]').forEach((el) =>
    el.addEventListener('change', () => {
      colors[selectedIdx].cUnit = el.value;
      renderForm();
      renderPreview();
      updateURL();
    })
  );
  qsa('input[name="h-unit"]').forEach((el) =>
    el.addEventListener('change', () => {
      colors[selectedIdx].hUnit = el.value;
      renderForm();
      renderPreview();
      updateURL();
    })
  );
  qsa('input[name="a-unit"]').forEach((el) =>
    el.addEventListener('change', () => {
      colors[selectedIdx].aUnit = el.value;
      renderForm();
      renderPreview();
      updateURL();
    })
  );

  // Alpha enable toggle
  alphaEnable.addEventListener('change', () => {
    if (alphaEnable.checked) {
      colors[selectedIdx].A = 1;
      colors[selectedIdx].aUnit = '%';
      alphaControls.style.display = '';
    } else {
      colors[selectedIdx].A = null;
      alphaControls.style.display = 'none';
    }
    renderForm();
    renderPreview();
    updateURL();
  });

  // Duplicate button (outside form)
  duplicateBtn.addEventListener('click', () => {
    if (selectedIdx >= 0) duplicateColor(selectedIdx);
  });
}

// Initialization ---------------------------------------------------
function init() {
  // Parse URL if present
  const params = new URLSearchParams(window.location.search);
  const colorsParam = params.get('colors');
  if (colorsParam) {
    const parts = colorsParam.split('|');
    colors = parts.map(decodeColor);
    selectedIdx = 0;
  } else {
    // start with a single default color
    addColor();
    return; // addColor already selects and updates URL
  }
  renderList();
  renderForm();
  renderPreview();
  // Cache input elements for binding
  inputs = {
    lSlider: qs('#l-slider'),
    lNumber: qs('#l-number'),
    cSlider: qs('#c-slider'),
    cNumber: qs('#c-number'),
    hSlider: qs('#h-slider'),
    hNumber: qs('#h-number'),
    aSlider: qs('#a-slider'),
    aNumber: qs('#a-number'),
  };
  bindInputs();
}

addBtn.addEventListener('click', addColor);
window.addEventListener('DOMContentLoaded', init);

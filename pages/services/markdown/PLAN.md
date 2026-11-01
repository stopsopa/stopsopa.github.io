# Markdown Editor Implementation Plan

Two-column real-time Markdown editor with URL-memorized state and resizable split view.

## 1. Overview & Architecture

The application provides a split-pane interface:

- **Left Column**: Live editable textarea taking full viewport height.
- **Center Divider**: Movable vertical splitter to adjust panel proportions, with a reset button at the bottom to restore the default 50/50 split.
- **Right Column**: Live rendering panel showing GitHub-flavored Markdown using `<zero-md>`.
- **URL Synchronization**: The document content is compressed with `lz-string` and memorized in the URL query parameters (`d`) in real time, enabling seamless sharing and state restoration on page load. Divider position is also persisted (`split` / `w` / numeric `d`).

---

## 2. Component Specifications

### 2.1 Viewport & Layout

- Full viewport height (`100vh`) with `overflow: hidden` on root (`html, body`) to eliminate browser window scrollbars.
- Editor container uses a flexbox layout (`display: flex; flex-direction: row; height: 100vh; width: 100vw;`).
- Left panel: `overflow-y: auto`, containing the full-height auto-resizing `<textarea>`.
- Right panel: `overflow-y: auto`, containing `<zero-md>`.

### 2.2 Textarea & Auto-Resize

- Imports `lib/TextareaResize.ts` (`lib/TextareaResize.js` at runtime) and `lib/TextareaResize.css`.
- Uses native ES6 module imports and import map to resolve `lib/addCss.js`.
- Textarea markup includes `class="textareaautoresize"` and `data-textareaautoresize="markdown-input"`.
- Textarea expands vertically to fit content while left container handles scrolling.

### 2.3 Movable Center Divider

- Positioned between left and right columns.
- Draggable with pointer/touch events to adjust left panel width from 10% to 90%.
- Displays a dedicated reset button (`data-testid="reset-divider-btn"`) anchored at the bottom of the divider line.
- Clicking the reset button restores 50/50 division and removes the divider parameter from the URL.

### 2.4 Markdown Rendering via zero-md

- Loaded via CDN: `<script type="module" src="https://cdn.jsdelivr.net/npm/zero-md@3?register"></script>`.
- Dynamically receives updated content via `<script type="text/markdown">` child element.

### 2.5 State Compression & URL Synchronization

- Library: `node_modules/.pnpm/lz-string@1.5.0/node_modules/lz-string/libs/lz-string.js`.
- As the user types in the textarea:
  - Text is compressed using `LZString.compressToEncodedURIComponent(text)`.
  - Stored in URL query parameter `d`.
  - Updated via `window.history.replaceState()`.
- When divider is adjusted:
  - Left panel width percentage is stored in URL query parameter `split`.
  - On reset button click, the divider query parameter is deleted from URL.
- On page load:
  - Check URL for content parameter (`d` or `c`), decompress with `LZString.decompressFromEncodedURIComponent()`, populate textarea, and render markdown preview.
  - Check URL for divider position (`split`, `w`, or numeric `d`), apply saved panel widths if present, otherwise default to 50/50.

---

## 2.6 Mobile Layout

- On screens `≤ 700px` the layout switches from horizontal to vertical (column) flex.
- The textarea appears **first** (top), followed by the zero-md preview panel below.
- The center divider is **hidden** on mobile (`display: none`); no manual split control is needed.
- The full-page vertical scroll is restored on mobile (`overflow: auto` on `html, body`).
- Both panels expand to fill available width (`width: 100%`).

---

## 3. File Structure

- `pages/services/markdown/index.html`: Main HTML entry — markup, styling, loads `/dist/markdown.entry.bundle.js`.
- `pages/services/markdown/markdown.entry.ts`: Bundled entry point (`<mode:imports>`). Imports `lz-string` from npm and `lib/TextareaResize`. Transpiled by esbuild into `/dist/markdown.entry.bundle.js`.
- `pages/services/markdown/markdown.ts`: Legacy stub — superseded by `markdown.entry.ts`.
- `pages/services/markdown/PLAN.md`: System plan and technical specification.
- `lib/TextareaResize.md`: Integration guide for `TextareaResize.ts` and `addCss.ts`.

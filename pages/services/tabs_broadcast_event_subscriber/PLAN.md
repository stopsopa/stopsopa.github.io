# Spec: Cross-Tab Event Copy Receiver (`copy.html`)

Build `copy.html` as a standalone web tool capturing `other_tabs:copy` cross-tab broadcast events and rendering captured content via `<ace-editor>` web component.

## Dependencies
- Loads Ace web component:
```html
<script
  type="module"
  src="https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js"
  data-main-ace="https://stopsopa.github.io/ace-editor-webcomponent/noprettier/ace/ace-builds-1.43.4/src-min-noconflict/ace.js"
></script>
```

## Features

### 1. Modes
- **Regular mode (default)**:
  - Each incoming event overwrites `<ace-editor id="programmatic-demo">` via `editor.setAttribute('value', text)`.
  - Shows `<ace-editor id="example" lang="javascript">` instructions at bottom.
  - Hides joiner panel and Revert button.
- **Record mode**:
  - Toggled by `#record-btn`.
  - Pulsing red dot indicator appears when active (`.record-dot`).
  - Pre-populates `memory` array with current editor content (if any), then pushes subsequent event data.
  - Delimiter taken from `#joiner-input`.
  - Rebuilding: updates editor content with `memory.join(joiner)`.
  - Hides `<ace-editor id="example">`, shows `#joiner-panel` and `#revert-btn`.

### 2. Controls & Toolbar
- **Link**: `<a href="tampermonkey.page.html" target="_blank" data-testid="link-tampermonkey-page">`.
- **Copy button**: `#copy-btn` (`data-testid="btn-copy-textarea"`). Copies editor text to clipboard, shows "Copied!" for 1.5s.
- **Record button**: `#record-btn` (`data-testid="btn-record-mode"`). Toggles mode, contains `.record-dot` (`data-testid="indicator-record-pulse"`).
- **Revert button**: `#revert-btn` (`data-testid="btn-revert-memory"`). Visible in record mode only. Executes `memory.pop()` and updates editor with `memory.join(joiner)`. Disabled when `memory` is empty.
- **Language Dropdown**: `#lang-select` (`data-testid="select-editor-lang"`). Positioned on the right end of the toolbar. Updates editor `lang` attribute on change. Default is `python`, followed by `typescript`, `java`, etc.

### 3. Joiner Panel (`#joiner-panel`, `data-testid="container-joiner"`)
Two columns:
- **Left**: `<textarea id="joiner-input" data-testid="input-joiner">`, default value `"\n"`. Used as delimiter between items.
- **Right**: `<div id="joiner-preview" data-testid="preview-joiner">`. Renders non-printable characters in real-time:
  - ` ` $\rightarrow$ `·` (middle dot)
  - `\t` $\rightarrow$ `→` (arrow)
  - `\r` $\rightarrow$ `↵` (hook arrow)
  - `\n` $\rightarrow$ `¶\n` (pilcrow + newline)

### 4. Event Logic
- Listen on `document` for `"other_tabs:copy"`.
- Text extraction: `detail.text !== undefined ? String(detail.text) : JSON.stringify(detail, null, 2)`.
- If recording: `memory.push(text)`, rebuild output (`editor.setAttribute('value', memory.join(joiner))`), update revert button.
- If regular: `editor.setAttribute('value', text)`.

## Layout & Hierarchy

```
body (flex col, 100vh, #1e1e1e, monospace)
├── .toolbar (flex, gap 12px, #252526)
│   ├── a[data-testid="link-tampermonkey-page"]
│   ├── button#copy-btn[data-testid="btn-copy-textarea"]
│   ├── button#record-btn[data-testid="btn-record-mode"]
│   │   ├── span.record-dot[data-testid="indicator-record-pulse"]
│   │   └── span#record-btn-text
│   ├── button#revert-btn[data-testid="btn-revert-memory"] (hidden in regular)
│   └── .toolbar-right
│       └── select#lang-select[data-testid="select-editor-lang"] (default python, then typescript, java...)
├── ace-editor#programmatic-demo[lang="python"][data-testid="editor-output"] (flex 1)
├── div#joiner-panel[data-testid="container-joiner"] (hidden in regular, height 160px)
│   ├── .joiner-pane (left): textarea#joiner-input[data-testid="input-joiner"]
│   └── .joiner-pane (right): div#joiner-preview[data-testid="preview-joiner"]
└── ace-editor#example[lang="javascript"][data-testid="editor-example"] (hidden in record)
```

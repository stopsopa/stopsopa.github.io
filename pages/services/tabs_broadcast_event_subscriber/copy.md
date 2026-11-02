# Spec: Cross-Tab Event Copy Receiver (`copy.html`)

Build `copy.html` as a standalone web tool capturing `other_tabs:copy` cross-tab broadcast events.

## Features

### 1. Modes
- **Regular mode (default)**:
  - Each incoming event overwrites `#output` textarea.
  - Shows `<pre id="example">` instructions at bottom.
  - Hides joiner panel and Revert button.
- **Record mode**:
  - Toggled by `#record-btn`.
  - Pulsing red dot indicator appears when active (`.record-dot`).
  - Pre-populates `memory` array with existing `#output` content (if any), then pushes subsequent event data.
  - Joining delimiter taken from `#joiner-input`.
  - Rebuilding: `#output.value = memory.join(joiner)`.
  - Hides `<pre id="example">`, shows `#joiner-panel` and `#revert-btn`.

### 2. Controls & Toolbar
- **Link**: `<a href="tampermonkey.page.html" target="_blank" data-testid="link-tampermonkey-page">`.
- **Copy button**: `#copy-btn` (`data-testid="btn-copy-textarea"`). Copies `#output` value to clipboard, shows "Copied!" for 1.5s.
- **Record button**: `#record-btn` (`data-testid="btn-record-mode"`). Toggles mode, contains `.record-dot` (`data-testid="indicator-record-pulse"`).
- **Revert button**: `#revert-btn` (`data-testid="btn-revert-memory"`). Visible in record mode only. Executes `memory.pop()` and rebuilds `#output.value = memory.join(joiner)` (can clear completely back to empty). Disabled when `memory` is empty.

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
- If recording: `memory.push(text)`, rebuild output (`memory.join(joiner)`), update revert button.
- If regular: `output.value = text`.

## Layout & Hierarchy

```
body (flex col, 100vh, #1e1e1e, monospace)
├── .toolbar (flex, gap 12px, #252526)
│   ├── a[data-testid="link-tampermonkey-page"]
│   ├── button#copy-btn[data-testid="btn-copy-textarea"]
│   ├── button#record-btn[data-testid="btn-record-mode"]
│   │   ├── span.record-dot[data-testid="indicator-record-pulse"]
│   │   └── span#record-btn-text
│   └── button#revert-btn[data-testid="btn-revert-memory"] (hidden in regular)
├── textarea#output (flex 1)
├── div#joiner-panel[data-testid="container-joiner"] (hidden in regular, height 160px)
│   ├── .joiner-pane (left): textarea#joiner-input[data-testid="input-joiner"]
│   └── .joiner-pane (right): div#joiner-preview[data-testid="preview-joiner"]
└── pre#example (hidden in record)
```

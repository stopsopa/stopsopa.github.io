# TextareaResize Documentation

Guide for using `TextareaResize.ts` with `addCss.ts`.

## Overview

`TextareaResize.ts` automatically adjusts the height of `<textarea>` elements to fit their content dynamically, avoiding vertical scrollbars inside the textarea.

It works in conjunction with `addCss.ts`, which injects dynamic CSS rules targeting the specific textarea by its unique identifier.

---

## How It Works

1. **DOM Observation**:

   - Listens to global `input` events on `<textarea>` elements.
   - Uses `MutationObserver` to detect dynamically added or removed textareas and attribute changes.
   - Uses `ResizeObserver` to detect container width adjustments.
   - Overrides the `HTMLTextAreaElement.prototype.value` property descriptor so programmatic updates also trigger auto-resizing.

2. **Dynamic CSS via `addCss.ts`**:
   - `resizeTextarea()` reads the unique ID from `data-textareaautoresize`.
   - First, it calls `addCss("textarea[data-textareaautoresize=\"...\"]{opacity: 0;height: auto;}", { id })` to reset height and accurately measure `target.scrollHeight`.
   - Next, via `requestAnimationFrame`, it reads `target.scrollHeight` and calls `addCss("textarea[data-textareaautoresize=\"...\"]{overflow-y: hidden;resize: none;height:${height}px;}", { id })`.
   - When a textarea is removed from the DOM, `removeCss({ id })` removes the injected `<style>` tag.

---

## Required HTML Markup

The target `<textarea>` element requires:

- `data-textareaautoresize="<unique-id>"`: A unique non-empty string identifier. Each textarea must have its own distinct ID.
- `class="textareaautoresize"`: Optional convenience class for base styling.

Example:

```html
<textarea
  class="textareaautoresize"
  data-textareaautoresize="my-textarea"
  placeholder="Type something here..."
></textarea>
```

---

## Usage in Native Browser ES Modules

Because `TextareaResize.js` imports `./addCss` without a file extension, configure an import map in HTML when running in native browser ESM without a bundler:

```html
<script type="importmap">
  {
    "imports": {
      "./addCss": "/lib/addCss.js",
      "./addCss.js": "/lib/addCss.js",
      "/lib/addCss": "/lib/addCss.js"
    }
  }
</script>

<link rel="stylesheet" href="/lib/TextareaResize.css" />
<script type="module" src="./app.js"></script>
```

In your module script:

```javascript
import { initTextareaAutoResize } from "/lib/TextareaResize.js";

// TextareaResize auto-initializes on DOMContentLoaded if loaded in the browser.
// If needed, you can explicitly re-initialize:
initTextareaAutoResize();
```

## ... or simply use imports with full paths (usually relative to the current module/page script)

## API Reference

### `initTextareaAutoResize()`

Sets up input listeners, `MutationObserver`, `ResizeObserver`, and the value descriptor hook. Increments reference counter. Safe to call multiple times.

> **You do NOT need to call this manually.** Importing the module triggers auto-initialization automatically. The module checks `document.readyState` on load — if the DOM is still loading it registers a `DOMContentLoaded` listener; if the DOM is already ready it calls `initTextareaAutoResize()` immediately. No manual invocation required.

The only reason to call it explicitly is if you previously called `tearDownTextareaAutoResize()` and want to re-enable the feature without reloading the module.

### `tearDownTextareaAutoResize()`

Decrements reference counter. When count reaches zero, disconnects all observers and restores original `HTMLTextAreaElement.prototype.value` descriptor. Call this only if you want to explicitly disable auto-resize for cleanup purposes (e.g. in a SPA route teardown).

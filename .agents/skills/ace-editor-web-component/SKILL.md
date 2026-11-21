---
name: ace-editor-web-component
description: Display or edit source code with syntax highlighting in an HTML page using the <ace-editor> web component (Ace Editor wrapper, loaded from CDN, no build step, no npm package). Use when a page needs highlighted code blocks or an in-page code editor, or when existing <ace-editor> elements must be read or updated from JavaScript (change content, change language, wait for initialization, avoid duplicate ids).
---

# `<ace-editor>` web component

A custom element that wraps [Ace Editor](https://ace.c9.io/). It loads Ace asynchronously (once per page, no matter how many editors are rendered), auto-sizes to its content, wraps long lines, and exposes a small textarea-like API.

- Full documentation and live demos: https://stopsopa.github.io/ace-editor-webcomponent/learning/008_ace_async_loader/dynamic.html
- Source of the component (single file): https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js

## 1. Installation (CDN, one script tag)

Add this **once** per page, preferably in `<head>`:

```html
<script
  type="module"
  src="https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js"
  data-main-ace="https://cdnjs.cloudflare.com/ajax/libs/ace/1.43.3/ace.min.js"
></script>
```

- `src` registers the `<ace-editor>` custom element.
- `data-main-ace` tells the component where the main Ace script is. It is required. Modes and themes are fetched by Ace from the same location on demand.
- There is no npm package and nothing to install. The only project-specific file is `ace-web-component.js`; it can be used from the URL above or copied into the project and referenced locally.
- `data-main-ace` may point to any publicly available Ace build. Use the cdnjs URL above by default; the user will change it by hand if they want something else. Known alternatives:
  - `https://cdn.jsdelivr.net/npm/ace-builds@1.43.4/src-min-noconflict/ace.js`
  - `https://stopsopa.github.io/ace-editor-webcomponent/noprettier/ace/ace-builds-1.43.4/src-min-noconflict/ace.js`
- Do not add a separate `<script>` for Ace itself, and do not repeat the tag above per editor.
- With a bundler (no script tag to carry `data-main-ace`), import the module and call the exported `setDataMainAce(url)` before any `<ace-editor>` is connected to the DOM.

## 2. Basic usage

```html
<ace-editor lang="javascript">
  <script type="ace">
    function greet(name) {
        console.log("Hello, " + name + "!");
    }

    greet("World");
  </script>
</ace-editor>
```

Put the code between `<script type="ace">` and `</script>` and choose the language with `lang`.

- Always prefer the `<script type="ace">` form. Code placed directly between `<ace-editor>` tags also works, but formatters such as Prettier will reflow it, and the HTML parser will interpret any `<` in it.
- Common indentation is removed automatically, so the code can be indented to match the surrounding HTML. Add `data-notrim` to keep it as written.
- If the code itself contains a closing script tag, write it as `&lt;/script>`. `&lt;` is decoded to `<` for static content; add `data-nolt` to switch that decoding off.
- The editor is editable by default. For display-only code blocks add `readonly`.
- Do not set `theme` unless the user asks for it. Leave the default.

### Attributes

| Attribute | Default | Notes |
| --- | --- | --- |
| `id` | auto-generated `ace-editor-N` | Must be unique. See section 5. |
| `lang` | `javascript` | Ace mode name: `python`, `typescript`, `html`, `css`, `json`, `sh`, `text` (no highlighting), ... Full list: https://github.com/ajaxorg/ace/blob/v1.43.4/src/ext/modelist.js#L72 |
| `value` | empty | Editor content. Overrides `<script type="ace">` and text content. |
| `readonly` | off | Boolean attribute. |
| `theme` | `idle_fingers` | Leave the default unless asked. |
| `min-height-lines` | none | Minimum height in lines. |
| `min-height-px` | none | Minimum height in pixels. Wins if both are set. |

Initial content priority: `value` attribute, then `<script type="ace">`, then plain text content, then `content` attribute.

`js`, `ts` and `bash` are accepted as short names for `javascript`, `typescript` and `sh`, but only in the initial markup. When changing the language from JavaScript later, use the full Ace mode name.

## 3. Interacting from JavaScript

Get the element like any other DOM node. Give it an explicit `id` when you need to reach it from JavaScript:

```js
const editor = document.getElementById("my-editor");
```

### Read content

```js
const code = editor.value; // returns "" until the editor has initialized
```

### Change content and language

Attributes are the simplest way and work for both content and language:

```js
editor.setAttribute("lang", "python");
editor.setAttribute(
  "value",
  `# Python Example
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`
);
```

The same goes for `theme`, `readonly` (`setAttribute("readonly", "")` / `removeAttribute("readonly")`) and the min-height attributes.

Content can also be set through the property, like a textarea:

```js
editor.value = "console.log('new content');";
```

Differences between the two ways of setting content:

| | `setAttribute("value", ...)` | `editor.value = ...` |
| --- | --- | --- |
| Before initialization | Safe. The attribute is picked up when the editor initializes. | Unsafe. See section 4. |
| On a `readonly` editor | Deferred. Applied only when `readonly` is removed. | Applied immediately. |
| Fires the `input` event | Yes | No (same as a native textarea) |

So to update a `readonly` code block, use `editor.value = ...` inside an `onLoad` callback (section 4).

### Listen for user edits

```js
editor.addEventListener("input", (e) => {
  console.log(e.target.value);
});
```

`input` fires on user edits. It does not fire when content is assigned through the `.value` property.

### Native Ace instance

`editor.getEditor()` returns the underlying Ace editor for anything the component does not expose (search, cursor, selection, options). It is only available after initialization.

## 4. Async initialization: wait before touching the editor

### The problem: premature content modification

`<ace-editor>` is not ready when it appears in the HTML. After the element is parsed, an asynchronous sequence runs: the Ace script is downloaded, the editor is built inside the component, and only then is the initial content applied. Until that finishes:

- reading `editor.value` returns an empty string,
- anything written with `editor.value = ...` is overwritten when initialization completes and the content from the markup is applied.

This does **not** work:

```html
<ace-editor id="problematic-editor1">
  <script type="ace">
    // Initial function
    function greet(name) {
      console.log("Hello, " + name);
    }
  </script>
</ace-editor>

<script>
  {
    const editor = document.getElementById("problematic-editor1");

    // Runs before the editor exists: editor.value is "" here,
    // and the assignment is thrown away when initialization finishes.
    editor.value = editor.value + `
console.log("Let's try to append this console.log");
`;
  }
</script>
```

### The fix: the `onLoad` event

Wrap every read or write of the editor in an `onLoad` listener registered on the element:

```html
<ace-editor id="problematic-editor2">
  <script type="ace">
    // Initial function
    function greet(name) {
      console.log("Hello, " + name);
    }
  </script>
</ace-editor>

<script>
  {
    const editor = document.getElementById("problematic-editor2");

    editor.addEventListener("onLoad", () => {
      editor.value = editor.value + `
console.log("Let's try to append this console.log");
`;
    });
  }
</script>
```

Facts about `onLoad`:

- It is safe to register at any time. If the editor is already initialized, the callback runs immediately. Treat it as "run this when the editor is ready" and use it by default for any JavaScript that touches an editor.
- The callback receives a plain object `{ component, editor, id }` (the web component, the native Ace instance, the element id), not a DOM `Event`.
- It can be registered many times; each callback runs once.
- An editor inside a hidden container (`display: none`, for example an inactive tab) does not initialize until it becomes visible, so its `onLoad` callbacks run only then.
- The event name is exactly `onLoad`. `load` does not work.

### Global alternative: `aceOnLoad`

`aceOnLoad` is a bubbling `CustomEvent` fired once per editor when it is ready. Listen on `document` to configure every editor in one place:

```js
document.addEventListener("aceOnLoad", (event) => {
  const { component, editor, id } = event.detail;
  // component: the <ace-editor> element, editor: native Ace instance
});
```

Unlike `onLoad`, it is not replayed: the listener must be registered before the editors initialize, so put it ahead of the component's script tag.

## 5. Unique ids

Every `<ace-editor>` must have an id that is unique among all editors on the page. The component enforces this.

- **No `id` given:** the component assigns `ace-editor-1`, `ace-editor-2`, and so on. This is the safest choice for editors that are never referenced from JavaScript.
- **`id` given:** it is used as-is and you are responsible for uniqueness.
- **Duplicate `id`:** the second editor does not render. It shows a "Duplicate ID Error" box in place of the editor and an error is thrown in the console.
- **Editor removed from the DOM:** its id is released and can be used by a new editor.

Rules to follow when generating code:

1. Omit `id` on editors that JavaScript never touches.
2. Add an explicit `id` whenever JavaScript needs the editor. Do not rely on the auto-generated `ace-editor-N` names; they depend on the order in which editors are created.
3. When rendering editors in a loop or from a template, build each id from a unique key of the item (for example `` `snippet-${item.id}` ``), never a fixed string.
4. When copying an example block that has an `id`, change the id in both the markup and the script that looks it up.
5. Do not use an id that already belongs to another element on the page.
6. To replace an editor, remove the old element and insert a new one. Do not detach an existing `<ace-editor>` and re-attach it elsewhere.

## 6. Complete example

Two editors on one page (Ace is still downloaded only once): a read-only block with an auto-generated id, and an editable one that is updated from JavaScript.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script
      type="module"
      src="https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js"
      data-main-ace="https://cdnjs.cloudflare.com/ajax/libs/ace/1.43.3/ace.min.js"
    ></script>
  </head>
  <body>
    <ace-editor lang="json" readonly>
      <script type="ace">
        {
          "name": "example",
          "version": "1.0.0"
        }
      </script>
    </ace-editor>

    <ace-editor id="playground" lang="javascript">
      <script type="ace">
        console.log("Hello, World!");
      </script>
    </ace-editor>

    <button id="to-python">Switch to Python</button>
    <pre id="output"></pre>

    <script>
      const editor = document.getElementById("playground");
      const output = document.getElementById("output");

      // Reads and .value writes must wait for initialization
      editor.addEventListener("onLoad", () => {
        output.textContent = editor.value;
      });

      // User edits
      editor.addEventListener("input", (e) => {
        output.textContent = e.target.value;
      });

      // Change language and content
      document.getElementById("to-python").addEventListener("click", () => {
        editor.setAttribute("lang", "python");
        editor.setAttribute("value", 'print("Hello, World!")');
      });
    </script>
  </body>
</html>
```

## Checklist

- One loader script tag per page, with `data-main-ace`.
- Code goes inside `<script type="ace">`, language in `lang`, no `theme` override.
- `readonly` for display-only blocks.
- Explicit, unique `id` only where JavaScript needs the editor.
- Every read of `.value`, write to `.value` and call to `.getEditor()` sits inside `editor.addEventListener("onLoad", ...)`.
- Full Ace mode names when changing `lang` from JavaScript.

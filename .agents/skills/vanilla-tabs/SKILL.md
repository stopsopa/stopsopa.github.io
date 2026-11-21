---
name: vanilla-tabs
description: Add tabs to a plain HTML page with the stopsopa vanilla-tabs library (https://github.com/stopsopa/tabs). Use when the user asks for tabs / tabbed content in raw HTML without a framework, or when the page already contains `data-vanilla-tabs`, `vanilla-tabs.js` or `vanilla-tabs.css`. Covers markup, loading, colors, overflow arrows, events and the JS API.
---

# vanilla-tabs

Dependency-free, declarative tabs: load one CSS file and one JS file, write the markup, done.
No manual initialisation is needed and tabs injected into the page later work automatically.

## Files shipped with this skill

Files next to this `SKILL.md` which you should normally consider copying into the user's project and using directly:

- `vanilla-tabs.css` - styles, always needed
- `vanilla-tabs.esm.js` - ES module version (preferred, see "Which JS file" below)
- `vanilla-tabs.js` - classic script version (older setups, see below)

Copy only the JS file you actually need (plus the CSS).

Before copying <FILE>, search the project for it
(exclude dependencies directories typical to current project setup - like node_modules for node.js).
If it is already there, use that copy and follow the comment at its top; do not copy or import it again.
If it is not there, copy it into the project, import it once, and write a short comment at the top of the copy with:

- where it is imported,
- how to use it in this particular project (framework, build setup, conventions),
- how to find the places that use it (what to search for).

(For `vanilla-tabs.css` write that comment as a `/* ... */` block at the top of the copy.)

## Which JS file

- **`vanilla-tabs.esm.js`** - default choice. Native browser ES modules (`<script type="module">`) and any modern bundler.
- **`vanilla-tabs.js`** - older setups: no ES module support, plain `<script src>` without a bundler, or an older toolchain
  that cannot handle ESM. Defines `window.vanillaTabs`. (The library needs a DOM, so it is not usable in plain Node.js.)

Use one or the other, never both on the same page.

## 1. Load

Use the copies in the project (see above). Paths below are relative to the copied files - adjust them.

```html
<link rel="stylesheet" href="./vanilla-tabs.css" />
<script type="module">
  import vanillaTabs from "./vanilla-tabs.esm.js?vanilla-tabs-autoenable";
</script>
```

Older setups (classic script, put it at the end of `<body>`, it reads `document.body` immediately):

```html
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

- `?vanilla-tabs-autoenable` turns on click handling, activates all tabs present and watches the DOM for
  tabs added later. For the classic script `<body class="vanilla-tabs-autoenable">` has the same effect.
  With a bundler the query string cannot be used - call `vanillaTabs.autoenable()` yourself.
- Both files also define `window.vanillaTabs`; the ESM one additionally exports it (default and named `vanillaTabs`).
- The files are generated from `vanilla-tabs.ts` in https://github.com/stopsopa/tabs - never edit the `.js` / `.esm.js` files.
- Only if copying is impossible (no place for local files), load from the CDN:
  `https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.{css,js,esm.js}` (latest).
  Pinned versions `https://cdn.jsdelivr.net/gh/stopsopa/tabs@<tag>/vanilla-tabs.{css,js}` lack colors via
  variables/attributes, overflow arrows, the `vanilla-tabs:change` event and `vanillaTabs.on()` (they exist only in versions newer than `v1.0.1`).

## 2. Markup

```html
<div data-vanilla-tabs>
  <div data-buttons>
    <span>first</span>
    <span class="active">second</span>
    <a href="javascript:;">third</a>
  </div>
  <div data-tabs>
    <div>content of first</div>
    <div>content of second</div>
    <div>content of third</div>
  </div>
</div>
```

Rules:

- `[data-buttons]` and `[data-tabs]` must be **direct children** of `[data-vanilla-tabs]`.
- Buttons are the direct children of `[data-buttons]` (any tag); panels are the direct `<div>` children of `[data-tabs]`.
  They are matched **by position**, so the counts must be equal - otherwise the library throws.
- Put `class="active"` on one button to choose the initially open tab. Without it the first one opens.
  Do not add `active` to the panels - the library does it.
- Keep button content plain text. A click on an element nested inside a button is not recognised.
- Do not add other direct children to `[data-vanilla-tabs]`. The library itself injects two
  `<button data-vanilla-tabs-nav="prev|next">` elements there - leave them alone.
- Tabs can be nested: put another `[data-vanilla-tabs]` inside a panel.

## 3. Colors

Transparent by default (the page background shows through). Two CSS variables:

| variable | default | what |
| --- | --- | --- |
| `--vanilla-tabs-background-color` | `transparent` | active button + panel background |
| `--vanilla-tabs-lines-color` | `#565656` | borders, button text, arrows |

```html
<!-- all instances -->
<style>
  [data-vanilla-tabs] {
    --vanilla-tabs-background-color: white;
    --vanilla-tabs-lines-color: #565656;
  }
</style>

<!-- one instance: style -->
<div data-vanilla-tabs style="--vanilla-tabs-background-color: white">...</div>

<!-- one instance: attributes (copied to the variables by JS) -->
<div data-vanilla-tabs data-background-color="white" data-lines-color="navy">...</div>
```

The variables are inherited, so nested tabs get the colors of the outer one unless they set their own.

## 4. More tabs than fit

Nothing to do: when buttons do not fit in the available width, prev/next arrows appear and the
row of buttons scrolls. This is re-checked on resize and when buttons are added or removed.
Only when the page does **not** use autoenable / `watchMutationsEnable()` and buttons were changed by script, call
`vanillaTabs.updateOverflow(element)`.

## 5. Run code when a tab becomes visible

Every time a tab becomes visible (including the initially active one) the CustomEvent `vanilla-tabs:change`
is dispatched on the panel element and bubbles. `event.detail` is `{ parent, button, tab, index }`:
`parent` - the `[data-vanilla-tabs]` element, `button` - the button, `tab` - the panel, `index` - zero based.
It is not fired again when the already active tab is clicked.

Global listener - covers all tabs, also created later. Register it **before** the script loading the library,
otherwise events of initially active tabs are missed:

```html
<script>
  document.addEventListener("vanilla-tabs:change", function (e) {
    const { parent, button, tab, index } = e.detail;

    // lazy load: only the first time the tab is shown
    if (tab.matches("#lazy") && !tab.dataset.loaded) {
      tab.dataset.loaded = "true";
      // load content here
    }
  });
</script>
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Listener bound to one tabs element - it lives on that element, so it is destroyed together with the element when
the element is removed (no cleanup needed). Events from nested tabs are ignored:

```js
const unbind = vanillaTabs.on(element, function ({ parent, button, tab, index }) {});
// unbind(); // optional
```

`vanillaTabs.on()` is available only after the library is loaded, so it does not see the event of the tab
which was active on page load - handle the initial state directly or use the global listener above.

## 6. JS API (`window.vanillaTabs`)

Needed only without autoenable or for programmatic control.

| call | what |
| --- | --- |
| `bind()` | start handling clicks (one delegated listener on `document.body`); returns unbind function |
| `active()` | activate initial tab in every `[data-vanilla-tabs]` on the page; returns array of ids |
| `watchMutationsEnable()` / `watchMutationsDisable()` | automatically handle tabs added later |
| `activeByIndex(element, zeroIndex)` | switch tab programmatically |
| `activeByButtonElement(element, buttonElement)` | switch tab programmatically by its button |
| `on(element, callback)` | see section 5 |
| `updateOverflow(element)` | see section 4 |
| `autoenable()` | `bind()` + `active()` + `watchMutationsEnable()` in one call; what `?vanilla-tabs-autoenable` does |
| `autoenableUnbind()` | exists only in autoenable mode; stops everything |

Manual setup equal to autoenable:

```html
<script src="vanilla-tabs.js"></script>
<script>
  vanillaTabs.bind();
  vanillaTabs.active();
  vanillaTabs.watchMutationsEnable();
</script>
```

## Don'ts

- Don't write custom click handlers toggling `active` classes - use `activeByIndex()`.
- Don't hide/show panels with your own CSS; visibility is driven by the `active` class.
- Don't override the layout of `[data-vanilla-tabs]` (`display: grid`) or `[data-buttons]` (`display: flex; overflow-x: auto`) -
  overflow arrows depend on it. Restyle through the CSS variables.
- Don't use the old `--background-color` / `--lines-color` variable names; they no longer exist.

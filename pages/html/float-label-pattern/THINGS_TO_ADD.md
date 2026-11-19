# Things to add

Ideas for extending `floating-label-pattern.css` and the demo `index.html`. Nothing here is implemented.
Section names like `FORM`, `SOURCE`, `CSS-FIELD` are defined in `index.md`.

Every idea was filtered through the library's rules: one CSS file, no JavaScript, native HTML elements, as few wrappers as possible.
Each item says whether it fits those rules fully, partly, or not.

Browser versions quoted below are from memory. Check them (caniuse / MDN) before relying on one.

## Summary

Ordered by how much I think each one helps when building real screens.

| #    | Item                                                          | Pure CSS?                    | New markup                  | Effort |
| ---- | ------------------------------------------------------------- | ---------------------------- | --------------------------- | ------ |
| A1   | Form layout: rows, columns, button bar                        | yes                          | 1 wrapper class             | small  |
| A2   | Outlined and danger buttons, link as button                   | yes                          | class on the button         | small  |
| A3   | Callout / banner (note, warning, error, success)              | yes                          | 1 element                   | small  |
| A4   | Required marker added automatically                           | yes                          | none                        | tiny   |
| A5   | Check all other input types                                   | yes                          | none                        | medium |
| A6   | Switch (toggle)                                               | yes                          | 1 class or attribute        | small  |
| A7   | Dark mode                                                     | yes                          | none                        | medium |
| A8   | Reduced motion                                                | yes                          | none                        | tiny   |
| B1   | Table                                                         | yes                          | none (`<table>`)            | medium |
| B2   | Field adornments: unit, icon, trailing button                 | yes (button action needs JS) | 1-2 elements in the wrapper | medium |
| B3   | Group with a title: `<fieldset>` + `<legend>`                 | yes                          | native elements             | small  |
| B4   | Expandable section: `<details>`                               | yes                          | native elements             | small  |
| B5   | Status chip / badge                                           | yes                          | 1 element                   | small  |
| B6   | More text elements: `h1`, `h3`, `code`, lists, key-value list | yes                          | none                        | small  |
| B7   | Read-only, success and warning field states                   | yes                          | attribute on the wrapper    | small  |
| B8   | Progress bar and spinner                                      | yes                          | `<progress>` or 1 element   | small  |
| C1   | Dialog: `<dialog>`                                            | styling yes, opening no      | native element              | medium |
| C2   | Menu / tooltip: `popover`                                     | yes                          | native attributes           | medium |
| C3   | Tabs                                                          | look yes, behaviour no       | list of buttons             | medium |
| C4   | Card / panel                                                  | yes                          | 1 class                     | tiny   |
| C5   | Dense variant                                                 | yes                          | class on a container        | small  |
| C6   | Right-to-left languages                                       | yes                          | none                        | medium |
| D1-9 | Demo page improvements                                        | -                            | -                           | varies |
| E1-4 | Packaging: layers, versions, tests                            | -                            | -                           | varies |

Tiers: **A** = gaps you will hit on the first real form. **B** = needed for a typical console-style page. **C** = useful, less often. **D** = the demo. **E** = the library as a product.

---

## A. Gaps in what exists today

### A1. Form layout: rows, columns, button bar

**Problem.** The library styles each field, but says nothing about arranging them. Two fields side by side, or a row of buttons with proper spacing, must be written by hand every time. Today the two buttons in `BUTTONS` are separated only by the whitespace between the tags.

**Idea.**

```html
<div class="row">
  <div class="input-wrapper">...</div>
  <div class="input-wrapper">...</div>
</div>

<div class="actions">
  <button>Create</button>
  <button class="secondary">Cancel</button>
</div>
```

- `.row`: CSS grid, equal columns, same gap as between fields, collapses to one column when narrow (`repeat(auto-fit, minmax(220px, 1fr))` needs no media query).
- `.actions`: flex row with a fixed gap. Optional modifier to align right.
- Also worth adding: a default `max-width` for a form, since full-width fields on a wide screen are hard to read.

**Fit:** full. This is the item I would do first.

### A2. More button variants

**Problem.** There are two buttons: filled and text-only. The GCP console also uses an outlined button constantly, and every app needs a destructive one.

**Idea.**

- `class="outlined"`: white background, gray border, blue text.
- `class="danger"`: red, combinable with the others (`class="outlined danger"`).
- `<a class="button">`: a link that looks like a button, for navigation ("Back to list"). Today a link cannot be made to look like a button.
- Button with an icon: a rule for an `<svg>` or `<img>` child (size, gap). No icon set included.
- Loading state: `aria-busy="true"` on the button shows a small CSS spinner and blocks clicks. The attribute is the accessible way to say "busy", so the look and the meaning come from one place.

**Fit:** full.

### A3. Callout / banner

**Problem.** The demo's `NOTE` is an external web component (`alert-box`) loaded from another repository. It needs JavaScript and is not part of the library, so "import one file" does not cover it.

**Idea.**

```html
<div class="callout">Plain information.</div>
<div class="callout warning">Check this before you continue.</div>
<div class="callout error">Something failed.</div>
<div class="callout success">Saved.</div>
```

Left colour bar, tinted background, icon from a CSS mask (the same technique as the error icon). Add `role="alert"` in the HTML for errors that appear dynamically.

**Fit:** full. It would also remove the only external dependency of the demo.

### A4. Required marker added automatically

**Problem.** In the demo the star is typed by hand: `Project Name *`. The label text and the `required` attribute can disagree. `F-NAME` and `F-PASSWORD` show a star but have no `required` attribute.

**Idea.** One rule: when the control has `required`, the label gets ` *` from CSS.

```css
&.input-wrapper:has(:required) label::after {
  content: " *";
}
```

**Fit:** full. Tiny. One thing to decide: whether the star should be red.

### A5. Check all other input types

**Problem.** `CSS-FIELD` was built and tested with `text`, `email`, `password`, `textarea` and `select`. Other types go through the same rules and I have not looked at any of them in a browser.

What I expect, to be confirmed:

| Type                                              | Likely issue                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `date`, `time`, `datetime-local`, `month`, `week` | The browser shows its own `mm/dd/yyyy` template inside the field. The label must stay floated all the time or the two overlap. |
| `number`                                          | Spinner arrows: keep, restyle or hide.                                                                                         |
| `search`                                          | Browser's own clear (x) button and rounded look in Safari.                                                                     |
| `file`                                            | Completely different structure ("Choose file" button inside). Needs its own rules, probably without a floating label.          |
| `range`                                           | Not a text field. Needs a track and thumb in the primary colour.                                                               |
| `color`                                           | Swatch field. Low priority.                                                                                                    |
| `select multiple`, `select size="5"`              | A list, not a dropdown. The arrow must be hidden and the label always floated.                                                 |
| `input list="..."` with `<datalist>`              | Native autocomplete. Should work as a text field. The browser adds its own arrow in some browsers.                             |

**Idea.** Add a second demo block with one field of each type, fix what is broken, and list the supported types in `CSS-DOC` and `skill.md`.

**Fit:** full. Mostly testing.

### A6. Switch (toggle)

**Problem.** The GCP console uses on/off switches for settings. The library has only a checkbox.

**Idea.** A checkbox drawn as a switch. Same flat markup as `F-AGREE`:

```html
<div class="checkbox-wrapper">
  <input type="checkbox" role="switch" id="logs" />
  <label for="logs">Enable logging</label>
  <div class="helper-text">Logs are kept for 30 days.</div>
</div>
```

Keyed on `role="switch"`, which is also what tells a screen reader it is a switch. No new class.

**Fit:** full.

### A7. Dark mode

**Problem.** Colours are variables, but there is only a light set, and some colours are still hard-coded: `h2` and `p` text, button shadows, the white tick of the checkbox, white button text.

**Idea.**

1. Move the remaining hard-coded colours to variables.
2. Add a dark set, applied in two ways: automatically with `@media (prefers-color-scheme: dark)`, and by force with a class or `data-theme="dark"` on any container.
3. Set `color-scheme` so native parts (select dropdown list, date picker, scrollbars) follow.

**Fit:** full. The main cost is choosing the dark palette and checking contrast.

**Note:** `--gcp-css-bg` must equal the background behind the form, because the floated label uses it to cover the border. In dark mode, and on any coloured panel, this must be set correctly. It is the most fragile part of the floating label and worth a demo case (form on a gray card).

### A8. Reduced motion

**Problem.** Some users set "reduce motion" in their operating system. The label animation ignores it.

**Idea.**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --gcp-css-transition: 0s;
  }
}
```

Works because nearly every transition already uses the variable. The checkbox tick uses a fixed `120ms` and should be moved to the variable first.

**Fit:** full. Tiny.

---

## B. Needed for a typical console-style page

### B1. Table

**Why.** A GCP-style screen is usually a table of resources plus a form to create one. With forms covered, a table is the largest missing piece.

**Idea.** Style the native `<table>` inside `.gcp-css`: compact rows, thin row separators, gray uppercase-free header, row hover, right-aligned numbers via a class on the cell, sticky header as an option, checkbox column using the existing checkbox look.

For wide tables on narrow screens: a `.table-scroll` wrapper with `overflow-x: auto`. That is the one wrapper this needs.

**Fit:** full for looks. Sorting, selection and pagination are behaviour and stay outside the library.

**Decision needed:** style every `<table>` inside `.gcp-css` automatically (like `h2` and `p` today) or only `table.table`. Automatic is consistent with the current file, but tables are often used by third-party widgets inside a page.

### B2. Field adornments

**Why.** Very common in real forms: a unit after the number (`GB`, `%`), a currency before it, a search icon, a "show password" or "clear" button inside the field.

**Idea.**

```html
<div class="input-wrapper">
  <span class="prefix">$</span>
  <input type="number" id="price" placeholder=" " />
  <label for="price">Price</label>
  <span class="suffix">per month</span>
</div>
```

**Difficulty.** The border now sits on the `<input>` itself. With adornments, the border must surround input and adornments together, so for this variant the border has to move to a shared box. Either the wrapper draws it (`:has(.prefix, .suffix)`), or one inner wrapper is added. It also shifts the resting position of the label.

**Fit:** the look is pure CSS. A "show password" or "clear" button needs a line of JavaScript on the page. This is the hardest item in tier B. Design it before starting.

### B3. Group with a title: `<fieldset>` + `<legend>`

**Why.** The radio group in the demo is titled by a separate `<h2>` (`H-RADIO`). Nothing connects the title to the group, so a screen reader announces "Standard Plan, radio button" without the question. The native answer is `<fieldset>` with `<legend>`.

**Idea.** Reset the browser's default fieldset look (border, padding, min-width) and style `legend` like the current `h2`. Allow `<fieldset class="radio-wrapper">` directly.

Bonus: `<fieldset disabled>` natively disables every control inside it. The existing `:has(:disabled)` rules should already react. Worth a demo case, because it is the simplest way to disable a whole form section.

**Fit:** full, and it improves the native-HTML goal.

### B4. Expandable section: `<details>`

**Why.** "Advanced options" hidden by default is a standard pattern in the GCP console. HTML has it built in, with keyboard support and no JavaScript.

```html
<details>
  <summary>Advanced options</summary>
  ...fields...
</details>
```

**Idea.** Style `summary` (blue text, rotating chevron from a CSS mask, focus ring) and the content spacing.

**Fit:** full.

### B5. Status chip / badge

**Why.** "Running", "Stopped", "Error" next to a resource name. Used in tables and headings.

```html
<span class="chip success">Running</span>
```

Variants: neutral, success, warning, error, info. Small rounded label with a tinted background.

**Fit:** full.

### B6. More text elements

**Why.** Only `a`, `h2` and `p` are styled. A page built with the library quickly needs more.

- `h1` (page title), `h3` (sub-section).
- `code`, `kbd`, `pre`: resource names and commands are everywhere in a cloud console.
- `ul`, `ol`.
- `hr` as a section divider.
- `dl` / `dt` / `dd` as a key-value list ("Zone: europe-west1", "Created: ...") in two columns. This is the standard layout of a "details" page.
- `small`.

**Fit:** full.

**Decision needed:** the more bare elements are styled automatically, the more likely the library changes content it was not meant to touch. `no-gcp-css` exists for that, but a rule of thumb would help, for example: form controls and text elements automatic, everything else by class.

### B7. More field states

- **Read-only.** `readonly` on an input looks exactly like an editable field today. GCP shows it with a gray background and no focus ring colour change.
- **Success** and **warning**: `data-success` / `data-warning` on the wrapper, like `data-error`, with a matching message element. Useful for "name is available" checks.

**Fit:** full.

### B8. Progress bar and spinner

- Native `<progress>`: thin blue bar. Without a `value` attribute it is "indeterminate" and gets a moving animation.
- A spinner for inline "loading" (shared with the loading button in A2).

**Fit:** full. Styling `<progress>` needs separate vendor-prefixed selectors for Chrome/Safari and Firefox.

---

## C. Useful, less often

### C1. Dialog

Native `<dialog>`: style the box, title, button bar (reuse `.actions` from A1) and `::backdrop`.

**Fit:** partly. The look is CSS. Opening it needs one line of JavaScript (`dialog.showModal()`). Closing does not: `<form method="dialog">` closes it natively. There are newer HTML attributes (`command` / `commandfor`) that open a dialog with no script, but they are recent and need a browser-support check before relying on them.

### C2. Menu and tooltip with `popover`

The `popover` attribute opens and closes an element from a button with no JavaScript, including closing on outside click and on Escape.

```html
<button popovertarget="menu">Actions</button>
<div id="menu" popover>...</div>
```

**Idea.** Style `[popover]` as a GCP menu (white card, shadow, list of items).

**Fit:** opening and closing: full. Placing the menu next to its button needs CSS anchor positioning, which is newer than the rest of the file. Without it the popover appears in the centre of the screen. Check support first; this decides whether the item is worth doing now.

A simple text tooltip is possible today with `[data-tooltip]:hover::after`, but it does not work on touch screens or for keyboard users, so I would not present it as a solution.

### C3. Tabs

**Fit:** partly. The look (underlined active tab) is easy. Correct behaviour (which panel is shown, arrow keys, ARIA) needs JavaScript. The "radio button hack" makes it work without JavaScript but is confusing for screen readers. Suggestion: provide the look only, keyed on `role="tablist"` / `role="tab"` / `aria-selected="true"`, and leave behaviour to the page.

### C4. Card / panel

`class="card"`: border, radius, padding, optional title. Trivial, but it is what every page wraps its sections in, and it gives a place to set `--gcp-css-bg` correctly for forms on a coloured background (see A7).

### C5. Dense variant

A class on a container (`dense`) that reduces field height, font size and gaps, for filter bars above tables and for fields inside table rows. Mostly variables, if paddings are moved to variables first.

Related: a field without a visible label (`aria-label` only), for a search box in a toolbar.

### C6. Right-to-left languages

Replace physical properties with logical ones (`margin-left` → `margin-inline-start`, `padding-right` → `padding-inline-end`, `justify-self: start` already works). Then `dir="rtl"` works with no extra rules. Only worth doing if a right-to-left language is a real requirement.

---

## D. Demo page (`index.html`)

- **D1. Reverse hover.** Hovering a tag in `SOURCE` highlights the element in `FORM`. The `Map` already exists; it needs the opposite direction.
- **D2. Click to copy one element.** Click an element in `FORM` (with a modifier key) or a tag in `SOURCE` to copy just that element's HTML. Today it is select-by-hand or "copy all".
- **D3. More control switches** in `CONTROLS`: dark mode (after A7), right-to-left, page font size, form on a gray background, `no-gcp-css` on the form (shows the same markup unstyled, which demonstrates the on/off switch and the "still usable without CSS" claim).
- **D4. Theme playground.** Colour inputs for the `--gcp-css-*` variables that update the form live, plus a box with the resulting `:root { ... }` block to copy.
- **D5. Second, realistic form.** The current form is a catalogue: one of each. A second one modelled on a real screen ("Create instance": name, region select, machine type radios, a row of two fields, advanced options in `<details>`, button bar) would show how the pieces combine, and would have caught the missing layout helpers (A1).
- **D6. Input types block** (the test bed for A5).
- **D7. Edge cases block:** very long label, long helper text, long error, field in a narrow column, pre-filled field, long text in the select. Some are reachable today only by typing.
- **D8. Split `FORM` into titled blocks with anchors**, so a link can point at one component, and `SOURCE` can show one block at a time. The source panel is already long.
- **D9. Fix the viewport meta** (open item 4.7 in `SUGGESTED_CHANGES.md`) and resolve autofill (open item 2.3). Both are small and already analysed.

One more, related to the demo script: `field-sizing: content` is a CSS property that makes a textarea grow with its text. Where it is supported, it replaces `S-AUTOGROW` with one line of CSS and could move into the library. Browser support was incomplete when I last knew it; check before using.

---

## E. The library as a product

### E1. Cascade layer

**Problem.** Because of `@scope`, the library's selectors have low priority in a predictable way, but a page with its own generic CSS (`input { ... }`, a reset) can still fight with it in both directions.

**Idea.** Wrap the file in `@layer gcp-css { ... }`. Then any normal (unlayered) CSS of the page always wins over the library, without `!important` and without counting selector weight.

**Trade-off, needs a decision.** It also means a page's CSS reset (`button { border: 0 }`, `input { padding: 0 }`) wins over the library and can break the look. Layers help the careful user and hurt the page with an aggressive reset. Supported by the same browsers the file already requires.

### E2. Version and changelog

The file is imported by URL from other projects, and this session alone changed the markup contract twice (flat checkbox markup, `white` → `secondary`). A version comment at the top of the CSS and a short `CHANGELOG.md` listing breaking changes would make updates safe. An option on top: keep frozen copies (`floating-label-pattern.v1.css`) so a project can pin one.

### E3. Automated checks

The repository already has Playwright. Two cheap tests:

- **Screenshot test** of the demo in each state (default, errors, disabled, focus). Catches unintended visual changes, which is the main risk when editing a shared CSS file.
- **Cross-browser run** (Chromium, Firefox, WebKit). So far everything was checked in Chrome only, while the file uses several features where browsers differ.

### E4. A second skill file or section for page building

`skill.md` covers forms. Once layout, table and callout exist (A1, A3, B1), it should gain a section on composing a whole page, with one complete example, since that is what an AI assistant will be asked to produce.

---

## What I would not add

- **Custom dropdown, date picker, autocomplete with remote data, toast notifications, drag and drop.** All need JavaScript and state. They would turn a stylesheet into a component library, with a different maintenance cost. The native versions (`<select>`, `<input type="date">`, `<datalist>`) are covered by A5.
- **An icon set.** Large and a matter of taste. The library should only define how an icon sits next to text (A2).
- **A page shell** (top bar, side navigation). Too specific to each application.
- **Utility classes** (`mt-2`, `flex`, ...). A different kind of library.

## Suggested order

1. A1, A4, A8: small, immediately useful, no design questions.
2. A2, A3: completes the basic set and removes the demo's external dependency.
3. A5 with D6: find out what is broken before building on top.
4. B3, B4, A6: native elements, small.
5. B1: the big one. Do it together with D5 (a realistic page) to test it.
6. A7: dark mode, once the set of components is stable, so the palette is defined once.
7. E3 before any further large change.

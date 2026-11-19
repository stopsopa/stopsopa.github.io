# Suggested changes for `floating-label-pattern.css`

Status after the third round. Checked in Chrome on the local dev server. Not checked in Firefox or Safari.

Legend: **DONE** = implemented, **OPEN** = waiting for your decision, **NOT A CONCERN** = noticed, deliberately left.

Related files:

- `skill.md`: instructions for an AI assistant on how to use this library. Keep it in sync with the CSS.
- `index.html`: demo. The panel on the right prints the HTML of the form straight from the page.

## Open items (need your decision)

| #   | Item                           | Section |
| --- | ------------------------------ | ------- |
| 2.3 | Autofill                       | below   |
| 4.7 | Viewport meta in the demo page | below   |

## New thing to know: `@scope`

The "closest `.gcp-css` or `.no-gcp-css` wins" rule you asked for (3.3) cannot be written with ordinary selectors. It needs the CSS `@scope` rule:

```css
@scope (.gcp-css) to (.no-gcp-css) {
  ...;
}
```

Browser support: Chrome 118, Safari 17.4, Firefox 146 (December 2025).
Firefox is the limit here: a Firefox older than about a year ignores the whole file.
You said the nesting floor (2.1) is not a concern, and this is the same kind of trade, only about two years more recent for Firefox.
If that is too new, the fallback is "`.no-gcp-css` turns it off, but nesting `.gcp-css` inside it does not turn it back on", which works with plain selectors.

---

## 1. Bugs

### 1.1 `.error` in checkbox/radio wrappers was never hidden - DONE

One rule now covers all three wrappers: hidden by default, shown in the error state.

### 1.2 The usage example in `index.html` - DONE

The box at the bottom now holds only the link to the CSS file and the `<link rel="stylesheet">` line. The broken HTML snippet is removed.
The box is marked as `data-lang="html"` without `data-eval`, so the `SyntaxError` in the console on page load is gone.
A working, copyable example of every component is now the HTML panel next to the form.

### 1.3 `.helper-text` and `.error` scoping - DONE

You were right about most of the file, but not about these two rules. They were written like this:

```css
.helper-text {
  ...;
}
.input-wrapper > .error {
  display: none;
  ...;
}
```

There is no `.gcp-css` in either selector, so they applied to the whole page, also outside `.gcp-css`.
Now everything in the file lives inside the `@scope` block, so nothing leaks out.
Tested: an `.input-wrapper > .error` outside `.gcp-css` is left alone.

### 1.4 Error fade-in never ran - DONE

Removed `opacity`, `transition` and `z-index` from `.error`. It looked the same before and after, because the fade could never start from `display: none`.

### 1.5 Disabled buttons contradicted themselves - DONE (option B)

`cursor: not-allowed` is removed, `pointer-events: none` stays. A disabled button shows the normal arrow cursor and has no hover effect.

### 1.6 Select arrow: blue arrow with a red ring - DONE

The ▾ triangle of a select is now red when the field is in the error state, also while it has focus. Confirmed in the browser.

## 2. Browser compatibility

### 2.1 Native CSS nesting - NOT A CONCERN

Noticed: needs Chrome 120, Safari 17.2, Firefox 117. Decision: keep nesting and rely on it.
(See the `@scope` note at the top: that is now the highest floor in the file.)

### 2.2 Windows high-contrast mode - NOT A CONCERN

Noticed, not a goal. Side effect of 3.2: the field now has a real `border`, so the field outline does show up in that mode anyway. The focus ring (a `box-shadow`) still does not.

### 2.3 Autofill - OPEN (explanation only, nothing changed)

Autofill is when the browser offers to fill a field with something it remembers: your name, email, a saved password.
I have not reproduced the two issues below on this page; they are known behaviours of this kind of floating label.

**Issue A: label can sit on top of the filled-in text.**
The label decides "should I float up?" with one question: "is the field empty?".
There are moments when the browser shows text in the field but still reports the field as empty:

- You click the field, the browser shows a list of saved emails, and you move the mouse over one of them. The browser shows that email in the field as a preview. It is not really typed in until you click.
- A login page opens and Chrome has already put the saved password in. For security reasons Chrome can hide that value from the page until the user clicks or presses a key.

In those moments the label stays in the middle of the field, on top of the previewed text, and the two overlap.

Fix: the browser has a second signal, "I am autofilling this field" (`:autofill`). Adding it to the float condition makes the label float in those moments too. It is one extra word in one selector:

```css
:is(input, textarea): is(: not(: placeholder-shown), : focus, : autofill) + label;
```

**Issue B: white patch behind the label.**
After autofill, the browser paints the field light blue (Chrome) or yellow, to mark "I filled this, not you".
The floated label has its own white background (that is how it "cuts" the border line). On a light blue field it shows as a small white rectangle.
Purely cosmetic. The fix is more awkward (overriding the browser's tint), so I would do A and leave B.

### 2.4 Small things - DONE / dropped

- `mask` order (prefixed first, standard last): done.
- `-webkit-appearance`: dropped, irrelevant with the current browser floor.

## 3. Simplification

### 3.1 Flat checkbox/radio markup - DONE

`.checkbox-row` and `.content-cell` are gone, and so are the inline styles in the radio group.

```html
<div class="gcp-css checkbox-wrapper">
  <input type="checkbox" id="agree" />
  <label for="agree">I agree</label>
  <div class="helper-text">...</div>
  <div class="error">...</div>
</div>
```

A group repeats `input`, `label`, `helper-text`, `error` inside one wrapper. The only rule: `<label>` directly after its `<input>`.
`checkbox-wrapper` and `radio-wrapper` are now the same thing; the look depends on the `type` of the input.

### 3.2 Border on the input itself - DONE

The wrapper `::after` layer and every `z-index` are gone. The border is on the control; focus adds a 1px shadow, so the ring is 2px as before and nothing moves.
Field size and text position are the same as before (padding went from `8px 12px` to `7px 11px` to make room for the 1px border).

Because of the border, the textarea auto-grow script in `index.html` needed a 2px correction (done).

### 3.3 Scoping: closest `.gcp-css` / `.no-gcp-css` wins - DONE

- `.gcp-css` on an element styles that element and everything inside.
- `.no-gcp-css` turns it off for that element and everything inside.
- `.gcp-css` inside `.no-gcp-css` turns it on again.

Tested all three, plus `.gcp-css` directly on a `<p>` and on an `.input-wrapper`.
Each block is now written once instead of twice. See the `@scope` note at the top for the browser floor.

### 3.4 Dead and redundant code - DONE

Everything listed in the first round is removed.

### 3.5 Variables - DONE

- New: `--gcp-css-field-gap`, `--gcp-css-link`, `--gcp-css-primary-hover`.
- Field background and label background both use `--gcp-css-bg`.
- Input text uses `--gcp-css-text`.
- Select arrow: one icon, coloured from the variables.
- `.white` button hover/active tints are derived from `--gcp-css-primary` with `color-mix()`.

Left as they were: the `h2` / `p` text colours and the button shadows.

## 4. Robustness and accessibility

- **4.1 Long labels - DONE.** Cut with "…" instead of sticking out of the field.
- **4.2 Markup contract - DONE.** Comment block at the top of the CSS file: how to turn it on/off, markup for each component, states.
- **4.3 Native validation - DONE.** `:user-invalid` triggers the same error look as `data-error`, for all three wrappers. It appears only after the user has interacted with the field or tried to submit. `data-error` still works.
- **4.4 Screen readers - DONE in the demo.** Every control has `aria-describedby` pointing at its helper text. The first field has a long HTML comment explaining why. A small `setError()` function in the page script adds `aria-invalid` and the error id when the error is switched on. It relies on the id convention `name` → `name-helper`, `name-error`.
- **4.5 Links - DONE.** Hover: underline gets thicker (1px → 2px). Keyboard focus: the same blue outline as buttons.
- **4.6 Radio group disabled - DONE.** Only the disabled option (input, its label, its helper text) is dimmed. "Toggle All Disabled" in the demo now disables every control, not only the first one in each wrapper.

### 4.7 Viewport meta in the demo page - OPEN (explanation only)

`index.html` has:

```html
<meta
  name="viewport"
  content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
/>
```

`user-scalable=no` and `maximum-scale=1.0` tell a phone browser: do not let the user zoom this page with two fingers.

Why that is a problem:

- People with weaker eyesight zoom in to read. Here the helper and error texts are 12px, exactly the kind of text people zoom for. Blocking zoom is a listed accessibility failure (WCAG 1.4.4, "Resize text").
- It does not work consistently: iOS Safari has ignored it since iOS 10, Android Chrome obeys it.

Why it is usually there: to stop iOS from zooming in when you tap an input. iOS only does that for inputs with a font smaller than 16px, and this file already uses 16px, so the restriction buys nothing.

It affects only this demo page, not the CSS file. Replacement, if you want it:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### 4.8 Button class name and reset buttons - DONE

- The secondary button class is now `secondary`. `white` still works as an alias, so existing pages do not break. New code should use `secondary`.
- `input[type="reset"]` is styled like the other buttons.

## Demo page: HTML panel - DONE

Next to the form there is a panel with the HTML of the whole form.

- It is generated by a script from the real `<form>` element when the page loads, so it cannot get out of sync with the form.
- Hovering any element in the form (fields, labels, helper texts, links, the buttons) highlights its HTML in the panel and scrolls the panel to it.
- The panel is plain selectable text. Select any part and copy, or use "copy all".
- It is live. Typing, selecting and checking in the form, and the demo controls (error, disabled, hide helper), are reflected at once as `value`, `selected`, `checked`, textarea text, `data-error`, `disabled` and so on. The panel always shows the HTML that produces the form in its current state.
- Not printed on purpose: `style` attributes (form width, textarea height) and the value of the password field (the browser may autofill a real saved password).
- `&nbsp;` in `placeholder` is printed as the entity, so a copied snippet keeps working.

## Visible differences after this round

Things that look different from before, so you know they are intentional:

- Checkbox in error state and checked: the fill is red (before: blue fill with a red border).
- Error message order follows the HTML order (before, in text fields it was forced above the helper text; the demo markup already has it first).
- Checkbox/radio error messages are hidden until the error state (this was bug 1.1).
- "Toggle All Disabled" on the radio group dims both options, because both are disabled now.

## 5. What is good and should stay

- CSS grid stacking (`grid-area: 1 / 1`) for label over input: no absolute positioning, no fixed heights.
- `:placeholder-shown` for the float: no JavaScript.
- `select:has(option:not([value=""]):checked)` for the select label.
- Icons as `mask` + `currentColor`.
- 16px input font size: no zoom on focus in iOS Safari.
- `--gcp-css-` prefixed variables.

## Done in round one: link icon underline

The link uses a real text underline, which is not drawn under the `inline-block` icon.
Long external links now wrap like normal text.

# Suggested changes for `floating-label-pattern.css`

Review based on reading `floating-label-pattern.css` and `index.html` (not on browser testing).
Ordered by how much each item matters for the stated goals: simplicity, browser compatibility, native HTML.

Already done: the `target="_blank"` link icon is no longer underlined (see the last section).

## 1. Bugs

### 1.1 `.error` in checkbox/radio wrappers is never hidden

The only rule that hides the error is `.input-wrapper > .error { display: none }`.
Inside `.checkbox-wrapper` / `.radio-wrapper` the error sits in `.content-cell`, so nothing hides it:
"You must check this box to continue." and "This plan is currently unavailable in your region." are visible all the time, as plain unstyled text (the red colour, icon and font size also live in the `.input-wrapper > .error` rule).

Fix: make one rule for all three wrappers, e.g.

```css
.gcp-css .error {
  display: none; /* + colour, font-size, icon */
}
.gcp-css [data-error] .error,
.gcp-css[data-error] .error {
  display: flex;
}
```

### 1.2 The usage example in `index.html` does not work

The snippet at the bottom shows `<div class="gcp-css">` with `<input>` + `<label>` directly inside.
The floating label styles need `.input-wrapper`, so that markup renders unstyled.
The example should be `<div class="gcp-css input-wrapper">`.

### 1.3 `.helper-text` and `.input-wrapper > .error` are not scoped

Everything else is under `.gcp-css`, but these two rules are global.
Importing the file changes any `.helper-text` on the host page, and hides any `.error` that is a direct child of an `.input-wrapper`.
Both are very common class names. Scope them under `.gcp-css` like the rest.

### 1.4 Error fade-in never runs

`.error` goes from `display: none; opacity: 0` to `display: flex; opacity: 1`.
A transition cannot start from `display: none`, so the `opacity` and `transition` lines do nothing.
Simplest: delete `opacity`, `transition` and `z-index` from `.error`.

### 1.5 Disabled buttons contradict themselves

`cursor: not-allowed` plus `pointer-events: none`: with pointer events off the cursor is never shown.
Drop `pointer-events: none` (a disabled button does not fire clicks anyway), and guard hover with `&:hover:not(:disabled)`.

### 1.6 Focused select in error state shows a blue arrow with a red ring

The error arrow is set through `:where([data-error]) &`, which has lower specificity than `&:focus`.
That block is also duplicated: the two selectors in it match the same elements, and text colour is set again in the `& [data-error], &[data-error]` block further down.
Move the error arrow into that later block and delete the `:where` block.

## 2. Browser compatibility

### 2.1 Native CSS nesting is the highest compatibility floor in the file

The file uses nesting with bare element selectors (`label { ... }` inside a rule, without `&`).
That needs Chrome 120, Safari 17.2, Firefox 117 (all late 2023).
A browser without nesting support does not degrade: it drops nearly every rule in the file.

Options:

- Accept it. Everything from the last ~3 years works. `:has()` (Firefox 121, Dec 2023) sets a similar floor anyway.
- Flatten the selectors. More repetition, but the file then works in much older browsers, with `:has()` only affecting the select label and the disabled look.

If compatibility is a real priority, flattening is the one change that buys the most.

### 2.2 Windows high-contrast mode (forced colors) loses the field border

The field border and focus ring are drawn with `box-shadow` on `::after`, and the input has `border: none; outline: none`.
Forced-colors mode removes box-shadows, so fields have no border and no focus indicator at all.
See 3.2 for a fix that also simplifies the code.

### 2.3 Autofill

- Add `:autofill` to the float condition, so the label also floats while Chrome previews an autofill value:
  `&:is(input, textarea):is(:not(:placeholder-shown), :focus, :autofill) + label`
- Chrome paints autofilled inputs with a light blue background. The label has a white background, so it shows as a white patch. Low priority, purely cosmetic.

### 2.4 Small things

- `appearance: none` has no `-webkit-appearance: none` next to it. Only matters for Safari before 15.4.
- In the link icon the unprefixed `mask` comes before `-webkit-mask`. The convention is prefixed first, standard last, so the standard one wins.

## 3. Simplification

### 3.1 Checkbox/radio: drop `.checkbox-row` and `.content-cell`

Currently a checkbox needs three wrapper levels, and the radio group in `index.html` needs inline styles (`style="grid-row: 1; display: flex; flex-direction: column; gap: 16px"`), which breaks "import one file and you are ready".

A two-column grid gives the same "text never goes under the checkbox" result with the same flat markup shape as `.input-wrapper`:

```html
<div class="gcp-css checkbox-wrapper">
  <input type="checkbox" id="agree" />
  <label for="agree">I agree to the terms and conditions</label>
  <div class="helper-text">Please ensure you have read the policies.</div>
  <div class="error">You must check this box to continue.</div>
</div>
```

```css
.gcp-css .checkbox-wrapper {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 12px;
  row-gap: 4px;
}
.gcp-css .checkbox-wrapper > :not(input) {
  grid-column: 2;
}
```

A radio group can repeat `input, label, helper-text` in the same grid, with a `margin-top` on every input after the first and on its label.
For the group itself, native `<fieldset>` + `<legend>` is the semantic element and could replace the `<h2>` + `<div>`.

### 3.2 Draw the border on the input itself, remove the `::after` layer

The wrapper `::after` exists only to draw the border, and it forces the `z-index: 0 / 2 / 3` stack.
Alternative:

```css
input,
textarea,
select {
  border: 1px solid var(--gcp-css-border);
  border-radius: 4px;
  background: var(--gcp-css-bg);
}
:is(input, textarea, select):focus {
  border-color: var(--gcp-css-primary);
  outline: 1px solid var(--gcp-css-primary); /* 1px border + 1px outline = 2px ring, no layout shift */
  outline-offset: 0;
}
```

This removes the pseudo-element and all `z-index` lines, fixes 2.2, and the ring follows a resized textarea for free.
The label then only needs `position: relative` to stay above the input.

### 3.3 One selector instead of two for "inside or on `.gcp-css`"

Every block is written twice: `.gcp-css :is(X), .gcp-css:is(X)`.
The same can be said once:

```css
:is(.gcp-css, .gcp-css *):is(h2) { ... }
/* or simply */
.input-wrapper:is(.gcp-css, .gcp-css *) { ... }
```

Even simpler: decide that `.gcp-css` always goes on a container, and drop the "on the element itself" variant.
The same applies to the repeated `& [data-error], &[data-error]` pairs: `data-error` is only ever set on the wrapper.

Also `:is(a)`, `:is(h2)`, `:is(p)`, `:is(select)` with a single argument are the same as the plain selector.

### 3.4 Dead and redundant code

- `& .checkbox-wrapper, &.checkbox-wrapper` and `& .radio-wrapper, &.radio-wrapper` inside the shared block: the descendant variants match only a wrapper nested in a wrapper, and `position / display / margin-bottom` are declared again with the same values.
- `& :checked` (with a space) can never match: an input has no children.
- `border-color: ... !important` on the checkbox error rule: specificity is already higher, `!important` is not needed.
- The radio error block repeats the border colour that the shared error block already sets.
- The `label` reset in the checkbox block (`grid-area: auto; align-self: auto; justify-self: auto; margin-left: 0; pointer-events: auto; background: transparent; padding: 0`) undoes `.input-wrapper label` rules that never apply there.
- `.white:hover` and `.white:active` repeat `border-color: transparent` and `box-shadow: none`.
- `textarea { font-family: inherit }` and `textarea + label { align-self: start }` repeat what is already set.
- `transform: translateY(0)` on the label, `/* height: 36px; */`, the commented `.helper-text` block and the commented font `@import`.

### 3.5 Variables

- `margin-bottom: 19px` appears four times: make it `--gcp-css-field-gap`.
- Hard-coded colours next to variables: `background-color: white` on the wrapper `::after` (the label uses `var(--gcp-css-bg)`, so changing the variable gives a mismatched patch), link colour `rgb(12, 103, 223)` versus `--gcp-css-primary`, button hover `#1765cc`, the `%231a73e8` / `%235f6368` / `%23d93025` arrow SVGs.
  The three arrow SVGs can become one `mask` + `background-color: currentColor`, as already done for the link and error icons.
- Input text colour is never set, so it comes from the page. Add `color: var(--gcp-css-text)`.
- Checkbox uses `transition: all 0.2s` instead of `var(--gcp-css-transition)`.

## 4. Robustness and accessibility

- **Long labels**: a label wider than the field overflows it. Add
  `max-width: calc(100% - 14px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- **Markup contract is undocumented**: the pattern needs (a) `<label>` directly after the control, and (b) a non-empty `placeholder` (`" "` is enough, `&nbsp;` is not required). A short comment at the top of the CSS file with the minimal markup for each component would make it a real "import and go" file.
  Worth mentioning there: a real placeholder text works too, it stays hidden until the field is focused.
- **Native validation instead of `data-error`**: `.input-wrapper:has(:user-invalid)` (Chrome 119, Safari 16.5, Firefox 88) shows the error state for `required`, `type="email"`, `pattern` and so on with no JavaScript. `data-error` can stay as the manual override.
- **Screen readers**: nothing connects the error/helper text to the control. `aria-describedby` on the input pointing at the helper/error ids fixes that. It is markup only, no CSS change.
- **Links have no `:hover` / `:focus-visible` style.** Buttons do.
- **`.white`** is a very generic class name. It is scoped to buttons so it is safe, but `.secondary` or `.text` describes it better. `input[type="reset"]` is missing from the button selector.
- **Radio group disabled state**: `:has(:disabled)` dims the whole group when a single option is disabled. With the flat markup from 3.1 it can target one option: `input:disabled, input:disabled + label`.
- **Demo page only**: the viewport meta has `user-scalable=no, maximum-scale=1.0`, which blocks pinch zoom.

## 5. What is good and should stay

- CSS grid stacking (`grid-area: 1 / 1`) for label over input: no absolute positioning, no fixed heights.
- `:placeholder-shown` for the float: no JavaScript, works with autofill and browser-restored values.
- `select:has(option:not([value=""]):checked)` for the select label.
- Icons as `mask` + `currentColor`: they follow the text colour with no extra assets.
- 16px input font size: no zoom on focus in iOS Safari.
- `--gcp-css-` prefixed variables: no collisions with a host page.
- `:focus-visible` on buttons and checkboxes.

## Done: link icon underline

The underline was a `border-bottom` on the `<a>`, and the icon is a `::after` inside the `<a>`, so the border ran under both.
Now the link uses a real text underline (`text-decoration-line` + `text-decoration-thickness: 1px` + `text-underline-offset: 3px`).
Text decoration is not drawn under `inline-block` boxes, so the icon is skipped.

Side effects of the change:

- `display: inline-flex` is gone, so a long external link now wraps across lines like normal text (before, it moved to the next line as one block).
- The underline sits 3px below the baseline instead of at the bottom of the line box. Adjust `text-underline-offset` to taste.
- The icon is positioned with `vertical-align: -2px` and `margin-left: 4px` instead of flex `align-items` / `gap`.

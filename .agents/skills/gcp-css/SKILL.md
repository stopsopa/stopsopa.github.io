---
name: gcp-css
description: Build forms that look like Google Cloud Platform console forms (floating labels, helper text, error messages, checkbox/radio rows, blue primary and text-only secondary buttons) using the single stylesheet gcp-css.css. Use when the user asks for "gcp css", "gcp style form", "floating label" forms, or when a page already links gcp-css.css or uses the gcp-css class.
---

# copying assets from this skill to the project

Before copying gcp-css.css, search the project for it
(exclude dependencies directories typical to current project setup - like node_modules for node.js).
If it is already there, use that copy and follow the comment at its top; do not copy or import it again.
If it is not there, copy it into the project, import it once, and write a short comment at the top of the copy with:

- where it is imported,
- how to use it in this particular project (framework, build setup, conventions),
- how to find the places that use it (what to search for).

# gcp-css: GCP-style forms from one CSS file

One stylesheet, no JavaScript, plain HTML. You write native form elements in a fixed order inside a few wrapper `div`s and the CSS does the rest.

- Stylesheet: `gcp-css.css`, in the same directory as this `SKILL.md`. Copy it from there into the project (copy, do not move or edit the skill's own file, and do not link to a remote URL). See "copying assets from this skill to the project" above.
- Live demo with copyable HTML: `https://stopsopa.github.io/gcp-css/`
- Source of truth: the comment block at the top of `gcp-css.css` (bundled next to this file). If this file and that comment disagree, the CSS file wins, and this file should be corrected.

## 1. Setup

Copy `gcp-css.css` from this skill's directory (next to this `SKILL.md`) into the project, in the place where the project keeps its stylesheets, then load that local copy. Do not load the stylesheet from a remote URL.

```html
<link rel="stylesheet" href="/path/in/project/gcp-css.css" />
```

In a project with a bundler or framework, import the copy the way that project imports CSS (for example `import "./gcp-css.css";`).

The file does not set a font. Controls use `font-family: inherit`, so set the font on the page. The demo uses Google Sans.

## 2. Turning styles on and off

Nothing is styled until a `gcp-css` class is present.

| Class        | Effect                                                     |
| ------------ | ---------------------------------------------------------- |
| `gcp-css`    | styles this element and everything inside it               |
| `no-gcp-css` | turns styles off for this element and everything inside it |

The closest of the two, looking from an element up through its parents, wins. `gcp-css` nested inside `no-gcp-css` turns the styles on again.

Usual choice: put `gcp-css` once on the `<form>`. It also works on a single element (`<div class="gcp-css input-wrapper">`, `<a class="gcp-css">`).

Inside a `gcp-css` area these elements are styled automatically: `a`, `h2`, `p`, `button`, `input[type=submit|button|reset]`. Use `no-gcp-css` to exclude a part of the page.

## 3. Components

Element order inside a wrapper is part of the contract. The CSS uses sibling selectors, so a wrong order silently breaks the look.

### Text input

```html
<div class="input-wrapper">
  <input type="text" id="name" name="name" placeholder=" " aria-describedby="name-helper" />
  <label for="name">Project name *</label>
  <div class="error" id="name-error">This field is required</div>
  <div class="helper-text" id="name-helper">Lowercase letters and digits</div>
</div>
```

Rules:

- `<label>` comes directly after the control. Not before it, and nothing in between.
- `placeholder` must be present and not empty. A single space is enough. Without it the label never floats. Real placeholder text is fine: it is shown only while the field has focus.
- `.error` and `.helper-text` are optional. They are shown in the order they appear in the HTML.
- One control per `input-wrapper`.
- Works for every text-like type: `text`, `email`, `password`, `number`, `search`, `tel`, `url`.

### Textarea

Same as text input, with `<textarea>` in place of `<input>`.

```html
<div class="input-wrapper">
  <textarea id="desc" name="desc" placeholder=" " rows="4"></textarea>
  <label for="desc">Description</label>
</div>
```

### Select

```html
<div class="input-wrapper">
  <select id="type" name="type" required>
    <option value="" selected></option>
    <option value="compute">Compute Engine</option>
    <option value="storage">Cloud Storage</option>
  </select>
  <label for="type">Resource type</label>
</div>
```

- The first option must be empty with `value=""`. While it is selected, the label sits inside the field like a placeholder. Any option with a non-empty `value` makes the label float.
- Every real option needs a non-empty `value` attribute.
- No `placeholder` on a select.

### Checkbox

```html
<div class="checkbox-wrapper">
  <input type="checkbox" id="agree" name="agree" />
  <label for="agree">I agree to the terms and conditions</label>
  <div class="helper-text">Please read the policies first.</div>
  <div class="error">You must check this box to continue.</div>
</div>
```

- Flat structure: no extra `div`s around the input or the texts.
- `<label>` directly after its `<input>`.
- Text never wraps under the box: input is column one, everything else is column two.

### Radio group

One wrapper for the whole group. Repeat `input`, `label`, optional `helper-text`, optional `error` for each option.

```html
<div class="radio-wrapper">
  <input type="radio" id="plan-standard" name="plan" checked />
  <label for="plan-standard">Standard plan</label>
  <div class="helper-text">Basic compute resources.</div>

  <input type="radio" id="plan-advanced" name="plan" />
  <label for="plan-advanced">Advanced plan</label>
  <div class="helper-text">For data-intensive workloads.</div>
</div>
```

`checkbox-wrapper` and `radio-wrapper` behave the same. The look comes from the `type` of the input. A group of checkboxes in one wrapper works the same way as a radio group.

### Buttons

```html
<button type="submit">Save</button> <button type="button" class="secondary">Cancel</button>
```

- Default: blue background, white text.
- `class="secondary"`: no background, blue text, light tint on hover.
- Also styled: `<input type="submit">`, `<input type="button">`, `<input type="reset">`.
- `class="white"` is the old name of `secondary`. It still works. Do not use it in new code.

### Text and links

`h2` is a small section heading, `p` is a small gray paragraph, `a` is an underlined blue link.
`<a target="_blank">` gets an "opens in new tab" icon automatically. Do not add your own icon.

## 4. States

| State            | How to set it                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error            | `data-error` attribute on the wrapper (`input-wrapper`, `checkbox-wrapper`, `radio-wrapper`)                                                                         |
| Error, automatic | native validation: `required`, `type="email"`, `pattern`, `min`... The browser applies the same look after the user has interacted with the field or tried to submit |
| Disabled         | native `disabled` attribute on the control or button                                                                                                                 |
| Hide helper      | `hide-helper` class on the wrapper or any parent                                                                                                                     |

- `.error` elements are hidden by default and visible only in the error state. Always write them in the HTML, do not create them from JavaScript.
- `data-error` goes on the wrapper, never on the control.
- In a radio/checkbox group only the disabled option is dimmed.

```js
wrapper.toggleAttribute("data-error", hasError);
```

## 5. Accessibility

The CSS cannot do this part. Add it in the HTML.

- Every control has an `id`, every label a matching `for`.
- Give helper and error elements ids (`<id>-helper`, `<id>-error`) and point the control at the helper: `aria-describedby="name-helper"`.
- When you set the error state from JavaScript, also set `aria-invalid="true"` on the control and add the error id: `aria-describedby="name-helper name-error"`. Remove both when the error is cleared.
- Do not list the error id in `aria-describedby` permanently. Screen readers read referenced elements even when they are hidden.

## 6. Theming

Override CSS variables on `:root` or on any container.

| Variable                    | Default   | Used for                                                                                                    |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `--gcp-css-primary`         | `#1a73e8` | focus ring, buttons, checked state                                                                          |
| `--gcp-css-primary-hover`   | `#1765cc` | primary button hover                                                                                        |
| `--gcp-css-link`            | `#0c67df` | links                                                                                                       |
| `--gcp-css-error`           | `#d93025` | error state                                                                                                 |
| `--gcp-css-border`          | `#99999b` | field border                                                                                                |
| `--gcp-css-text`            | `#3c4043` | field text, checkbox/radio labels                                                                           |
| `--gcp-css-gray-text`       | `#5f6368` | floating label, helper text                                                                                 |
| `--gcp-css-bg`              | `#ffffff` | field background. Must match the background behind the form, the floating label uses it to cover the border |
| `--gcp-css-font-size`       | `16px`    | fields and labels                                                                                           |
| `--gcp-css-small-font-size` | `12px`    | floated label, helper, error                                                                                |
| `--gcp-css-field-gap`       | `19px`    | space below each wrapper                                                                                    |

Keep `--gcp-css-font-size` at 16px or more, otherwise iOS Safari zooms the page when a field gets focus.

## 7. Do not

- Do not put `<label>` before the control, and do not wrap the control in the label.
- Do not omit `placeholder` on `input` / `textarea`.
- Do not add wrapper `div`s inside `checkbox-wrapper` / `radio-wrapper`.
- Do not put two controls in one `input-wrapper`. For two fields side by side, put two wrappers in your own grid or flex container.
- Do not write CSS for borders, focus rings or label positions of these components. Change variables instead.
- Do not add JavaScript to float the label. It is pure CSS.
- Do not use the class names `error` and `helper-text` for other things inside a wrapper.

## 8. Browser support

The file uses CSS nesting, `:has()` and `@scope`. It needs Chrome 118+, Safari 17.4+, Firefox 146+. In an older browser the whole file is ignored and the form shows as plain unstyled HTML, still usable.

## 9. Complete example

```html
<!-- local copy of gcp-css.css, copied from the skill directory -->
<link rel="stylesheet" href="/path/in/project/gcp-css.css" />

<form class="gcp-css">
  <h2>Project</h2>
  <p>Details of the new project. See the <a href="/docs" target="_blank">documentation</a>.</p>

  <div class="input-wrapper">
    <input type="text" id="name" name="name" placeholder=" " required aria-describedby="name-helper" />
    <label for="name">Project name *</label>
    <div class="error" id="name-error">Project name is required</div>
    <div class="helper-text" id="name-helper">Lowercase letters and digits</div>
  </div>

  <div class="input-wrapper">
    <select id="type" name="type" required>
      <option value="" selected></option>
      <option value="compute">Compute Engine</option>
      <option value="storage">Cloud Storage</option>
    </select>
    <label for="type">Resource type</label>
    <div class="error" id="type-error">Select a resource type</div>
  </div>

  <div class="input-wrapper">
    <textarea id="desc" name="desc" placeholder=" " rows="4"></textarea>
    <label for="desc">Description</label>
  </div>

  <div class="radio-wrapper">
    <input type="radio" id="plan-standard" name="plan" checked />
    <label for="plan-standard">Standard plan</label>
    <div class="helper-text">Basic compute resources.</div>

    <input type="radio" id="plan-advanced" name="plan" />
    <label for="plan-advanced">Advanced plan</label>
    <div class="helper-text">For data-intensive workloads.</div>
  </div>

  <div class="checkbox-wrapper">
    <input type="checkbox" id="agree" name="agree" required />
    <label for="agree">I agree to the terms and conditions</label>
    <div class="error">You must agree to continue.</div>
  </div>

  <button type="submit">Create</button>
  <button type="button" class="secondary">Cancel</button>
</form>
```

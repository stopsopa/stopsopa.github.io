# `index.html`: demo and workshop for the gcp-css library

Read this before changing anything in this directory. It gives every part of the demo page and of the stylesheet a **name**, so a change can be requested as "in `F-TYPE` make the arrow bigger" or "move `SOURCE` under `FORM`".

## What this directory is

| File                         | Role                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `floating-label-pattern.css` | **The library.** One CSS file that makes plain HTML forms look like Google Cloud Platform console forms. This is the only file other projects import.                                                                                  |
| `index.html`                 | **Working demo and workshop** for the library. Every component in every state, with controls to switch states, and the HTML of the form printed live next to it (it follows every change of the form). New ideas are tried here first. |
| `skill.md`                   | Instructions for an AI assistant in **another project** on how to write HTML for the library.                                                                                                                                          |
| `SUGGESTED_CHANGES.md`       | Review log: what was found, what was decided, what is still open (`DONE` / `OPEN` / `NOT A CONCERN`).                                                                                                                                  |
| `THINGS_TO_ADD.md`           | Ideas for new components and demo features. Nothing in it is implemented.                                                                                                                                                              |
| `index.ts`                   | **All JavaScript of the demo page**, written in TypeScript. This is the file to edit.                                                                                                                                                  |
| `index.js`                   | Generated from `index.ts`. Loaded by `index.html` as a native browser ES module. Never edit by hand. Git-ignored.                                                                                                                      |
| `index.md`                   | This file: how to work on the demo and the library **here**.                                                                                                                                                                           |

`skill.md` is for using the library. `index.md` is for developing it.

## How to view it

Start the dev server from the repository root (`make start`) and open `/pages/html/float-label-pattern/index.html` on the port from `NODE_API_PORT` in `.env`.
The CSS and the HTML are served as they are, no build step. The only generated file is `index.js` (see "Script: `index.ts` → `index.js`" below).

The page is part of the stopsopa.github.io site, so it loads `/js/github.js` at the end of `<body>` (site header ribbons, ACE editor, url placeholders). The `<body>` attributes `no-anchor-links no-main-css` switch off the site's heading anchors and the site's `main.css`, so the demo shows the library's styles only.

## Page map

```
+-----------------------------------------------------------------------+
| TITLE                                                                 |
+-------------+------------------------------+--------------------------+
| CONTROLS    | FORM                         | SOURCE                   |
|             |                              |                          |
| C-WIDTH     | F-NAME                       | SOURCE-TOOLBAR           |
| C-ERRORS    | F-EMAIL                      | SOURCE-CODE              |
| C-DISABLED  | F-ADMIN                      |                          |
| C-HELPER    | NOTE                         | (html of FORM, generated |
|             | F-TYPE                       |  by script, live: shows  |
|             | F-PASSWORD                   |  current state of FORM,  |
|             | H-DESC, F-DESC               |  highlighted on hover)   |
|             | H-CHECK, TEXT, F-AGREE       |                          |
|             | H-RADIO, F-PLAN              |                          |
|             | BUTTONS                      |                          |
+-------------+------------------------------+--------------------------+
| IMPORT-BOX                                                            |
+-----------------------------------------------------------------------+
```

`CONTROLS` and `SOURCE` are sticky: they stay in view while `FORM` scrolls.

## Section names: the page

### Layout

| Name         | Where in `index.html`                                     | What it is                                                                                        |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `TITLE`      | first `<h2>` in `.inside`                                 | Page heading. Outside `.gcp-css`, so not styled by the library.                                   |
| `COLUMNS`    | `.layout-columns`                                         | Flex row holding `CONTROLS` and `RIGHT`.                                                          |
| `CONTROLS`   | `.layout-left`                                            | Left column with the demo switches.                                                               |
| `RIGHT`      | `.layout-right`                                           | Flex row holding `FORM` and `SOURCE`.                                                             |
| `FORM`       | `.layout-right form.gcp-css`                              | The demo form. **The only part styled by the library.**                                           |
| `SOURCE`     | `.source-panel`                                           | HTML of `FORM`, generated by script.                                                              |
| `IMPORT-BOX` | `<script type="editor" data-lang="html">` below `COLUMNS` | ACE editor box with the link to view the CSS file and the `<link rel="stylesheet">` line to copy. |

### `CONTROLS`

These are demo tools. They are deliberately outside `.gcp-css` and use plain browser controls.

| Name         | Element                | What it does                                                                                                                               |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `C-WIDTH`    | `#range`               | Sets the width of `FORM` (1-100% of its initial 800px). Shows how fields adapt to the available width. `SOURCE` takes the rest of the row. |
| `C-ERRORS`   | `#toggle-all-errors`   | Puts every wrapper in `FORM` into the error state (calls `setError()`).                                                                    |
| `C-DISABLED` | `#toggle-all-disabled` | Sets `disabled` on every control inside the wrappers. Does not touch `BUTTONS`.                                                            |
| `C-HELPER`   | `#toggle-helper-all`   | Adds `hide-helper` to every wrapper.                                                                                                       |

### `FORM`

Each field shows one thing on purpose. Keep that purpose when editing.

| Name         | Element                       | Component              | What it demonstrates                                                                                                                       |
| ------------ | ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `F-NAME`     | `#name-wrapper`               | text input             | Basic field with error and helper. Wrapper has no `gcp-css` class: it gets the styles from the form. Holds the long accessibility comment. |
| `F-EMAIL`    | `#email-wrapper`              | email input            | `gcp-css` directly on the wrapper (the other way of switching styles on). Native `type="email"` validation.                                |
| `F-ADMIN`    | `#addremove-wrapper`          | email input            | Field with helper text only, no `.error` element.                                                                                          |
| `NOTE`       | `<alert-box>`                 | external web component | Not part of the library. Shows that foreign elements can sit inside the form.                                                              |
| `F-TYPE`     | `#type-wrapper`               | select                 | Floating label on a select, custom arrow, `required` (native validation).                                                                  |
| `F-PASSWORD` | `#password-wrapper`           | password input         | Browser autofill case.                                                                                                                     |
| `H-DESC`     | `<h2>` "Description section"  | heading                | Library `h2` style.                                                                                                                        |
| `F-DESC`     | `#desc-wrapper`               | textarea               | Floating label on a multi-line field, resize handle, auto-grow script.                                                                     |
| `H-CHECK`    | `<h2>` "Checkbox section"     | heading                | Library `h2` style.                                                                                                                        |
| `TEXT`       | `<p>` after `H-CHECK`         | paragraph with links   | Library `p` style, a normal link, and a `target="_blank"` link with the new-tab icon.                                                      |
| `F-AGREE`    | `#agree-wrapper`              | checkbox               | Two-column layout: box left, label + helper + error right.                                                                                 |
| `H-RADIO`    | `<h2>` "Radio section"        | heading                | Library `h2` style.                                                                                                                        |
| `F-PLAN`     | `#radio-wrapper`              | radio group            | Two options in one wrapper, helper per option, error on the second option only.                                                            |
| `BUTTONS`    | the two `<input>`s at the end | buttons                | Primary (`Submit`) and secondary (`Cancel`, `class="secondary"`).                                                                          |

The HTML comments in the file say "Field 1", "Field 2"... and the number 5 is used twice. Use the names from this table instead.

Parts inside a field, when a finer name is needed:

| Name        | Meaning                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| `control`   | the `input` / `textarea` / `select`                                           |
| `label`     | the `<label>` (floating in `input-wrapper`, beside the box in checkbox/radio) |
| `error`     | `.error` element, visible only in the error state                             |
| `helper`    | `.helper-text` element                                                        |
| `ring`      | the border of a field, and its 2px focus version                              |
| `arrow`     | the ▾ triangle of a select                                                    |
| `box`       | the square of a checkbox or the circle of a radio                             |
| `link-icon` | the new-tab icon after a `target="_blank"` link                               |

Example: "`F-TYPE` arrow", "`F-AGREE` box", "`F-NAME` error".

### `SOURCE`: how the code on the right is presented

| Name             | Element           | What it is                                                   |
| ---------------- | ----------------- | ------------------------------------------------------------ |
| `SOURCE-TOOLBAR` | `.source-toolbar` | Title, hint, and the "copy all" button (`#source-copy`).     |
| `SOURCE-CODE`    | `pre#source`      | The printed HTML. Live: follows the current state of `FORM`. |

How it works:

1. Nobody types the HTML in `SOURCE-CODE`. The script `S-RENDER` walks the real `FORM` element and prints it: elements, attributes, text and HTML comments, with fresh 2-space indentation.
2. Every printed element is wrapped in its own `<span class="src-el">`. A `Map` (`elementToSource`) remembers which span belongs to which form element.
3. `S-HOVER` listens for `mouseover` on `FORM`, finds the span of the element under the mouse, adds the class `src-hover` to it (yellow background) and scrolls `SOURCE-CODE` so the span is visible. Only the `<pre>` scrolls, never the page.
4. The content is plain text in a `<pre>`, so any part can be selected and copied. "copy all" copies everything.

**`SOURCE-CODE` is live.** It is printed again every time `FORM` changes, so it always shows the HTML you would write to get the form in exactly the state you see:

| What you do                    | What appears in `SOURCE-CODE`                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| type into a text / email input | `value="..."` on that `<input>` (removed again when the field is emptied)                                    |
| type into the textarea         | the text between `<textarea>` and `</textarea>`                                                              |
| choose an option in the select | `selected` moves to that `<option>`                                                                          |
| tick / untick the checkbox     | `checked` appears / disappears                                                                               |
| pick a radio option            | `checked` moves to that `<input>`                                                                            |
| `C-ERRORS`                     | `data-error` on every wrapper, `aria-invalid="true"` and the error id in `aria-describedby` on every control |
| `C-DISABLED`                   | `disabled` on every control                                                                                  |
| `C-HELPER`                     | `hide-helper` in the `class` of every wrapper                                                                |

How the live update works (`S-LIVE`):

- Typing, selecting and checking change DOM **properties** (`el.value`, `el.checked`, `option.selected`), not attributes. `S-RENDER` reads those properties and prints them as attributes. `input`, `change` and `reset` events on `FORM` trigger a new print.
- Attribute changes made by any script (`data-error`, `disabled`, `class`, `aria-*`) are caught by a `MutationObserver` on `FORM`.
- All triggers go through `scheduleRender()`: at most one print per animation frame.
- A print replaces the whole content of `SOURCE-CODE`. The scroll position and the hover highlight are restored after it. A text selection made inside the panel is lost when the form changes.

Deliberately **not** printed:

- `style` attributes. The form width set by `C-WIDTH` and the textarea height set by `S-AUTOGROW` are demo mechanics, not something to copy.
- The value of `type="password"` (`F-PASSWORD`). The browser may autofill a real saved password there, and the panel would show it in plain text.
- The value of `submit` / `button` / `reset` inputs is printed as written in the HTML, it is not a state.

Consequences to keep in mind:

- To change what `SOURCE-CODE` shows, **edit the form markup** (or `S-RENDER`). The panel follows.
- A new kind of control added to `FORM` may need its state handled in the `attributes()` function of `S-RENDER`.
- HTML comments inside `FORM` are printed too. They are part of what the reader of the demo sees.
- The formatting is produced by `S-RENDER`, not copied from the file: tags longer than 90 characters get one attribute per line; text with inline elements (`a`, `b`, `span`...) stays on one line; an attribute with an empty value is printed as the bare name; `&nbsp;` is printed as the entity; state attributes that are not in the original HTML are added at the end of the tag.
- Colours: tags are blue (`src-tag`), comments gray (`src-comment`).

### Script: `index.ts` → `index.js`

`index.html` contains no inline JavaScript. It loads one file at the end of `<body>`:

```html
<script type="module" src="index.js"></script>
```

- **Edit `index.ts`, not `index.js`.** `index.js` is produced from it by the repository's transpiler and is overwritten every time.
- Transpilation is done by `transpile.sh` using `transpile.ignore` in the repository root. That file ignores everything under `pages/` by default; the block marked `float-label-pattern index.ts` un-ignores exactly this one file. The dev server (`make start`) runs it in watch mode; by hand it is `/bin/bash transpile.sh transpile.ignore`.
- The transpiler type-checks **all** un-ignored `.ts` files of the repository together. If there is a type error anywhere, no `.js` is written, silently. When `index.js` does not change after an edit, run the command by hand and read the output.
- `index.ts` has `export {};` at the top. It makes the file a module for TypeScript. Without it the top-level functions (`render()`...) collide with functions of the same name in other `.ts` files of the repository and the type-check fails. Do not remove it.
- It is a native ES module: it runs after the HTML is parsed (so every element already exists), in strict mode, and nothing in it is global. `setError()` or `renderSource()` cannot be called from the browser console or from an inline `onclick`.
- The file has comment banners with the `S-*` names from the table below.

### Scripts (sections of `index.ts`)

| Name         | Code                                                                                   | What it does                                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `S-TOGGLES`  | `change` listener on `document.body`                                                   | Handles `C-ERRORS`, `C-DISABLED`, `C-HELPER`.                                                                                                                                                                                    |
| `S-SETERROR` | `setError(wrapper, on)`                                                                | Sets `data-error` on a wrapper, plus `aria-invalid` and `aria-describedby` on its controls. Relies on the id convention `x` → `x-helper`, `x-error`. This is the reference for how a real project should switch the error state. |
| `S-RENDER`   | `renderSource()`                                                                       | Prints `FORM` in its current state into `SOURCE-CODE`, fills `elementToSource`. Can be called any time.                                                                                                                          |
| `S-HOVER`    | `highlight()` and the `mouseover` / `mouseleave` listeners                             | Hover highlighting. Remembers the hovered form element, so the highlight survives a new print.                                                                                                                                   |
| `S-LIVE`     | `scheduleRender()`, the `input` / `change` / `reset` listeners, the `MutationObserver` | Prints `SOURCE-CODE` again when `FORM` changes.                                                                                                                                                                                  |
| `S-COPY`     | click listener on `#source-copy`                                                       | The "copy all" button.                                                                                                                                                                                                           |
| `S-WIDTH`    | `applyWidth()` and the listeners on `#range`                                           | Connects `C-WIDTH` to the width of `FORM`.                                                                                                                                                                                       |
| `S-AUTOGROW` | `input` listener on `document.body`                                                    | Grows a textarea to fit its text. Demo convenience, not part of the library.                                                                                                                                                     |

The library itself needs no JavaScript. Everything in this table is demo code.

### Page styles (inline `<style>` in `<head>`)

Demo-only CSS. None of it belongs to the library.

| Name         | Selectors                                                               | What it styles                              |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------- |
| `P-FONT`     | `@import` Google Sans, `:root`                                          | Page font. The library inherits it.         |
| `P-FORM`     | `form`                                                                  | Initial width 800px, right border, padding. |
| `P-LAYOUT`   | `.layout-columns`, `.layout-left`, `.layout-right`                      | The three columns.                          |
| `P-CONTROLS` | `.section-heading`, `.range-input`, `.controls`, `.error-toggle`        | The `CONTROLS` column.                      |
| `P-SOURCE`   | `.source-panel`, `.source-toolbar`, `.source-hint`, `#source`, `.src-*` | The `SOURCE` panel and the hover highlight. |

## Section names: `floating-label-pattern.css`

The file has comment banners with the same order.

| Name           | Banner / selector in the file                                        | What it styles                                                                                      |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `CSS-DOC`      | comment block at the top                                             | The markup contract. Source of truth for `skill.md`.                                                |
| `CSS-VARS`     | `:root { --gcp-css-* }`                                              | Colours, font sizes, field gap, transition.                                                         |
| `CSS-SCOPE`    | `@scope (.gcp-css) to (.no-gcp-css) { :scope, :scope * { ... } }`    | The on/off switch. Everything below is nested inside it.                                            |
| `CSS-TEXT`     | banner `TEXT`: `&:is(a)`, `&:is(h2)`, `&:is(p)`                      | Links with underline and `link-icon`, headings, paragraphs.                                         |
| `CSS-BUTTONS`  | banner `BUTTONS`                                                     | Primary button, `.secondary` (alias `.white`), hover, active, focus, disabled.                      |
| `CSS-MESSAGES` | banner `HELPER TEXT & ERROR MESSAGE`                                 | `helper`, `error` with its icon, `hide-helper`, and the rule that shows `error` in the error state. |
| `CSS-FIELD`    | banner `FLOATING LABELS`: `&.input-wrapper`                          | `control`, `ring`, floating `label`, `arrow`, error and disabled states of text fields.             |
| `CSS-CHECK`    | banner `CHECKBOX & RADIO`: `&:is(.checkbox-wrapper, .radio-wrapper)` | Two-column grid, `box`, tick and dot, error and disabled states.                                    |

How `CSS-SCOPE` reads: inside it, `&` means "the element with class `gcp-css`, or any element inside it, up to the nearest `no-gcp-css`". Every top-level rule starts with `&` for that reason. New top-level rules must do the same, otherwise they will not apply to an element that carries `gcp-css` itself.

## Which CSS styles which part of the page

| Page section                                           | Styled by                                       |
| ------------------------------------------------------ | ----------------------------------------------- |
| `F-NAME`, `F-EMAIL`, `F-ADMIN`, `F-PASSWORD`, `F-DESC` | `CSS-FIELD`, `CSS-MESSAGES`                     |
| `F-TYPE`                                               | `CSS-FIELD` (including `arrow`), `CSS-MESSAGES` |
| `F-AGREE`, `F-PLAN`                                    | `CSS-CHECK`, `CSS-MESSAGES`                     |
| `H-DESC`, `H-CHECK`, `H-RADIO`, `TEXT`                 | `CSS-TEXT`                                      |
| `BUTTONS`                                              | `CSS-BUTTONS`                                   |
| `NOTE`                                                 | its own shadow DOM (external component)         |
| `TITLE`, `CONTROLS`, `SOURCE`, layout                  | page styles `P-*` in `index.html`               |
| `IMPORT-BOX`                                           | the site's ACE editor (`/js/github.js`)         |
| all colours and sizes in `FORM`                        | `CSS-VARS`                                      |

## Rules for changing things

1. **Library or demo?** If the change should reach other projects, it goes into `floating-label-pattern.css`. If it only concerns how the demo page presents things, it goes into the `<style>` of `index.html` or into `index.ts`. Do not put demo layout into the library, and do not fix a library problem with page styles.
2. **Keep the library's goals:** one CSS file, no JavaScript, native HTML elements, as few wrapper elements as possible, flat markup.
3. **When the markup contract changes** (element order, class names, states, variables, browser floor), update in the same change:
   - `CSS-DOC` at the top of the CSS file,
   - the markup in `FORM` (so `SOURCE` shows the new way),
   - `skill.md`,
   - this file, if a section name, id or script is affected.
4. **Record review decisions** in `SUGGESTED_CHANGES.md` with a status. Explain a problem there in plain terms before proposing a fix.
5. **New component:** add it to `FORM` with a wrapper `id`, add its rules as a new banner section in the CSS, give both a name in this file, describe the markup in `CSS-DOC` and `skill.md`.
6. **Do not edit `SOURCE-CODE` by hand** and do not paste HTML into it. Change `FORM` or `S-RENDER`.
7. **Check in a browser** after a change: default state, `C-ERRORS`, `C-DISABLED`, `C-HELPER`, keyboard focus on each kind of control, a narrow `C-WIDTH`, and hover over `FORM` to confirm `SOURCE` still highlights, and change a value of each kind of control to confirm `SOURCE` follows.
8. **Format** with the repository's Prettier (`make style_fix`, or `npx prettier --write` on the changed files).

## Known decisions

Details are in `SUGGESTED_CHANGES.md`. Short version, so they are not re-opened by accident:

- CSS nesting, `:has()` and `@scope` are used on purpose. Minimum browsers: Chrome 118, Safari 17.4, Firefox 146.
- Windows high-contrast mode is not a goal.
- The error state is `data-error` on the wrapper, or native validation through `:user-invalid`.
- Disabled buttons use `pointer-events: none` and show the normal cursor.
- `.white` stays as an alias of `.secondary`.
- Still open: autofill handling, and the `user-scalable=no` viewport meta of the demo page.

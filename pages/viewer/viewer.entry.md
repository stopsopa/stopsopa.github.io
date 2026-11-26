# viewer.entry.js - tabs

Page: `/viewer.html?file=/path/to/file` (bundle: `/dist/viewer.entry.bundle.js`).

## What was changed

Before: input with path, list of generated links (`href`, `pathname + search`, `zz + href`, `zz + file`, `download`)
and under it every file shown in a single ACE editor.

Now: input with path stays on top, everything else is in tabs (vanilla-tabs):

| tab        | when          | content                                                                              |
| ---------- | ------------- | ------------------------------------------------------------------------------------ |
| `rendered` | only markdown | markdown rendered by `<zero-md>` - the same library as in `pages/services/encryptor` |
| `source`   | always        | raw file in ACE editor, exactly what was shown before                                |
| `meta`     | always        | "extracted meta" json in ACE editor (used to be under the main editor)               |
| `links`    | always        | generated links which used to be above the editor                                    |

Markdown = `content-type: text/markdown` -> `mimes` map -> `"markdown"`.

Try: `/viewer.html?file=/pages/viewer/viewer.entry.md`

## Selected tab in the url

First visible tab is default - no extra parameter. Every other tab adds `&t=<first letter of the tab name>`
(short on purpose: one letter key, one letter value - so first letters of names in `tabsOrder` have to be unique).

| file     | url                         | tab        |
| -------- | --------------------------- | ---------- |
| markdown | `/viewer.html?file=...`     | `rendered` |
| markdown | `/viewer.html?file=...&t=s` | `source`   |
| markdown | `/viewer.html?file=...&t=m` | `meta`     |
| markdown | `/viewer.html?file=...&t=l` | `links`    |
| other    | `/viewer.html?file=...`     | `source`   |
| other    | `/viewer.html?file=...&t=m` | `meta`     |
| other    | `/viewer.html?file=...&t=l` | `links`    |

- state `tab` is full name of the tab found by the letter from the url (`getTab()`, also on `popstate`),
  `tabParam(name)` does the opposite (`"source"` -> `"&t=s"`). `activeTab` is what is really shown:
  unknown letter or `rendered` for not markdown file -> default tab
- click on a tab (vanilla-tabs `onChange`) -> `history.replaceState()` (no new history entry) + `setTab()`
- `onChange` fires also for our own `activeByIndex()`. Then `index` is equal to the one we asked for and nothing
  is memorised. Different `index` = click of the user.
- inputs `href`, `pathname + search`, `zz + href` get `&t=...` too (`tabSuffix`).
  `zz + file` and `download` point to the file itself - not changed.
- submitting new file in the form resets tab to default

## How it works

1. `viewer.html` loads zero-md from CDN: `https://cdn.jsdelivr.net/npm/zero-md@3?register`
   and has styles for `.zero-md-container`, `.viewer-links` and for hiding `rendered` button.
2. `onSubmit()` stores the really loaded path in `ace.file` (state `file` changes on every keystroke in the input,
   so it can't be used).
3. `<zero-md key={ace.file} src={ace.file}>` - zero-md fetches the file itself (second request for the same file).
   `key` forces new element when the file changes.
4. vanilla-tabs is loaded by `/js/github.js` (vendored `/noprettier` version, old variable `--background-color`).
   Tabs are added by React after github.js init, so nobody activates the initial tab.
   `useEffect` on `[isMarkdown, activeTab]` does it: `vanillaTabs.activeByIndex(element, index, { onChange })`,
   wrapped in `window.allLoaded.push()` to be sure github.js is ready.
5. `onChange` dispatches window `resize` event - ACE mounted in hidden tab has no dimensions,
   resize makes it recalculate when the `source` tab is opened.

## All tabs always in the DOM, Ace never unmounted

`tabsOrder = ["rendered", "source", "meta", "links"]` - index in this array is the index of button/panel
for vanilla-tabs. All buttons and panels are rendered always, also for not markdown files. Then:

- wrapper has `data-md="0"` -> css in `viewer.html` hides button `rendered`, its panel is empty
- `<zero-md>` is rendered only for markdown

Reasons:

- vanilla-tabs matches buttons and panels by position - constant number of them is the safest
- first version rendered `<Ace>` in two different places (with / without tabs), so React unmounted it
  on every switch ("Loading..." is not markdown) and cleanup in `pages/macro/Ace.jsx` crashed whole React tree:
  `TypeError: onInit is not a function` (+ `ReferenceError: div is not defined`).
  Cleanup in `Ace.jsx` was fixed too (`onInit` is optional, `divRef.current` instead of not existing `div`,
  guard for `window.editors`).

## data-testid

- `viewer-file` - input with path to the file
- `viewer-tabs` - tabs wrapper
- `viewer-tab-rendered`, `viewer-tab-source`, `viewer-tab-meta`, `viewer-tab-links` - tab buttons
- `viewer-md-rendered` - container of `<zero-md>`
- `viewer-links` - content of `links` tab
- `viewer-link-href`, `viewer-link-pathname-search`, `viewer-link-zz-href`, `viewer-link-zz-file`,
  `viewer-link-download` - generated links

## Notes

- Don't set `className` on tab buttons / panels in React - vanilla-tabs manages `active` class on them.
- Rebuild bundle after change of `viewer.entry.js` (dev.sh watches it).

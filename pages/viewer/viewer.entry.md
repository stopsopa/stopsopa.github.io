# viewer.entry.js - markdown mode

Page: `/viewer.html?file=/path/to/file` (bundle: `/dist/viewer.entry.bundle.js`).

## What was changed

Before: every file was shown in a single ACE editor.

Now: when the loaded file is markdown (`content-type: text/markdown` -> `mimes` map -> `"markdown"`)
the viewer renders tabs (vanilla-tabs) instead of the single editor:

| tab        | content                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| `rendered` | markdown rendered by `<zero-md>` - the same library as in `pages/services/encryptor`      |
| `source`   | raw file in ACE editor, exactly what was shown before                                     |

All other file types are shown as before - single ACE editor, no tabs.

Try: `/viewer.html?file=/pages/viewer/viewer.entry.md`

## How it works

1. `viewer.html` loads zero-md from CDN: `https://cdn.jsdelivr.net/npm/zero-md@3?register`
   and has style for `.zero-md-container`.
2. `onSubmit()` stores the really loaded path in `ace.file` (state `file` changes on every keystroke in the input,
   so it can't be used).
3. `isMarkdown = ace.mime === "markdown"` decides: tabs or single editor.
4. `<zero-md key={ace.file} src={ace.file}>` - zero-md fetches the file itself (second request for the same file).
   `key` forces new element when the file changes.
5. vanilla-tabs is loaded by `/js/github.js` (vendored `/noprettier` version, old variable `--background-color`).
   Tabs are added by React after github.js init, so nobody activates the initial tab.
   `useEffect` on `isMarkdown` does it: `vanillaTabs.activeByIndex(element, 0, { onChange })`,
   wrapped in `window.allLoaded.push()` to be sure github.js is ready.
6. `onChange` dispatches window `resize` event - ACE mounted in hidden tab has no dimensions,
   resize makes it recalculate when the `source` tab is opened.

## Ace never unmounted

Tabs markup is rendered always, also for not markdown files. Then:

- wrapper has `data-md="0"` -> css in `viewer.html` hides tab buttons
- `source` tab (index 1) is forced, so the page looks like before (single editor)
- `<zero-md>` is rendered only for markdown

Reason: first version rendered `<Ace>` in two different places (with / without tabs), so React unmounted it
on every switch ("Loading..." is not markdown) and cleanup in `pages/macro/Ace.jsx` crashed whole React tree:
`TypeError: onInit is not a function` (+ `ReferenceError: div is not defined`).
Cleanup in `Ace.jsx` was fixed too (`onInit` is optional, `divRef.current` instead of not existing `div`,
guard for `window.editors`).

## Selected tab in the url

| url                                   | tab                                        |
| ------------------------------------- | ------------------------------------------ |
| `/viewer.html?file=...`               | `rendered` - default, no extra parameter   |
| `/viewer.html?file=...&tab=source`    | `source`                                   |

- state `tab` is initialised from the url (`getTab()`), also on `popstate`
- click on a tab (vanilla-tabs `onChange`) -> `history.replaceState()` (no new history entry) + `setTab()`
- inputs `href`, `pathname + search`, `zz + href` get `&tab=source` too (`tabSuffix`).
  `zz + file` and `download` point to the file itself - not changed.
- only for markdown: for other files `source` tab is forced, nothing is added to the url
- submitting new file in the form resets tab to `rendered`

## data-testid

- `viewer-md-tabs` - tabs wrapper
- `viewer-md-tab-rendered`, `viewer-md-tab-source` - tab buttons
- `viewer-md-rendered` - container of `<zero-md>`

## Notes

- Don't set `className` on tab buttons / panels in React - vanilla-tabs manages `active` class on them.
- Rebuild bundle after change of `viewer.entry.js` (dev.sh watches it).

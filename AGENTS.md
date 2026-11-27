# Language

Speak English

# Format of conversation

Start every single response with my name. My name is Sempronius Densus

# Project Instructions

<VERY IMPORTANT>

- By default stick to grug skill unless asked otherwise
- don't run any cli commands. If you need it then ask me to run them.
- Don't generate summary at the end - just do what asked and just report "done". You might list relative paths (relative to project root) to files changed/deleted/created.
- use tokens sparingly do stuff in one go
- never run any commands yourself. If needed just ask. I will run it and provide you with the result.

VERY IMPORTANT:
VERY IMPORTANT:
Attention control: When given the task, try to limit how many files you read (limit sniffing around the project). Usually try to limit yourself to files which were mentioned in the prompt.
If you think there is a need to look into other files then gather a list of files you would like to look into and ask before reading them except the files I explicitly told you to look into.
When I told you too look into directory with multiple files be conservative - read only what you think is necessary. Avoid loading all files into context.

Sometimes it seems AI is going astray and starts parsing half of the project burning through quarter of millions of tokens in the spand of few seconds where task didn't really require looking into that many files. Try to avoid that.
VERY IMPORTANT:
VERY IMPORTANT:

</VERY IMPORTANT>

<READING-FILE>
When reading files specified in the context read them whole into the context, don't come and read them chunk by chunk.
Just read in one go given file and then continue with reasoning. 
</READING-FILE>

<general code logic>
avoid negated conditions where else is present:

```

if ( ! condition) {
    ... something else 1
}
else {
    ... something else 2
}

```

when else is present just remove NOT and swap blocks

```

if ( condition) {
    ... something else 2
}
else {
    ... something else 1
}

```

</general code logic>

<bash>
VERY IMPORTANT
VERY IMPORTANT
VERY IMPORTANT
VERY IMPORTANT
when working with bash and generally any shell script absolutely always follow 'bash-scripting' skill
when editing and when creating new shell scripts
</bash>

<existing code comments>
IMPORTANT:
IMPORTANT:
IMPORTANT:
When you working with existing code and there are comments around functions and generally comment explaining what is happening then leave them all in place.
The same for comments demonstrating how to use given library or script. Those have to say.
Can be only extended. Like new examples added to the comment. That is desirable if covers new cases/ new arguments or new functionalities. Everywhere where logic can be modified by external aruguments or by different ways of callins script and so on.

Also above avery new function and even moderately important functionality block or separate unit of logic it is desirable to also have new comments describing the intention and purpose of that function or functionality.

if just one line of comment is needed then use singe line comments (like with two slashes in js).
But if more than one then use comment type (/\*_ ... _/).
IMPORTANT:
IMPORTANT:
IMPORTANT:
</existing code comments>

<css>
In this project we cant use scss. We have to use only css.

Always use just css. Use nesting in css since modern browsers support it, like

```
.my_box {
    background: red;

    .my_inner_box {
        ...
    }
}

```

Ideally also try to introduce style next to the components and import in that component like

Test.tsx
Test.css

and do

import './Test.css'

in Test.tsx

Try to keep styles local to the component as much as possible.

if you need though some universal styles which makes sense to reuse then put it into src/index.css
</css>

<react>
When modeling react components try to don't use useCallback as an optimisation.
Avoid premature optimisation.
Use it though when it seems important for performance or for the logic. When it is obvious that rerender will happen many times per second and it will be reasonable to use it.
Just avoid premature optimisation. Most of the time it only generates noise in the code. Especially when final solution is still in the process of making.
</react>

<end to end testing>
When building end to end tests make sure that all elements we interact with have data-testid attribute (If we can help it - if given code is in control of this project) and use that to to find elements. This way modifying ui I have clear picture where I should be careful when modifying layout because of given data-testid is important for some tests.
</end to end testing>

<ui>

When building interactive elements. Generally when building UI make sure to always add unique data-testid to every interactive element user will be pressing, touching and any other interaction. Also all emenents you suspsect will be touched by end to end testing

</ui>

<xx.cjs>

Files xx.cjs is just config tool similar to Makefile or to https://just.systems/man/en/

This is just config which defines list of commans user will run often. To make running them more convenient.

so xx.cjs is just file with name of command which is normally selected from the list in interactive mode when user types `xx` and presses enter.

Then it will execute as shell script what is in `command` field of given element.

There is also description field to fill in describing what given command is doing.

</xx.cjs>

<create-description>
When creating module or shell script and explanation what is the purpose of given script or libarry is beyond what can be deducted from the code, like reason why it was created or intended purpose in grand picture.
Put that in the top comment section (can be multiline).

Pay special attention to type of comment you should use. I've seen AI mixing style of multiline comment across different programming languages.

Use comments with # at the begining for shell scripts and // or /\* \*/ type for typescript/javascript. and so on. Just use proper comment style typical for each programming language.

Also when shell script especially create in that comment section examples of calling that script with different arguments and outcomes and additional explanation what will be the result of this or that call with such and such arguments.
The same for typescript/javascript modules as well and other units of code - where code is not obvious or self explanatory.

If you are not sure then just ask if that is needed.

Keep it short. If possible use list of steps given script is taking if we can distinguish them and it would be good format to explain its functioning. Don't explain obvious things.
</create-description>

<project-features>

# Project features (functional overview)

Features listed in README.md and how they really work. Read this before adding or changing a page.
Paths are relative to the project root.

## Page bootstrap: js/github.js

Every page ends with `<script type="module" src="/js/github.js"></script>` as the last element of `<body>`
(loaded in `<head>` it prints a red error, it needs `document.body`).
This single script loads all shared css/js and switches all features below on. Don't load these things again on a page:

- css: `/css/normalize.css`, `/css/main.css`, `/noprettier/vanilla-tabs.css`, Open Sans font
- js: `public/preprocessed.js` + `public/env.js` (env vars), polyfill, vanilla-tabs, AnchorJS, lodash (`_`), ACE editor + `ext-linking`

Order of execution - a lot of the behaviour below follows from this order:

1. favicons, "edit" ribbon, burger menu, "profile" ribbon
2. `buildHeader()`, `buildFooter()`
3. `addAnchorLinks()`
4. `toc()`
5. `doSort()`
6. `mobileLinks()`
7. `urlwizzard()`
8. sha384 markers (dev mode only, see .github/sha384.md)
9. `await window.beforeAceEventPromise()` if the page defined it
10. `vanillaTabs.bind()` + `vanillaTabs.active({ onChange })`
11. `doEval()`, then `await doace()`
12. `scrollToHashAndHighlight()`
13. `window.githubJsReady = true`, then callbacks from `window.allLoaded` are executed

Steps 2-13 run in one `try/catch`. An exception in any step is only logged to the console ("GLOBAL CATCH ERROR")
and all later steps are skipped. Typical symptom: ACE editors are not rendered and `window.githubJsReady` is never set.
So when a page "doesn't render editors", look for an error in an earlier step first.

Page hooks:

- `window.beforeAceEventPromise = () => promise` - define in `<head>`, github.js waits for it before tabs and editors
  are created. Use it to change the DOM (e.g. content of `<script type="editor">`) before ACE takes it over.
- `window.allLoaded = window.allLoaded || []; window.allLoaded.push(fn)` - `fn` runs when everything is ready.
  After init `allLoaded.push(fn)` executes `fn` immediately.
- Tests wait for `window.githubJsReady === true`.

## Body attributes

`<body class="layout bg" toc>` is the standard. Attributes (presence only, no value):

| attribute         | effect                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `toc`             | generate Table of Contents (see below)                                    |
| `wide`            | `.inside` gets `max-width: 90%` instead of 900px (css/main.css)           |
| `nohead`          | don't create `<header>` (pipeline badge linking to /index.html)           |
| `nofoot`          | don't create `<footer>`                                                   |
| `nogithublink`    | hide "edit" ribbon **and** the burger menu in the top left corner         |
| `noprofileribbon` | hide "profile" ribbon                                                     |
| `no-anchor-links` | skip js/addAnchorLinks.js - headings get no ids, so TOC will be empty too |
| `no-main-css`     | don't load /css/main.css                                                  |

Header/footer are created only when the page has no own `body > header` / `body > footer`.
The "edit" ribbon links to the github editor of the current file; for `*.rendered.html` it points to the `*.template.html`.

Layout skeleton expected by css and by TOC: `body.layout.bg > div.body > div.inside > (div.cards | h2 | editors ...)`.

## Anchor links and TOC (js/addAnchorLinks.js, js/toc.js)

- Every `h1`-`h6` gets an `id` generated from its text (slug, `-1`, `-2` suffix for duplicates) and an AnchorJS link
  on the left. Click on that link copies full url with hash to the clipboard.
- Changing text of a heading changes its id, so it breaks existing links to it. README convention: a heading wrapped in
  `**` is linked from somewhere else - don't rename it.
- TOC (`<body toc>`): list of links to all `h2[id]` on the page, in document order. Only `h2` - other levels are ignored.
- TOC is built into existing `div.cards.toc` if the page has one (so called "manual TOC": page can provide own
  `<h1>` and `<ul>` with extra links, generated links are appended to that `<ul>`), otherwise the block is created.
  In both cases it is moved to the top of `.inside`. A fixed "^" (back to top) button is added too.
- TOC `<ul data-do-sort>` (as in README templates) makes the whole list sorted alphabetically - `doSort()` runs after `toc()`.
- Opening a page with `#hash` (and every hash change) scrolls to that element and flashes yellow highlight over
  it and its following siblings up to the next heading with id or next `.cards` (js/scrollToHashAndHighlight.js).

## `<div data-do-sort>` (js/doSort.js)

Sorts direct children of the element ascending by lowercased `innerText`. Children with empty text are left in place
at the end. Runs once on page load, there is no helper to run it again for content added later.

## Code blocks: `<script type="editor|syntax" data-lang="...">` (js/doace.js)

```html
<script type="editor" data-lang="js" data-w="95%" data-h="200px">
  ...code...
</script>
```

- `type="editor"` - editable ACE editor, `type="syntax"` - meant as read only.
  NOTICE: currently both are editable - doace.js switches read only on by class `syntax` of the generated wrapper,
  and the wrapper never gets that class (`class` is not copied from the `<script>`). Still use the proper `type`.
- `data-lang` - ACE mode name (see ACE modelist). Shortcuts: `js` -> `javascript`, `ts` -> `typescript`.
  The mode file is loaded by ACE on demand from /noprettier/ace/ace-builds-1.5.0/src-min-noconflict/.
- `data-w` / `data-h` - optional css width / height. (README mentions `datahw` - it is a typo, the attribute is `data-h`.)
  Without `data-h` the height follows the content.
- The `<script>` is replaced with `div[data-lang][data-ace].handled > (.copy + ace div)`. All attributes except `class`
  are copied to that wrapper. The original `<script>` element is removed from the DOM, don't keep references to it.
- Content handling:
  - common indentation is stripped (prettier indents content of script tags, that is fine),
    first and last empty line are removed
  - html entities are decoded (`_.unescape`): to show `</script>` inside a block write `&lt;/script>`,
    to show literal `&lt;` write `&amp;lt;`
  - content goes through urlwizzard before the editor is created (see below)
- Extras: copy button (📋, visible on hover), CMD + click on `http(s)://...` opens it in new tab,
  plain click on a line with exactly one url shows "Copy | Open link" popup (js/mobileLinks.js -
  the same popup works for any clicked element on the page whose text contains exactly one url).
- **Only visible elements are processed** (`element.checkVisibility()` of the parent). Blocks inside `display: none`
  containers are skipped and stay unprocessed until `doace()` is called again when they are visible.
  `doace()` is safe to call many times (processed elements have class `handled`).
- Theme `idle_fingers`, wrap mode on, workers off.

### data-eval (js/doEval.js)

`<script type="editor" data-lang="js" data-eval>` - the code is shown in the editor and also executed.

- Executed as `<script type="module">` appended to the parent of the block: so it is async/deferred,
  has module scope (no leaking globals, top level `await` works), and runs with raw `innerHTML` of the tag.
- Executed just before editors are created, `data-eval` attribute is removed so it runs once.
- Unlike `doace()`, `doEval()` doesn't check visibility - blocks in hidden containers are executed on page load too.
- For blocks added dynamically call `doEval()` and `doace()` again. README calls them `window.doEval()` /
  `window.doace()`, but js/ doesn't assign them to `window` - import them: `import doace from "/js/doace.js"`,
  `import doEval from "/js/doEval.js"`.

## Tabs (vanilla-tabs)

The same library as described in the `vanilla-tabs` skill (https://github.com/stopsopa/tabs). **Read that skill for
markup rules and the library in general** - it is always available. Here only what is different in this project:

- **Don't add any `<link>` / `<script>` for tabs and don't copy library files.** github.js loads
  `/noprettier/vanilla-tabs.css` and `/noprettier/vanilla-tabs.js` on every page. On a page just write the markup:

  ```html
  <div data-vanilla-tabs>
    <div data-buttons>
      <span>first</span>
      <span class="active">second</span>
    </div>
    <div data-tabs>
      <div>
        <script type="editor" data-lang="sh">
          ...
        </script>
      </div>
      <div>...</div>
    </div>
  </div>
  ```

- **The vendored copy in /noprettier is an older version than the one the skill describes.** Not available here:
  `?vanilla-tabs-autoenable` / `autoenable()`, `watchMutationsEnable()`, overflow arrows + `updateOverflow()`,
  `vanilla-tabs:change` event, `vanillaTabs.on()`, `data-background-color` / `data-lines-color` attributes.
  Available: `bind()`, `active({ onChange })`, `activeByIndex(parent, index, { onChange })`,
  `activeByButtonElement(parent, button, { onChange })`.
- **Colors use the old variable names**: `--background-color` (default `white`) and `--lines-color` (default `#565656`),
  not `--vanilla-tabs-*` from the skill. Example: `<div data-vanilla-tabs style="--background-color: #f4f3f1">`.
- **Initialisation is manual, done once by github.js** (step 10 above): `vanillaTabs.bind()` and
  `vanillaTabs.active({ onChange })` where `onChange` calls `doEval()` and `await doace()`.
  This is the integration with ACE: editors in not active panels are hidden so `doace()` skips them on page load,
  and they are created lazily the first time their tab is opened. Nothing to do on the page to get it.
- Consequences:
  - Number of buttons and number of panels must match. In this project a mismatch is worse than in the skill:
    the exception is thrown inside github.js init, so **all editors on the page stop rendering** (see bootstrap section).
  - Tabs added to the DOM after page load: clicks work (delegated listener on body), but nothing activates the initial
    tab and there is no `onChange` (so no lazy editors). After adding them call
    `vanillaTabs.active({ onChange: async () => { doEval(); await doace(); } })` or `activeByIndex(...)` with `onChange`.
  - `onChange({ button, tab, index })` is the only "tab shown" hook here. It fires on every click (also on already active
    tab) and once per tabs element during init. It is stored per tabs element, passing new `onChange` for an element
    replaces the one registered by github.js - keep `doEval()` + `doace()` in yours.
  - Avoid headings inside panels: they get anchors and `h2` land in TOC, but a link to a heading in a hidden panel
    doesn't open that tab.
  - Existing examples of tabs with editors inside: search pages/ for `data-vanilla-tabs`
    (e.g. pages/databases/index.html).
- `/vanilla-tabs.js` in the project root is another, slightly newer copy (has autoenable + mutation observer) which is
  **not** loaded by github.js. Pages use the `/noprettier` one.

## urlwizzard placeholders (js/urlwizzard.js, .github/urlwizzard.sh)

Placeholders to write urls which work on local dev server and on production:

| placeholder                 | value                                                          |
| --------------------------- | -------------------------------------------------------------- |
| `urlwizzard.schema`         | `http` / `https`                                               |
| `urlwizzard.hostname`       | `location.hostname`                                            |
| `urlwizzard.hostnegotiated` | hostname + `:port` when the port is not default for the schema |
| `urlwizzard.portnegotiated` | `:port` or empty string                                        |
| `urlwizzard.port`           | `location.port`                                                |
| `GITHUB_SOURCES_PREFIX`     | env var, url of the github repository                          |

Typical: `curl "urlwizzard.schema://urlwizzard.hostnegotiated/pages/node/curl.js"`,
`GITHUB_SOURCES_PREFIX/blob/master/pages/bash/rsync.sh`.

Replaced in two places:

1. Browser (github.js step 7): in whole `document.body` - text nodes, **all attributes** and content of `<script>` tags.
   It happens before editors are created, so placeholders work inside code blocks and in `href`.
   Not replaced: `<head>`, content added to the DOM later.
2. Build, only in CI (or `--run`): `.github/urlwizzard.sh` rewrites files on disk using `PROD_SCHEMA`, `PROD_HOSTNAME`,
   `PROD_PORT`. Files: `*.html`, `*.js`, `*.css`, `*.scss`, `*.sh` everywhere except `node_modules`, `.git`, `.github`,
   `dist`, `docker`, `bash`, `coverage`, `var`, `noprettier`. `*.md` and `*.ts` are not touched.

Consequences:

- It is plain text replace of every occurrence. When the literal placeholder text has to survive (documentation of the
  feature, code which searches for it) split it: `"urlwizzard." + "hostname"`.
- Never commit result of `.github/urlwizzard.sh --run` executed locally.
- Standalone page without github.js: `import "/public/preprocessed.js"; import urlwizzard from "/js/urlwizzard.js"; await urlwizzard();`
  (README shows `/build/preprocessed.js`, the file served to the browser is `public/preprocessed.js`).
- Test page: research/urlwizzard/urlwizzard.html. Env vars in browser: see `envprocessor` skill.

## `*.template.html` -> `*.rendered.html` (scripts/template.sh, scripts/template.ts)

Every `X.template.html` (outside node*modules) is rendered to `X.rendered.html` next to it.
(README says "`*.html`" - the real output name is `\*.rendered.html`.)

| placeholder        | effect                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| `<%inject path %>` | content of the file as is                                                    |
| `<%url path %>`    | content with every `"` replaced by `%22` (for `href="javascript:..."`)       |
| `<%script path %>` | content with `</script>` replaced by `&lt;/script>` (to show html in editor) |

- `path` starting with `/` is resolved from the project root, otherwise relative to the directory of the template.
- Every line of the injected file is prefixed with the indentation the placeholder had.
- Missing file or unknown placeholder type fails the build.
- **Edit only the `*.template.html`**, `*.rendered.html` is generated (starts with a WARNING comment) and gitignored.
  Links in navigation must point to `*.rendered.html`.
- dev.sh renders all templates on start and then re-renders on change of a `*.template.html` only -
  a change in an injected file alone doesn't trigger it.
- In build it runs right after uglify, so a template can inject a fresh `*.uglify.min.js` (bookmarklets do that).

## `*.uglify.js` -> `*.uglify.min.js` (scripts/uglify.sh, scripts/uglify.mjs)

Every `X.uglify.js` (outside node_modules) is bundled and minified with esbuild (+ `esbuild-minify-templates` to minify
template literals) to `X.uglify.min.js` next to it. README mentions babel + uglifyjs - that is history.
Because it is bundled, `import` in such file is inlined. Runs in `build.sh` (before templates), not watched by dev.sh.

## Callout boxes (css/main.css)

Classes: `.stnostte` (note), `.tistp` (tip), `.istmportant` (important), `.wstarning` (warning), `.cstaution` (caution),
`.estrror` (error). The names are misspelled deliberately - use exactly these. `<div class="tistp">text</div>`.
Examples: pages/markdown/index.html. Not available on pages with `no-main-css`.

## New page

Use the `page` skill and templates from README.md ("TEMPLATE", "template minimal"). `<title>stopsopa.github.io</title>`
stays as is.

## Build steps which rewrite files only in CI

`.github/urlwizzard.sh`, `.github/sha384.sh` (`sha384.sh::path` markers, see .github/sha384.md) and
`.github/clicksecure.sh` (injects blocking code - the "difficult to open" part, `?disableclicksecure` in url switches
it off) run in dry-run mode locally and for real only with `CI` env var or `--run`.
`build.sh` also runs `markdown-toc -i README.md` (TOC in README is generated, don't edit it by hand) and prettier on
the whole project.

## CI skip

Commit message equal to `q`, starting with `q `, ending with ` q` or containing `q` skips unit, jasmine and e2e
tests in .github/workflows/pipeline.yml (build and deploy still run). README mentions `[q]` - the workflow matches
`q` as a separate word, so `[q]` alone doesn't match.

</project-features>

<project-overview>

# Project overview (setup, commands, directories)

Moved here from the old CLAUDE.md. Behaviour of pages (github.js, body attributes, ACE editors, tabs, urlwizzard,
templates, uglify, CI skip) is described in "Project features" above - not repeated here.

## What it is

Personal code snippet repository and webpage hosted on GitHub Pages: a collection of code examples, commands and
utilities across various technologies (bash, JavaScript, Node, React, Python, etc.).
Pages have interactive code editors (ACE editor) and dynamically rendered content.

- The site is designed to be "difficult to open" (author's preference) but not impossible (see clicksecure above).
- Most pages are self-contained with embedded code snippets.
- Direct editing via GitHub web editor (github.dev) is a common workflow.
- The site intentionally exposes some (not secure) environment variables to the client for dynamic URL handling.
- Use Context7 to check up-to-date docs when implementing new libraries or frameworks, or adding features using them.

## Node version

Specified in `.nvmrc`.

## Environment setup

`.env` is required for local development and for build. Key variables:

- `PROJECT_NAME` - project identifier
- `NODE_API_PORT` - port for local dev server
- `LOCAL_HOSTS` - local domain for development
- `FIREBASE_*` - Firebase configuration variables
- `GITSTORAGE_CORE_REPOSITORY` - GitHub repository reference
- `GITHUB_SOURCES_PREFIX` - prefix for GitHub source links
- `EXPOSE_EXTRA_ENV_VARIABLES` - controls which env vars are exposed to the client (see `envprocessor` skill)

`.env.sh` is also required, it is sourced by build scripts.
build.sh fails when `PROJECT_NAME`, `GITSTORAGE_CORE_REPOSITORY`, `GITHUB_SOURCES_PREFIX` or
`EXPOSE_EXTRA_ENV_VARIABLES` is empty.

## Commands

### Development

```bash
make start                  # Start dev server (no browser)
/bin/bash dev.sh            # Same as make start
/bin/bash dev.sh browser    # Start dev server and open browser
/bin/bash dev.sh launch_ide # Start dev server, open browser and IDE
```

The dev server:

- runs on port from `NODE_API_PORT`, host from `LOCAL_HOSTS` if defined
- watches for file changes (TypeScript, templates, bundles)
- logs to `var/log.log`

### Build

```bash
make build        # Full production build
/bin/bash build.sh
```

Order of steps in build.sh:

1. `npx tsc`
2. `node pages/portsregistry/lists/ports-generator.js`
3. `scripts/uglify.sh` (`*.uglify.js` -> `*.uglify.min.js`)
4. `scripts/template.sh` (`*.template.html` -> `*.rendered.html`)
5. envprocessor: `build/preprocessed.js` -> `public/preprocessed.js` (masked by `EXPOSE_EXTRA_ENV_VARIABLES`), `public/env.js`
6. `bundle.sh bundle.ignore`, `transpile.sh transpile.ignore` (TypeScript handling is described in TRANSPILATION.md)
7. `.github/ytlinksfix.sh`
8. substitute variables in `gitstorage-core.sh`
9. `.github/urlwizzard.sh`, `.github/injector.sh`
10. `es.sh`
11. `markdown-toc -i README.md`, prettier on the whole project
12. `.github/sha384.sh`, `.github/clicksecure.sh`
13. only in CI: `bash/sync.sh pack`

### Testing

```bash
make test              # Run unit tests (vitest, with coverage)
/bin/bash test.sh      # Same as above
/bin/bash test.sh --watch       # Watch mode (changed tests only)
/bin/bash test.sh --watchAll    # Watch mode (all tests)
/bin/bash test.sh -t 'filter'   # Run specific test by name
/bin/bash test.sh tests/...     # Run one test file or directory

make testall           # Run all test types
/bin/bash testall.sh   # healthcheck + vitest + Jasmine + Playwright E2E

# Jasmine tests (integration)
/bin/bash jasmine/test.sh --env .env -- --target docker

# Playwright tests (E2E)
/bin/bash playwright.sh --target docker
```

- **Vitest** (unit tests): `tests/`
- **Jasmine** (integration): `jasmine/`
- **Playwright** (E2E): verify page functionality across browsers

### Code style (prettier, config in prettier.config.cjs)

```bash
make style_check   # Check code formatting
make style_fix     # Auto-fix code formatting
make style_list    # List files with formatting issues
```

## CI/CD pipeline

`.github/workflows/pipeline.yml` runs on push to `master`, on pull requests and on manual workflow dispatch.
Commits to other branches don't trigger it - create a PR for that.

1. job `test`: unit tests, Jasmine tests and Playwright E2E tests
2. job `github-pages`: deploys to GitHub Pages (needs `test`, only on master)

## Firebase

The site uses Firebase for authentication and database (e.g. pages/pastetool, pages/portsregistry).
Configuration comes from `FIREBASE_*` environment variables. Database rules restrict read/write to authenticated
users by email.

## Key scripts and files

- `server.js` - local development server (Express + HTTPS/HTTP)
- `dev-tail.js` - multiplexes log output during development
- `.github/injector.sh` - injects dynamic content during build
- `.github/clicksecure.sh` - adds security blocking code (only in CI)
- `.github/sha384.sh` - generates SRI hashes (only in CI)
- `.github/ytlinksfix.sh` - fixes YouTube embed links
- `bash/exportsource.sh` - exports .env variables to bash

## Directory structure

### Core directories

- `pages/` - main content: topic-specific subdirectories (bash, javascript, react, docker, kubernetes, etc.),
  each typically with an `index.html` with code snippets and examples. This is the primary content served to users.
- `js/` - core JavaScript utilities and the main entry point (`github.js`). Reusable modules like `doace.js`, `toc.js`,
  `urlwizzard.js`, `manipulation.js`, etc. Loaded by most pages.
- `css/` - stylesheets, `normalize.css` and `main.css`. Loaded globally by `github.js`.
- `bash/` - bash utility scripts organized by category:
  - file system operations (`fs/`)
  - git helpers (`git/`)
  - process management (`proc/`)
  - environment variable handling (`exportsource.sh`, `envrender.sh`)
  - utilities like `colours.sh`, `dlogger.sh`, `args.sh`
- `scripts/` - build-time processing scripts:
  - `template.sh` / `template.ts` - `*.template.html` -> `*.rendered.html`
  - `uglify.sh` / `uglify.mjs` - `*.uglify.js` -> `*.uglify.min.js`
  - `reencode.sh` - file encoding utilities
- `.github/` - CI/CD scripts and GitHub Actions workflows:
  - `workflows/pipeline.yml` - main CI/CD pipeline
  - build-time processors: `injector.sh`, `clicksecure.sh`, `sha384.sh`, `urlwizzard.sh`, `ytlinksfix.sh`
  - `healtcheck.js` - server health check for CI
  - `clean_before_artifact.sh` - cleans up before deployment

### Supporting directories

- `libs/` - shared JavaScript libraries for Node.js (`IndexedDBPromised.js`, `easing.js`, `secure.mjs`, ...)
- `noprettier/` - third-party libraries excluded from prettier formatting:
  - ACE editor (`ace/`)
  - Bootstrap (`bootstrap/`, `bootstrap-3.3.4/`)
  - jQuery, lodash, vanilla-tabs, polyfills
  - `anchor.min.js` for anchor links
- `components/` - reusable React/UI components (e.g. `Textarea.js`)
- `demos/` - standalone demo projects (e.g. `amazon-menu`, `xor`)
- `research/` - experimental/research code (flexbox, indexeddb, urlwizzard, math.js experiments)
- `cert/` - SSL certificates for local HTTPS development
- `docker/` - docker-related configuration files
- `img/` - static images and icons
- `override/` - override configurations or files
- `.vscode/` / `.idea/` - IDE configuration files

### Generated directories (gitignored)

- `dist/` - bundles
- `build/` - intermediate build artifacts
- `public/` - generated public assets (`env.js`, `preprocessed.js`, coverage reports)
- `bin/` - generated executable scripts
- `var/` - runtime logs and temporary files (e.g. `var/log.log`)
- `playwright-report/` - Playwright test reports
- `coverage/` - test coverage reports
- `test-results/` - test execution results

</project-overview>

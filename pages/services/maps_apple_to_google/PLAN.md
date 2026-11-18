# Apple Maps → Google Maps link converter - UI implementation plan

Single page tool: paste an Apple Maps link on the left, get the equivalent Google Maps link (with `copy` button) and see the location on a Google map on the right.

Background and the reasoning about which links are convertible: [RESEARCH.md](RESEARCH.md).

## 1. Files

| file              | role                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `convert.ts`      | already exists, DON'T change it. Exports `convert(link): string \| null` and `convertShort(link)`  |
| `convert.js`      | generated from `convert.ts` by repo transpilation (gitignored), this is what the browser imports   |
| `convert.test.ts` | already exists, `node --test pages/services/maps_apple_to_google/convert.test.ts`                  |
| `matg.html`       | THE UI. One self-contained file: markup + `<style>` + one inline `<script type="module">`          |
| `/index.html`     | add `<li>` link to `pages/services/maps_apple_to_google/matg.html` in the `<h2>Services</h2>` list |

Rules:

- "flat mode" from `pages/services/SERVICES_RULES.md`: no bundler, no node dependencies, nothing to install. `matg.html` does `import { convert, convertShort } from "./convert.js";`
- standalone page - do NOT load `/js/github.js`
- no external JS/CSS libraries at all. The Google map is a plain `<iframe>`
- all conversion logic stays in `convert.ts`. The UI never parses the Apple link on its own to build the Google link - it only calls `convert()`
- plain CSS with native nesting (no scss), format with prettier
- every interactive element has `data-testid` (listed below)

## 2. Layout

```
+--------------------------------------------------------------+
| # apple-maps-to-google-maps                             home |  header 48px
+---------------------------+----------------------------------+
| [card] APPLE MAPS LINK    |                                  |
|  [ input        ][paste][clear]                              |
|  [copy] https://www.google.com/maps/...                      |
|  | status message         |        Google map <iframe>       |
|  [ ] copy automatically after paste                          |
| [card] WHAT HAPPENED TO THE LINK PARAMETERS (table)          |
| [card] EXAMPLES (click to try)                               |
| [card] GOOGLE MAPS API KEY (OPTIONAL) - how to get it        |
+---------------------------+----------------------------------+
        left 44%, scrolls              right: rest, full height
```

- root: flex column, `100vh`. Header on top, then flex row with left (`flex: 0 0 44%`, `overflow-y: auto`) and right (`flex: 1`) panel
- right panel: `<iframe>` filling 100% × 100%. When there is nothing to show the iframe is hidden and centered placeholder text is shown: "Paste Apple Maps link on the left - location will show up here."
- below 800px width: panels stack vertically (left first, map below with `height: 70vh`), page scrolls normally

## 3. Styling - Discord look, LIGHT theme

CSS variables on `:root`:

| variable         | value     | used for                                       |
| ---------------- | --------- | ---------------------------------------------- |
| `--bg-primary`   | `#ffffff` | header, cards                                  |
| `--bg-secondary` | `#f2f3f5` | left panel background, status block            |
| `--bg-tertiary`  | `#e3e5e8` | page / map background, secondary buttons       |
| `--bg-input`     | `#ebedef` | inputs                                         |
| `--text`         | `#313338` | normal text                                    |
| `--text-muted`   | `#5c5e66` | labels, placeholders                           |
| `--blurple`      | `#5865f2` | primary button, focus border (hover `#4752c4`) |
| `--link`         | `#006ce7` | links                                          |
| `--green`        | `#248046` | success                                        |
| `--red`          | `#da373c` | error                                          |
| `--yellow`       | `#f0b232` | warning                                        |

- font: `"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`, 15px
- header: white, bottom border, title styled as Discord channel name: muted `#` + bold `apple-maps-to-google-maps`
- each `<section>` on the left is a white card, `border-radius: 8px`, `padding: 16px`
- section labels: 12px, bold, uppercase, muted
- inputs: 40px high, `--bg-input` background, no visible border, blurple border on focus
- buttons: 40px high, radius 8px, no border. Secondary = `--bg-tertiary`, primary (`copy`) = blurple with white text
- status message = Discord embed: `--bg-secondary` block with 4px coloured left bar (green ok / yellow warn / red error)
- `<code>`: monospace on `--bg-tertiary` with 4px radius

## 4. Behaviour

### 4.1 Main flow - `process(pasted)`

Runs on every `input` event of the field (so paste and typing both trigger it immediately, no submit button):

1. `raw = input.value`; store it in page URL: `?link=<raw>` via `history.replaceState` (remove the param when empty)
2. `apple = extract(raw)` - user might paste a whole message, so pick the first match of `/https?:\/\/maps\.apple(?:\.com)?\/[^\s<>"']*/i`, otherwise `raw.trim()`
3. empty → hide result, status, breakdown; show map placeholder. Stop
4. `google = convert(apple)`
5. if `google === null` and hostname of `apple` is `maps.apple` (short link):
   - show warn status "Short link - asking Apple where it points..."
   - `google = await convertShort(apple)` in try/catch (in a browser this normally fails - Apple sends no CORS headers; keep the attempt anyway)
   - ignore the result if the input changed in the meantime (incrementing run counter)
   - still null → warn status explaining that the id is opaque and listing the manual steps: 1. link "open the short link in new tab" 2. Apple redirects to long `https://maps.apple.com/...` link 3. copy it from address bar and paste here. Stop
6. still `null` → error status "Can't convert - expecting `https://maps.apple.com/...` link with a location in it (coordinate, address, q, destination ...)". Hide result and map. Stop
7. success:
   - result row (directly under the input, one line): `[copy]` button first, then `<a target="_blank" rel="noopener noreferrer">` with the Google link as both text and href
   - render parameters table (4.3) and map (4.2)
   - ok status: "Place link converted." or "Directions link converted." (+ " No origin in the link - Google will start from your current location, map shows only the destination." when directions link has no `origin`)
   - if `pasted` and "copy automatically after paste" is checked → copy

### 4.2 Map (right panel)

The iframe url is derived from the GOOGLE link returned by `convert()` (parse its `query` / `origin` / `destination` / `travelmode` params), never from the Apple link.

Without API key (default, needs no setup):

- place: `https://maps.google.com/maps?q=<query>&z=15&output=embed`
- directions with origin: `https://maps.google.com/maps?saddr=<origin>&daddr=<destination>&output=embed&dirflg=<d|w|r|b>` (driving → `d`, walking → `w`, transit → `r`, bicycling → `b`, omit when no travelmode)
- directions without origin: same as place with `q=<destination>`

With API key use official Maps Embed API. The key is optional and comes from `.env` variable `PUBLIC_GOOGLE_MAPS_EMBED_KEY` - `matg.html` loads `<script src="/public/preprocessed.js"></script>` (before the module script) and reads `window.process?.env?.PUBLIC_GOOGLE_MAPS_EMBED_KEY`. `PUBLIC_` prefix means it is exposed to the browser automatically (see `EXPOSE_EXTRA_ENV_VARIABLES`). It is not a secret (it is visible in the iframe url), it is protected by HTTP referrer restriction in Google Cloud console. For production it has to be also in `.env.pipeline`. When the variable is missing or empty use the keyless urls above:

- `https://www.google.com/maps/embed/v1/place?key=<key>&q=<query or destination>`
- `https://www.google.com/maps/embed/v1/directions?key=<key>&origin=<origin>&destination=<destination>&mode=<travelmode>`

Don't reassign `iframe.src` when the url didn't change (avoids reload flicker while typing).

### 4.3 Parameters table

For every query param of the Apple link one row: `Apple param | value | Google param`.

- Google param = name of the param in the generated Google link holding the same value
- for `mode` / `dirflg`: `travelmode=<value>` when the Google link has `travelmode`
- no match → `dropped`, whole row faded

### 4.4 Copy

- `navigator.clipboard.writeText(googleLink)`, button text changes to `copied` (green) for 1.2s, `failed` on error
- `Enter` in the input = copy, `Escape` = clear

### 4.5 Other interactions

- `paste` button: `navigator.clipboard.readText()` → input → process as pasted. On refusal: error status "Browser refused access to the clipboard - paste with Ctrl/Cmd+V instead."
- `clear` button: empty the input, focus it
- paste anywhere on the page (target is not an input) → goes to the input, processed as pasted
- input is autofocused, focusing it selects all text
- examples: list of clickable links that fill the input: exactly two - the place link with coordinate and one short link (`https://maps.apple.com/place?coordinate=55.119257,-6.659260&name=62%20Mountsandel%20Road&map=explore`, `https://maps.apple/p/W~5mr5ufkx8uuu`)
- "copy automatically after paste" checkbox persisted in `localStorage.matg_autocopy` (`"1"` or absent)
- "Google Maps API key (optional)" card under the examples: static public instructions how to obtain the Maps Embed API key (console.cloud.google.com → enable "Maps Embed API" → create API key → restrict to websites → restrict to Maps Embed API → put in `.env` as `PUBLIC_GOOGLE_MAPS_EMBED_KEY`), plus a line "Map is currently using: keyless embed (no key defined)" / "official Maps Embed API (key found)". The page is public: keep the text anonymous - no real domains, account names or key values, use `https://your-domain.example/*` as the example
- on load: if `?link=` is present put it in the input and process (shareable / bookmarkable state)
- no conversion history is kept anywhere (deliberately)
- all `localStorage` access in try/catch

### 4.6 Security

- generated link, table cells and examples are rendered with `textContent` / DOM API, never by concatenating user input to `innerHTML`
- status messages use `innerHTML` only with static strings (and an `<a>` built through DOM API)

## 5. `data-testid` list

`left`, `right`, `input`, `paste`, `clear`, `result`, `copy`, `link`, `status`, `autocopy`, `breakdown`, `examples`, `apikey`, `apikey-mode`, `map`, `map-placeholder`

## 6. Verification

1. `node --test pages/services/maps_apple_to_google/convert.test.ts` - all pass
2. dev server running (`make start`), open `/pages/services/maps_apple_to_google/matg.html`
3. click each example (place, short link) and paste the directions link from RESEARCH.md:
   - place → link `https://www.google.com/maps/search/?api=1&query=55.119257%2C-6.659260`, pin on the map, `name` and `map` rows dropped
   - directions → `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=driving`, route on the map
   - short link → yellow status with the 3 manual steps, no result row
4. type `hello` → red status, no result row, map placeholder
5. reload the page with `?link=` in the URL → state restored
6. narrow the window below 800px → panels stacked

## 7. Ideas not implemented (future)

- resolving short links automatically: needs a tiny server side proxy (e.g. Cloudflare Worker) doing `fetch(link, {redirect: "manual"})` and returning the `location` header with CORS enabled; then call it from `convertShort`
- QR code of the generated link (to open it on the phone)
- "Share" button using `navigator.share` on mobile
- bookmarklet / iOS Shortcut that sends the current Apple link straight to `matg.html?link=...`
- auto redirect mode: `matg.html?link=...&go=1` redirects straight to Google Maps
- batch mode: textarea with many links → list of converted ones
- reverse direction (Google → Apple)

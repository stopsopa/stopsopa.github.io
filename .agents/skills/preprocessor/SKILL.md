---
name: preprocessor
description: >
  Use when working with envprocessor - exposing environment variables to the frontend.
  Trigger when user mentions env vars, preprocessed.js, EXPOSE_EXTRA_ENV_VARIABLES,
  or needs to access environment variables in browser code.
metadata:
  author: stopsopa
  version: "1.0.0"
  website: https://github.com/stopsopa/envprocessor
---

# envprocessor - expose env vars to frontend

## What it does

Generates `window.process.env` object from selected env vars. Built at runtime (not build time), so values reflect target environment (prod/dev/staging).

Generated file: `public/preprocessed.js` (loaded before bundled code in HTML).

Just make sure loading is done like this

```html
<script src="/public/preprocessed.js"></script>
```

just before loading bundled code on to the page.

## CLI usage (in build.sh)

```bash
node node_modules/envprocessor/dist/esm/cli.js \
  --maskEnv EXPOSE_EXTRA_ENV_VARIABLES \
  --verbose --debug \
  build/preprocessed.js public/preprocessed.js
```

`EXPOSE_EXTRA_ENV_VARIABLES` env var holds regex mask. Only matching vars get exposed.

NOTE: Normally it is not AI's concern to run that command, it will be part of development setup and production build.

## Frontend usage

in order to consume env vars from /public/preprocessed.js in our app we have to import from `envprocessor`:

```js
import {
  all,
  get,
  has,
  getDefault,
  getThrow,
  getTrimmedThrow,
  getValidatedThrow,
  getDefaultIfInvalid,
  getIntegerDefault,
  getIntegerThrow,
  mockEnv,
} from "envprocessor";
```

Methods:

- `all()` - all exposed env vars
- `get(key)` - get value or undefined
- `has(key)` - check existence
- `getDefault(key, defaultValue)` - get or default
- `getThrow(key, msg?)` - get or throw (optionally with custom error message)
- `getTrimmedThrow(key)` - get trimmed value, throw if not defined or empty after trimming
- `getValidatedThrow(key, validator)` - get or throw if not defined or not passing validator (RegExp or function returning error message)
- `getDefaultIfInvalid(key, defaultValue, validator)` - get, or default if not defined or not passing validator
- `getIntegerDefault(key, defaultValue)` - get integer, or default if not defined or not an integer
- `getIntegerThrow(key)` - get integer or throw if not defined or not an integer
- `mockEnv(map)` - substitute env vars with custom object (for tests)

NOTE: `getIntegerThrowInvalid` was removed from the library - don't use it. To get optional integer use `getIntegerDefault`.

Always check `all()` is non-empty before using (preprocessed.js may not be loaded).

This library is designed to work with globally exported `window.process.env` object and provided nice interface for our app to consume these variables.

NOTE: `from "envprocessor"` works only in code processed by bundler (esbuild, vite ...) or executed by node.
Files loaded by the browser directly as native ESM (`<script type="module">`, no bundling) can't resolve bare `envprocessor` specifier.
For these copy `node_modules/envprocessor/dist/esm/env.js` to publicly served directory (e.g. `public/env.js`) during build
and import the same functions using relative path: `from "../public/env.js"`.

## Adding env vars to expose

Edit `.env` file, add variable, then update `EXPOSE_EXTRA_ENV_VARIABLES` mask in `.env` to include it.

Example: add `MY_API_KEY` → set `EXPOSE_EXTRA_ENV_VARIABLES="^(MY_API_KEY|...)"`

Mask is a regex tested against the name of each env var. Rules:

- dollar character is not allowed in the mask (library throws) - use `<dollar>` instead, it is replaced with dollar character during processing
- can be wrapped in slashes with flags: `/^TERM_.*<dollar>/i`
- recommended shape - one group of prefixes and one group of exact names:

  ```
  EXPOSE_EXTRA_ENV_VARIABLES="/(^(PUBLIC_|FIREBASE_)|^(PROJECT_NAME|MY_API_KEY)<dollar>)/"
  ```

  - `^(PUBLIC_|FIREBASE_)` - every env var starting with one of these prefixes
  - `^(PROJECT_NAME|MY_API_KEY)<dollar>` - only env vars with exactly these names

- be careful to not leave prefix inside of the group closed with `<dollar>` - `^(A<dollar>|^PROD_)<dollar>` will never match `PROD_HOSTNAME`

After changing the mask `public/preprocessed.js` has to be regenerated (usually by restarting dev server) -
variable is not visible in the browser until then.

NOTE: It is AI's concern to suggest modification to EXPOSE_EXTRA_ENV_VARIABLES when it will make decision to add and expose new env vars values for frontend.

So AI should suggest change and trigger to rebuild `/public/preprocessed.js` but it shouldn't attempt to build it on its own.

## Installation

AI might attempt to check if package.json have `envprocessor` libarry installed. But it is also safe to assume it is.
In case of failure it will be easy for programmer to figure out that this library is missing and it will be easy to install it.

```bash
pnpm install envprocessor
```

It must be a regular dependency, not devDependency (needed at runtime in production).

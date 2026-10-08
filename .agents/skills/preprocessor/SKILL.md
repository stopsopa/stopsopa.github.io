---
name: preprocessor
description: >
  Use when working with envprocessor - exposing environment variables to the frontend.
  Trigger when user mentions env vars, preprocessed.js, EXPOSE_EXTRA_ENV_VARIABLES,
  or needs to access environment variables in browser code.
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
  getIntegerThrowInvalid, // equivalent to get
  getIntegerDefault,
  getIntegerThrow,
} from "envprocessor";
```

Methods:
- `all()` - all exposed env vars
- `get(key)` - get value or undefined
- `has(key)` - check existence
- `getDefault(key, defaultValue)` - get or default
- `getThrow(key)` - get or throw
- `getIntegerThrowInvalid(key)` - get as integer or throw
- `getIntegerDefault(key, defaultValue)` - get integer or default
- `getIntegerThrow(key)` - get integer or throw

Always check `all()` is non-empty before using (preprocessed.js may not be loaded).

This library is designed to work with globally exported `window.process.env` object and provided nice interface for our app to consume these variables.

## Adding env vars to expose

Edit `.env` file, add variable, then update `EXPOSE_EXTRA_ENV_VARIABLES` mask in `.env` to include it.

Example: add `MY_API_KEY` → set `EXPOSE_EXTRA_ENV_VARIABLES="^(MY_API_KEY|...)"`

NOTE: It is AI's concern to suggest modification to EXPOSE_EXTRA_ENV_VARIABLES when it will make decision to add and expose new env vars values for frontend.

So AI should suggest change and trigger to rebuild `/public/preprocessed.js` but it shouldn't attempt to build it on its own.

## Installation

AI might attempt to check if package.json have `envprocessor` libarry installed. But it is also safe to assume it is.
In case of failure it will be easy for programmer to figure out that this library is missing and it will be easy to install it.

```bash
pnpm install envprocessor
```

It must be a regular dependency, not devDependency (needed at runtime in production).
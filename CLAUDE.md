# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal code snippet repository and webpage hosted on GitHub Pages. It's a collection of code examples, commands, and utilities across various technologies (bash, JavaScript, Node, React, Python, etc.). The site features interactive code editors using ACE editor and supports dynamic content rendering.

## Node Version

Node version is specified in `.nvmrc`: **23.10.0**

## Environment Setup

The project requires a `.env` file for local development. Key environment variables include:
- `PROJECT_NAME` - project identifier
- `NODE_API_PORT` - port for local dev server
- `LOCAL_HOSTS` - local domain for development
- `FIREBASE_*` - Firebase configuration variables
- `GITSTORAGE_CORE_REPOSITORY` - GitHub repository reference
- `GITHUB_SOURCES_PREFIX` - prefix for GitHub source links
- `EXPOSE_EXTRA_ENV_VARIABLES` - controls which env vars are exposed to client

A `.env.sh` file is also required and sourced by build scripts.

## Common Development Commands

### Development
```bash
make start                  # Start dev server (no browser)
/bin/bash dev.sh            # Same as make start
/bin/bash dev.sh browser    # Start dev server and open browser
/bin/bash dev.sh launch_ide # Start dev server, open browser and IDE
```

The dev server:
- Runs on port specified in `NODE_API_PORT` (or `LOCAL_HOSTS` if defined)
- Watches for file changes (TypeScript, templates, esbuild entries)
- Logs to `var/log.log`
- Automatically transpiles TypeScript, processes templates, and bundles React components

### Build
```bash
make build        # Full production build
/bin/bash build.sh
```

The build process:
1. Transpiles TypeScript files (`tsc`)
2. Processes `*.uglify.js` files → `*.uglify.min.js` (via esbuild with minification)
3. Processes `*.template.html` files → `*.rendered.html` (injects/url placeholders)
4. Runs envprocessor to inject environment variables
5. Bundles React entry points via esbuild
6. Runs various post-processing scripts (urlwizzard, sha384, clicksecure, injector)
7. Formats with Prettier

### Testing
```bash
make test              # Run unit tests (vitest)
/bin/bash test.sh      # Same as above
/bin/bash test.sh --watch       # Watch mode (changed tests only)
/bin/bash test.sh --watchAll    # Watch mode (all tests)
/bin/bash test.sh -t 'filter'   # Run specific test by name

make testall           # Run all test types
/bin/bash testall.sh   # Jasmine + Playwright E2E tests

# Jasmine tests (integration)
/bin/bash jasmine/test.sh --env .env -- --target docker

# Playwright tests (E2E)
/bin/bash playwright.sh --target docker
```

### Code Style
```bash
make style_check   # Check code formatting
make style_fix     # Auto-fix code formatting
make style_list    # List files with formatting issues
```

## Build System Architecture

### File Processing Patterns

1. **`*.uglify.js` → `*.uglify.min.js`**
   - Processed by `scripts/uglify.sh`
   - Uses esbuild with minification and template literal minification
   - Recursively finds all `*.uglify.js` files (excluding node_modules)

2. **`*.template.html` → `*.rendered.html`**
   - Processed by `scripts/template.sh`
   - Supports placeholders:
     - `<%url path/to/file.js %>` - imports file content and encodes quotes as %22
     - `<%inject path/to/file.js %>` - imports file content as-is
   - Paths can be relative or absolute (starting with `/` resolves from repo root)

3. **`**/*.entry.{js,jsx}` → `dist/*.bundle.js`**
   - Processed by `esbuild-entries.js`
   - Bundles React components and JSX files
   - Uses esbuild with sassPlugin for SCSS support

4. **TypeScript compilation**
   - All `module*.ts` files are transpiled to `.js` in the same directory
   - Uses standard `tsc` with config from `tsconfig.json`

### Special Build Features

- **URL Wizzard**: Replaces special placeholders throughout the codebase:
  - `urlwizzard.schema` → `http` or `https`
  - `urlwizzard.hostname` → domain name
  - `urlwizzard.hostnegotiated` → domain with port if non-standard
  - `urlwizzard.port` → port number
  - `GITHUB_SOURCES_PREFIX` → full GitHub repository URL

- **Environment Variable Injection**: `envprocessor` masks/exposes env vars based on `EXPOSE_EXTRA_ENV_VARIABLES`

## Application Architecture

### Client-Side Entry Point

The main entry point is `/js/github.js` which:
1. Loads environment variables (both ESM and CJS versions of `preprocessed.js`)
2. Loads core dependencies asynchronously (ACE editor, lodash, vanilla-tabs, AnchorJS)
3. Initializes page features in sequence:
   - Builds header and footer
   - Adds anchor links to headings
   - Generates table of contents (if `toc` attribute on `<body>`)
   - Sorts lists with `data-do-sort` attribute
   - Processes mobile links
   - Runs URL wizzard replacements
   - Initializes ACE code editors
   - Evaluates code blocks with `data-eval` attribute
4. Sets `window.githubJsReady = true` when complete

**IMPORTANT**: Most HTML pages include `<script type="module" src="/js/github.js"></script>` at the end of `<body>`.

### Special HTML Attributes

- `<body toc>` - generates table of contents from `<h2>` tags
- `<body nohead>` - suppresses header
- `<body nofoot>` - suppresses footer
- `<body nogithublink>` - hides GitHub edit ribbon
- `<body noprofileribbon>` - hides GitHub profile ribbon
- `<div data-do-sort>` - sorts child elements by innerText
- `<script type="editor|syntax" data-lang="js" data-eval>` - creates ACE editor, optionally executes code

### ACE Editor Integration

Code blocks are wrapped with ACE editor automatically. Syntax highlighting is loaded dynamically based on `data-lang` attribute. Supported languages match ACE's modelist.

To manually trigger:
```javascript
window.doEval();  // Execute code blocks with data-eval
window.doace();   // Initialize ACE editors
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/pipeline.yml`) runs on:
- Push to `master` branch
- Pull requests
- Manual workflow dispatch

Pipeline stages:
1. **Test Job**: Runs unit tests, Jasmine tests, and Playwright E2E tests
2. **GitHub Pages Job**: Deploys to GitHub Pages (only on master)

**Fast Release**: Add `[q]` or ` q` in commit message to skip tests (e.g., `git commit -m "Update index.html q"`)

## Firebase Integration

The site uses Firebase for authentication and database. Configuration is loaded from environment variables. Database rules restrict read/write to authenticated users by email.

## Key Scripts and Files

- `server.js` - Local development server (Express + HTTPS/HTTP)
- `esbuild-entries.js` - Bundles React entry points
- `esbuild-node.sh` - Bundles Node.js scripts
- `dev-tail.js` - Multiplexes log output during development
- `.github/injector.sh` - Injects dynamic content during build
- `.github/clicksecure.sh` - Adds security blocking code (only in CI)
- `.github/sha384.sh` - Generates SRI hashes (only in CI)
- `.github/ytlinksfix.sh` - Fixes YouTube embed links
- `bash/exportsource.sh` - Exports .env variables to bash

## Directory Structure

### Core Directories

- **`pages/`** - Main content directory containing topic-specific subdirectories (bash, javascript, react, docker, kubernetes, etc.). Each subdirectory typically has an `index.html` with code snippets and examples. This is the primary content that gets served to users.

- **`js/`** - Core JavaScript utilities and the main entry point (`github.js`). Contains reusable modules like `doace.js`, `toc.js`, `urlwizzard.js`, `manipulation.js`, etc. These are loaded by most pages.

- **`css/`** - Stylesheets including `normalize.css` and `main.css`. Loaded globally by `github.js`.

- **`bash/`** - Bash utility scripts organized by category:
  - File system operations (`fs/`)
  - Git helpers (`git/`)
  - Process management (`proc/`)
  - Environment variable handling (`exportsource.sh`, `envrender.sh`)
  - Utilities like `colours.sh`, `dlogger.sh`, `args.sh`

- **`scripts/`** - Build-time processing scripts:
  - `template.sh` / `template.js` - Processes `*.template.html` → `*.rendered.html`
  - `uglify.sh` / `uglify.mjs` - Minifies `*.uglify.js` → `*.uglify.min.js`
  - `reencode.sh` - File encoding utilities

- **`.github/`** - CI/CD scripts and GitHub Actions workflows:
  - `workflows/pipeline.yml` - Main CI/CD pipeline
  - Build-time processors: `injector.sh`, `clicksecure.sh`, `sha384.sh`, `urlwizzard.sh`, `ytlinksfix.sh`
  - `healtcheck.js` - Server health check for CI
  - `clean_before_artifact.sh` - Cleans up before deployment

### Supporting Directories

- **`libs/`** - Shared JavaScript libraries for Node.js (utilities like `preprocessor.js`, `IndexedDBPromised.js`, `easing.js`, `secure.mjs`)

- **`noprettier/`** - Third-party libraries excluded from Prettier formatting:
  - ACE editor (`ace/`)
  - Bootstrap (`bootstrap/`, `bootstrap-3.3.4/`)
  - jQuery, lodash, vanilla-tabs, polyfills
  - `anchor.min.js` for anchor links

- **`components/`** - Reusable React/UI components (e.g., `Textarea.js`)

- **`demos/`** - Standalone demo projects (e.g., `amazon-menu`, `xor`)

- **`research/`** - Experimental/research code (flexbox, indexeddb, urlwizzard, math.js experiments)

- **`cert/`** - SSL certificates for local HTTPS development

- **`docker/`** - Docker-related configuration files

- **`img/`** - Static images and icons

### Build Output Directories (Gitignored)

- **`dist/`** - esbuild output for `*.entry.{js,jsx}` files (React bundles)
- **`build/`** - Intermediate build artifacts
- **`public/`** - Generated public assets (`env.js`, `preprocessed.js`, coverage reports)
- **`bin/`** - Generated executable scripts
- **`var/`** - Runtime logs and temporary files (e.g., `var/log.log`)
- **`playwright-report/`** - Playwright test reports
- **`coverage/`** - Test coverage reports

### Testing Directories

- **`tests/`** - Vitest unit tests
- **`jasmine/`** - Jasmine integration tests with test runner scripts
- **`test-results/`** - Test execution results

### Other Directories

- **`override/`** - Override configurations or files
- **`proto/` / `prottest/`** - Prototype/experimental code
- **`.vscode/` / `.idea/`** - IDE configuration files

## Testing Structure

- **Vitest** (unit tests): Tests in `tests/` directory
- **Jasmine** (integration): Tests in `jasmine/` directory
- **Playwright** (E2E): Tests verify page functionality across browsers

## Important Notes

- The site is designed to be "difficult to open" (author's preference) but not impossible
- Most pages are self-contained with embedded code snippets
- Direct editing via GitHub web editor (github.dev) is common workflow
- The site intentionally exposes some (not secure) environment variables to client for dynamic URL handling
- Use Context7 to check up-to-date docs when needed for implementing new libraries or frameworks, or adding features using them.
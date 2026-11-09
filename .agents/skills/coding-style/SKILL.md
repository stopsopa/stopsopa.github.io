---
name: coding-style
description: General coding style for this project
---

# Overview

This project is deployed in static fashion.
Also this project is deliberately structured to support standalone html files representing pages.

So whatever you do always do style in it's own <style> tag in the same html file.

<script_overview_comment>
When creating new module or script create top comment block explaining all important aspects about that script/module :

- what is the purpose of this script/module (keep it short but still don't miss important stuff - especially if there are some non obvious information about purpose in the AI current context)
- how it should be used (examples covering most important combination of arguments and from what directory it is designed to be used)
- any other important information
  </script_overview_comment>

# typescript

## error handling

When creating errors to be thrown, in individual scripts create function

```ts

const th = (msg: string) => new Error(`${this module name.ts} error: ${msg}`);

```

and in here make `this module name.ts` just name of the script (without absolute path, use rather relative path to project root)

to produce `this module name.ts` if we know that this will not be thrown in browser context use root.ts
file and it's function

```ts
import root, { filenameRelative } from "../../../root.ts";

const relativeFilename = filenameRelative(import.meta.url);

// then you can use for example to customise error message

throw new Error(`${relativeFilename} error: whatever error...`);
```

... but generally make sure each error clearly states it's origin

## when creating standalone scripts in typescript

When creating standalone scripts which will be called like

```ts
node[myscript.ts];
```

then assume I will use native node.js stable type stripping which requires not special experiment flags. And document them as such.

When creating script for calling directly in terminal as above try to encapsulate logic of that script in a module and export it for consumption as a function/class by other modules and at the end of the file introcude

```ts
if (import.meta.main) {
  cli();
}
```

to detect if script was called directly and handle using that function/class in here

in that block also think how to handle --help page

if you should require --help argument or maybe print help page when no arguments given. Which usually makes sense when script inherently should require some arguments to perform basic function. Then lack of argument treat as opportunity to handle help page.
but in any case for help page do process.exit(1);

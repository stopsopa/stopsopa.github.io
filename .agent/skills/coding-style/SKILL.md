---
name: coding-style
description: General coding style for this project
---

# Overview

This project is deployed in static fashion.
Also this project is deliberately structured to support standalone html files representing pages.

So whatever you do always do style in it's own <style> tag in the same html file.

# Error messages

Preffer messages

```ts

throw new Error(`${this module name.ts} error: ${errorMessage}`);

// instead of

throw new Error(`${errorMessage}`);

```

... make sure each error clearly states it's origin

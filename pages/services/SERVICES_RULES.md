
When I tell you to code in file *.entry.(ts|js|tsx) then assume that this file will be transpiled into dist/*.entry.bundle.js and if css is involved then also dist/*.entry.bundle.css will be generated.

Simply import whatever you need in that *.entry.(ts|js|tsx) from node.js dependencies and know that all of that will be bundled to dist/*.entry.bundle.js.

It is not your responsibility to worry about the transpilation process - you can assume that it will be done correctly.

In whatever html file I will tell you to use that code just import relevent 

```html

    <script src="/dist/*.entry.bundle.js"></script>

```

and if css is linked in that *.entry.(ts|js|tsx) then also load

```html

    <link rel="stylesheet" href="/dist/*.entry.bundle.css" />

```

good example might be pages/macro/002multi_tabs/index.html how to import and run 

<warning>
Remember though to import in these *.entry.(ts|js|tsx) only libraries which makes sens to import in the browser context
It will not make sense to import

import fs from 'fs' 

because this is builtin node.js library for working with files. and we can't normally work with hard drive files from browser.
</warning>
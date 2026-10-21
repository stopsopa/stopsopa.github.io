# most important instruction

When directed to this skill aks me first which mode to use and then stick to it.

<mode:imports>
# Mode: When imports needed

In this mode I will either point you to file which name matches pattern _.entry.(ts|js|tsx) or I will tell you to just work in this mode then you create _.entry.(ts|js|tsx) file next to html file I've pointed you to.

Anyway in any case just work in _.entry.(ts|js|tsx) file then assume that this file will be transpiled into dist/_.entry.bundle.js and if css is involved then also dist/\*.entry.bundle.css will be generated.

Simply import whatever you need in that _.entry.(ts|js|tsx) from node.js dependencies and know that all of that will be bundled to dist/_.entry.bundle.js.

It is not your responsibility to worry about the transpilation process - you can assume that it will be done correctly.

In whatever html file I will tell you to use that code just import relevent

```html
<script src="/dist/*.entry.bundle.js"></script>
```

and if css is linked in that \*.entry.(ts|js|tsx) then also load

```html
<link rel="stylesheet" href="/dist/*.entry.bundle.css" />
```

normally when css is needed then just create css file right next to \*.entry.(ts|js|tsx)
ideally by the same name and do

```ts
import "./<filename>.css";
```

this way separate /dist/\*.entry.bundle.css will be generated. And only when that file is generated then do

```html
<link rel="stylesheet" href="/dist/*.entry.bundle.css" />
```

good example might be pages/macro/002multi_tabs/index.html how to import and run

WARNING: historicaly I've been using scss but the only reason I was using it was that scss provided selectors nesting in css, but now since this is supported natively in the browsers let's just use nesting in regular scss.
So don't use scss, just use css files and syntax with nesting rules.

<warning>
Remember though to import in these *.entry.(ts|js|tsx) only libraries which makes sens to import in the browser context
It will not make sense to import

import fs from 'fs'

because this is builtin node.js library for working with files. and we can't normally work with hard drive files from browser.
</warning>

</mode:imports>

<mode:flat>

# no need for imports just transpilation mode (flat mode)

In this mode I will either point you to file *.ts or in that mode just create file with *.ts extension and put your code there.

Main property about this is that when creating code for browser we won't be able to do imports of other libraries because this file will not be bundled with esbuild.

So it will just be transpiled.

## example

when you work with file

/pages/expermient/directory/deeperdirectory/file.ts

I have transpilation setup in place which will generate from it

/pages/expermient/directory/deeperdirectory/file.js

fight next to *.ts file.

Your job is to just import that output transpiled file *.js (usually using relative path ./file.js) in given html file

</mode:flat>

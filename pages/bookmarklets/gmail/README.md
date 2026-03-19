This is tiny project to help quickly switch betwen split pane and regular mode of viewing emails in gmail.

Once extract.ts was ready I've transpiled it to:

pages/bookmarklets/gmail/extract.js
with
printf pages/bookmarklets/gmail/extract.ts | node es.ts

and after testing that in the browser I've created tampermonkey script:

pages/bookmarklets/gmail/tampermonkey.js

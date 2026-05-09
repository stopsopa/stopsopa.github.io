There are few ways typescript is treated here

# transpile.sh

This is just for finding _.ts files and transpiling each file right next to _.js

# bundle.sh

To find all _.entry.js & _.entry.jsx and transpiling to:

/dist/[name].bundle.js
/dist/[name].bundle.css

# tsc.sh

This uses npx tsc just for transpilation.
It is generally looking into all files it can see except obvious exclusions like node_modules. But that can be changed in tsconfig.json

# es.sh

Is more flexible which can switch between transpiling and bundling for special cases

See
pages/bash/xx/xx.node.cjs
that is good example how to override esbuild setup for individual files

There are few ways typescript is treated here

# transpile.sh

[transpile.ignore](transpile.ignore)

This is just for finding _.ts files and transpiling each file right next to _.js

# es.sh

[es.ignore](es.ignore)

Is more flexible which can switch between transpiling and bundling for special cases
but is not so great to achieve watch mode alone

See
pages/bash/xx/xx.node.cjs
that is good example how to override esbuild setup for individual files

WARNING: YOU HAVE TO UNCOMMENT IN - [es.ignore](es.ignore) IF YOU PREFER [es.sh](es.sh) (esbuild) - [transpile.ignore](transpile.ignore) IF YOU PREFER [transpile.sh](transpile.sh) (typescript)
TEST:
/bin/bash es.sh <---- this one is not part of xx start, only build.sh
/bin/bash transpile.sh transpile.ignore

# bundle.sh

To find all _.entry.js & _.entry.jsx and transpiling to:

/dist/[name].bundle.js
/dist/[name].bundle.css

# tsc.sh

[tsconfig.json](tsconfig.json)

This uses npx tsc just for transpilation.
It is generally looking into all files it can see except obvious exclusions like node_modules. But that can be changed in [tsconfig.json](tsconfig.json)

---

# other interesting

## https://github.com/stopsopa/select-component/blob/cbadec62e52e1007acef87abc89f050bdb31be3c/tsc-watch.sh

this one is interesting because we first run tsc in watch mode and then tap to its output and we can run whatever we want after
so we can run here transpilation and formatting

So fundamentally we are relying on tsc watch which is generally more flexible in reacting to only typescript changes
so we can typecheck and do watever we want after

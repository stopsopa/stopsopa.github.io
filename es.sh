
# Script for transpilation of *.ts files to *.js files
# to learn more run
# node es.ts
# mainly used in build.sh

# see TRANSPILATION.md

set -e 



find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name scripts \
    -o -name .opencode \
\) -prune \
-o -type f \
\( -name '*.ts' -o -name "*.node.cjs" \) \
-print \
| NODE_OPTIONS="" node gitignore.js es.ignore \
| DEBUG=true /bin/bash ts.sh es.ts --produce-gitignore --update

# Script for transpilation of *.ts files to *.js files
# to learn more run
# node es.ts
# mainly used in build.sh

# see TRANSPILATION.md

set -e 

export NODE_OPTIONS=

find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name scripts \
    -o -name .opencode \
\) -prune \
-o -type f \
\( -name '*.ts' -o -name "*.node.js" -o -name "*.node.cjs" -o -name "*.node.mjs" \) \
-print \
| node gitignore.js es.ignore \
| node es.ts --forward-stdin-to-stdout \
| node bash/node/preamble.ts es.preamble --forward-stdin-to-stdout \
| node bash/git/addToGitignore.ts .gitignore transpile_sh
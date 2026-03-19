
# Script for transpilation of *.ts files to *.mjs files
# to learn more run
# node es.ts

set -e 

find . -path './node_modules' -prune -o -path './.git' -prune -o -type f -name '*.ts' -print \
    | NODE_OPTIONS="" node gitignore.js .esignore \
    | NODE_OPTIONS="" DEBUG=true /bin/bash ts.sh es.ts --produce-gitignore --update
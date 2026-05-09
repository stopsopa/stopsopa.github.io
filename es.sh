
# Script for transpilation of *.ts files to *.js files
# to learn more run
# node es.ts
# mainly used in build.sh

# see TRANSPILATION.md

set -e 

export NODE_OPTIONS=""

find . \
    -path './node_modules' -prune -o \
    -path './.git' -prune -o \
    -path './.opencode' -prune -o \
    -path './noprettier' -prune -o \
    -path './scripts' -prune -o \
    -type f -name '*.ts' \
    -print \
    | node gitignore.js es.ignore \
    | DEBUG=true /bin/bash ts.sh es.ts --produce-gitignore --update
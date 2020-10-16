
set -x
set -e

node roderic/peprocessor.js

node node_modules/.bin/webpack --watch







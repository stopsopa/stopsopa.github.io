
# 
# see TRANSPILATION.md
# 
# /bin/bash transpile.sh
# /bin/bash transpile.sh --watch
# 
# That script is responsible just for transpiling
# 
export NODE_OPTIONS=""

if [ ! -f "${1}" ]; then

    # normally ${1} is transpile.ignore
    echo "${0} error: file ${1} doesn't exist"
    exit 1
fi

find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
\) -prune \
-o -type \
f -name "*.ts" \
-print \
| node gitignore.js "${1}" \
| /bin/bash ts.sh transpile.ts \
| node transpile_prettier_pipe.ts \
| awk '{ print $3 }' \
| node bash/node/preamble.ts transpile.preamble

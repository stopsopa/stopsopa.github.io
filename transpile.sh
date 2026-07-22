
# 
# see TRANSPILATION.md
# 
# /bin/bash transpile.sh
# /bin/bash transpile.sh --watch
# 
# That script is responsible just for transpiling
# 
export NODE_OPTIONS=""

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
| node gitignore.js transpile.ignore \
| /bin/bash ts.sh transpile.ts "$@" | node transpile_pipe.ts


# | /bin/bash ts.sh transpile.ts "$@" 
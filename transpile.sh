
# 
# see TRANSPILATION.md
# 
# /bin/bash transpile.sh transpile.ignore
# /bin/bash transpile.sh transpile.ignore --watch
# 
# That script is responsible just for transpiling
# 
export NODE_OPTIONS=""

IGNORE_FILE="${1}"

if [ ! -f "${IGNORE_FILE}" ]; then

  cat <<EEE

  >${IGNORE_FILE}< doesn't exist

EEE

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
| node gitignore.js "${IGNORE_FILE}" \
| /bin/bash ts.sh transpile.ts "$@" | node transpile_pipe.ts


# | /bin/bash ts.sh transpile.ts "$@" 
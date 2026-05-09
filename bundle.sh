
# 
# /bin/bash bundle.sh bundle.ignore
# /bin/bash bundle.sh bundle.ignore --watch
# 
# That script is responsible just for bundling
# 
# see TRANSPILATION.md
# 
export NODE_OPTIONS=""

IGNORE_FILE="${1}"

if [ ! -f "${IGNORE_FILE}" ]; then

  cat <<EEE

  >${IGNORE_FILE}< doesn't exist

EEE

  exit 1
fi

rm -rf dist/
mkdir -p dist/

find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
\) -prune \
-o -type f \
\( -name "*.entry.js" -o -name "*.entry.jsx" \) \
-print \
| node gitignore.js "${IGNORE_FILE}" \
| npx tsx bundle.ts "$@"

set -e

find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
    -o -name build \
\) -prune \
-o -type f \
-name "*.unit.ts" \
-print
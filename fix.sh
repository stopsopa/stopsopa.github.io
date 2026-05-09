

find . \( \
    -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
\) -prune -o -type f -name "*.html" -print0 | \
xargs -0 grep -El '<script[[:space:]]+src="/dist/[^"]+\.bundle\.js"></script>' | node fix.ts



find . \( \
    -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
\) -prune -o -type f -name "*.html" -print0 | \
xargs -0 grep -El '<link[[:space:]]+rel="stylesheet"[[:space:]]+href="/dist/[^"]+\.bundle\.css"[[:space:]]*/?>' | node fix.ts
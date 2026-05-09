
# 
# /bin/bash transpile.sh
# /bin/bash transpile.sh --watch
# 

find . -type d \( \
        -name node_modules \
        -o -name .git \
        -o -name coverage \
        -o -name noprettier \
    \) -prune \
    -o -type \
    f -name "*.ts" \
    -print \
    | NODE_OPTIONS="" npx tsx transpile.ts "$@"
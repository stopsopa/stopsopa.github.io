
# 
# /bin/bash transpile.sh
# /bin/bash transpile.sh --watch
# 

find . \( \
        -type d -name node_modules -prune -o \
        -type d -name .git -prune -o \
        -type d -name coverage -prune -o \
        -type d -name noprettier -prune \
    \) \
    -o \
    \( -type f \( -name "*.ts" \) -print \) \
    | NODE_OPTIONS="" npx tsx transpile.ts "$@"
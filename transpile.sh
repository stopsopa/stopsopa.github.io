
# 
# /bin/bash transpile.sh transpile.ignore
# /bin/bash transpile.sh transpile.ignore --watch
# /bin/bash transpile.sh
# /bin/bash transpile.sh --watch
# 
# That script is responsible just for transpiling
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
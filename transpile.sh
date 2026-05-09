
# 
# echo "file.ts" | /bin/bash transpile.sh transpile.ignore
# echo "file.ts" | /bin/bash transpile.sh transpile.ignore --watch
# echo "file.ts" | /bin/bash transpile.sh
# echo "file.ts" | /bin/bash transpile.sh --watch
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
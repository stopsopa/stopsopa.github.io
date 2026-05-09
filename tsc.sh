

# to find all ts files
find . \( \
        -type d -name node_modules -prune -o \
        -type d -name .git -prune -o \
        -type d -name coverage -prune -o \
        -type d -name noprettier -prune \
    \) \
    -o \
    \( -type f \( -name "*.ts" \) -print \)


NODE_OPTIONS= node tsc.ignore.ts "tsc.ignore" tsconfig.json tsc.ignore.tsconfig.json

npx tsc -p tsconfig.json
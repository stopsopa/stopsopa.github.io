

# to find all ts files
# find . \( \
#         -type d -name node_modules -prune -o \
#         -type d -name .git -prune -o \
#         -type d -name coverage -prune -o \
#         -type d -name noprettier -prune \
#     \) \
#     -o \
#     \( -type f \( -name "*.ts" \) -print \)

TSCONFIG=tsc.ignore.tsconfig.json

NODE_OPTIONS= node tsc.ignore.ts "tsc.ignore" tsconfig.json "${TSCONFIG}"

# typechecking more file
npx tsc -p tsconfig.json --noEmit

# # but transpiling only subset of files
# npx tsc -p ${TSCONFIG} "$@"
# 
# see TRANSPILATION.md
# 
# I had hope to use this script for typechecking and in another step add some excluding rules to 
# tsconfig.json and this way generating new typescript config tsc.ignore.tsconfig.json
# and with it use tsc for transpilation but eventually I've discovered that it as usual
# complains with:
#   Option 'allowImportingTsExtensions' can only be used when either 'noEmit' or 'emitDeclarationOnly' is set.ts
# when I remove "noEmit": true, in tsconfig.json
# so I will use esbuild.ts for transpilation then
# 
# So in conslusion, we will only use this for typechecking
# 

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

#NODE_OPTIONS= node tsc.ignore.ts "tsc.ignore" tsconfig.json "${TSCONFIG}"

# typechecking more file
npx tsc -p tsconfig.json --noEmit

# # but transpiling only subset of files
# npx tsc -p ${TSCONFIG} "$@"
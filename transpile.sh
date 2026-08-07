
# 
# see TRANSPILATION.md
# 
# /bin/bash transpile.sh transpile.ignore
# /bin/bash transpile.sh transpile.ignore --watch
# 
# That script is responsible just for transpiling
# 
export NODE_OPTIONS=""

if [ ! -f "${1}" ]; then

    # normally ${1} is transpile.ignore
    echo "${0} error: file ${1} doesn't exist"
    exit 1
fi

# There is one confusion here
# because transpile.ts transforms *.ts files into *.js files
# but I've designed it to return *.js but I think it is a mistake
# 
# I did that becasue I wanted to process output *.js files with 
# preamble.ts but I forgot that first I will 
# have to prettify *.ts file
# 
# I think good solution will be to create another 
# script which will generate *.js from *.ts and other way around
# but actually that could be done in oneliner

find . -type d \( \
       -name node_modules \
    -o -name .git \
    -o -name coverage \
    -o -name noprettier \
    -o -name .opencode \
\) -prune \
-o -type \
f -name "*.ts" \
-print \
| node gitignore.js transpile.ignore \
| /bin/bash ts.sh transpile.ts "$@" --forward-stdin-to-stdout \
| IN=js OUT=ts /bin/bash bash/file/extswap.sh \
| node transpile_prettier_pipe.ts --forward-stdin-to-stdout \
| IN=ts OUT=js /bin/bash bash/file/extswap.sh \
| node bash/node/preamble.ts transpile.preamble --forward-stdin-to-stdout \
| node bash/git/addToGitignore.ts .gitignore transpile_sh


set -e;

if [ "${1}" = "" ]; then
    echo "${0} error: specify script to run"
    
    exit 1
fi

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )" # for bash

RELATIVE="$(NODE_OPTIONS="" node --input-type module -e "import {resolve,relative} from 'path';process.stdout.write(relative(\"${_DIR}\",resolve(\"$(pwd)\",\"${1}\")))")"

cd "${_DIR}"

NODE_OPTIONS="" node node_modules/.bin/tsc -p tsconfig.check.json 
node --no-warnings=ExperimentalWarning --loader ts-node/esm "${RELATIVE}"
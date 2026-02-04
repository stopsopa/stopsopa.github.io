
_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

export NODE_OPTIONS=""

ROOT="${_DIR}"

# let's not enable it here
# because some scripts here will use node some only in CI
# and by fixing this export here additional logs will appear in CI mode
#           Debugger listening on ws://127.0.0.1:35133/beec5c79-0b8f-43c1-b83a-f9ebc185d9a9
#           For help, see: https://nodejs.org/en/docs/inspector
# let's individual sh files called from here decide if they need this export or not
# export NODE_OPTIONS="" 

set -e

if [ ! -f ".env" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

source ".env"

if [ ! -f ".env.sh" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

/bin/bash bash/exportsource.sh ".env"

eval "$(/bin/bash bash/exportsource.sh ".env")"

source ".env.sh"

if [ "${PROJECT_NAME}" = "" ]; then

    echo "env var PROJECT_NAME is not defined";

    exit 1
fi

if [ "${GITSTORAGE_CORE_REPOSITORY}" = "" ]; then

    echo "env var GITSTORAGE_CORE_REPOSITORY is not defined";

    exit 1
fi

if [ "${GITHUB_SOURCES_PREFIX}" = "" ]; then

    echo "env var GITHUB_SOURCES_PREFIX is not defined";

    exit 1
fi

if [ "${EXPOSE_EXTRA_ENV_VARIABLES}" = "" ]; then

    echo "env var EXPOSE_EXTRA_ENV_VARIABLES is not defined";

    exit 1
fi

mkdir -p public
cp node_modules/envprocessor/dist/esm/env.js public/env.js

# transpile all "module*.ts" right next in the same directoris but as *.js
node node_modules/.bin/tsc

node pages/portsregistry/lists/ports-generator.js

# call those together in this order vvv
time /bin/bash scripts/uglify.sh
time /bin/bash scripts/template.sh
# call those together in this order ^^^

# node libs/preprocessor.js
time node node_modules/.bin/envprocessor --maskEnv EXPOSE_EXTRA_ENV_VARIABLES --verbose --debug build/preprocessed.js public/preprocessed.js

time node esbuild-entries.js

time /bin/bash esbuild-node.sh

time /bin/bash .github/ytlinksfix.sh

# /bin/bash pages/kubernetes/compress.sh

time /bin/bash bash/substitute-variables-bash.sh gitstorage-core.sh -- \
  GITSTORAGE_CORE_REPOSITORY "${GITSTORAGE_CORE_REPOSITORY}" \
  PROD_SCHEMA "${PROD_SCHEMA}" \
  PROD_PORT "${PROD_PORT}" \
  PROD_HOSTNAME "${PROD_HOSTNAME}"

# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
time /bin/bash .github/urlwizzard.sh

# /bin/bash .github/toc-check.sh README.md 
node node_modules/.bin/markdown-toc -i README.md

time node node_modules/.bin/prettier --config prettier.config.cjs --write . 1> >(/bin/bash bash/dlogger.sh o prettier) 2> >(/bin/bash bash/dlogger.sh e prettier)

# this one after style_fix
# inject special blocking code
# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
time /bin/bash .github/clicksecure.sh

time /bin/bash .github/injector.sh

# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
time /bin/bash .github/sha384.sh

/bin/bash pages/typescript/defaults/getconfig.sh

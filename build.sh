
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

node pages/portsregistry/lists/ports-generator.js

# call those together in this order vvv
/bin/bash uglify.sh
/bin/bash template.sh
# call those together in this order ^^^

node libs/preprocessor.js

node node_modules/.bin/webpack

/bin/bash esbuild.sh

# /bin/bash remove-not-changed-builds.sh # not needed since I'm building and releasing that build in github actions
# /bin/bash pages/kubernetes/compress.sh

/bin/bash bash/substitute-variables-bash.sh gitstorage-core.sh -- \
  GITSTORAGE_CORE_REPOSITORY "${GITSTORAGE_CORE_REPOSITORY}" \
  PROD_SCHEMA "${PROD_SCHEMA}" \
  PROD_PORT "${PROD_PORT}" \
  PROD_HOSTNAME "${PROD_HOSTNAME}"

# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
/bin/bash .github/urlwizzard.sh

# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
/bin/bash .github/sha384.sh

node node_modules/.bin/prettier --config prettier.config.cjs --write . 1> >(/bin/bash bash/dlogger.sh o prettier) 2> >(/bin/bash bash/dlogger.sh e prettier)

# this one after style_fix
# inject special blocking code
# NOTICE: remember it will not process if --run not passed or CI env var is not present
# I'm deliberately suppressing error to continue if above is not provided for local dev environment
/bin/bash .github/clicksecure.sh

/bin/bash .github/injector.sh

/bin/bash pages/bash/xx/xx.inverse.postprocessor.sh

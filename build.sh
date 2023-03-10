
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
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

set -e
set -x

if [ ! -f "${ROOT}/.env" ]; then
  
  echo "${0} error: file ${ROOT}/.env doesn't exist"

  exit 1
fi

source "${ROOT}/.env"

if [ ! -f "${ROOT}/.env.sh" ]; then
  
  echo "${0} error: file ${ROOT}/.env doesn't exist"

  exit 1
fi

source "${ROOT}/.env.sh"

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

/bin/bash remove-not-changed-builds.sh
#/bin/bash pages/kubernetes/compress.sh

/bin/bash bash/substitute-variables-bash.sh gitstorage-core.sh -- \
  GITSTORAGE_CORE_REPOSITORY "${GITSTORAGE_CORE_REPOSITORY}" \
  PROD_SCHEMA "${PROD_SCHEMA}" \
  PROD_HOST "${PROD_HOST}"

make style_fix


#
# this test executing in order:
#   * unit tests
#   * attempt to kill api and vite server is any is running
#   * build vite
#   * run api server in production mode
#   * int tests
#   * e2e tests (in docker)
#   * attempt to kill api
# 
# If any of above actions will faile this script will exit with non zero exit code
#
# General purpose of this script is to have single script that once executed locally will
# prepare prod server and run all tests against it.
#   For example to make sure that git commit that you are about to push have not introduced regression
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

cd "${_DIR}"

ROOT="${_DIR}"

export NODE_OPTIONS="" 

if [ ! -f ".env" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

source ".env"

if [ ! -f ".env.sh" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

source ".env.sh"

function cleanup {

    /bin/bash .github/stop-server.sh
}

trap cleanup EXIT;

set -e
set -x

cleanup

/bin/bash build.sh

node server.js --flag "3_${FLAG}" & disown

sleep 1

cat <<EEE

    api server should be running now, testing healthcheck:    

EEE

TIMEOUT="2000" node .github/healtcheck.js

cat <<EEE

    INTEGRATION TESTS:

EEE

/bin/bash test.sh

cat <<EEE

    JASMINE TESTS:

EEE

NODE_API_PORT=4273 /bin/bash jasmine/test.sh --env .env -- --target docker

cat <<EEE

    E2E TESTS:

EEE

/bin/bash playwright.sh

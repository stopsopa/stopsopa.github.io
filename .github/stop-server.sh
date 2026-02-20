#
# this script is just designed to kill particular processes found in ps aux filtered with grep
# look at the very bottom of this script where exact grep sequences are specified with explanation what is supposed to be killed
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

ROOT="$(dirname "${_DIR}")"

cd "${ROOT}"

ROOT="$(pwd)"

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

source "${ROOT}/bash/proc/killv2.sh"

echo "attempt to kill server (grep "${FLAG}"):"
tryToKill "ps aux | grep "${FLAG}" | grep -v grep"

echo "attempt to kill dev mode (grep STOPSOPA_IO_FLAG):"
tryToKill "ps aux | grep STOPSOPA_IO_FLAG | grep -v grep"

echo "attempt to kill ci_server.sh (grep "${FLAG}"):"
tryToKill "ps aux | grep "3_${FLAG}" | grep -v grep"



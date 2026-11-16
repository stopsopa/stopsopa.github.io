# test 008: validation failure when path A does not exist
#
# Purpose:
# Tests that hardlink.ts checks if path A exists, and fails with an error when path A is missing.
#
# Expected result:
# hardlink.ts prints validation error for file A and exits with code 1.
#
# Usage:
# /bin/bash lab/hardlink/tests/008/test.sh
# NODE_OPTIONS= /bin/bash test.sh

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 008: validation failure when path A missing..."

rm -f "${_DIR}/missing_a.txt" "${_DIR}/b.txt"

if node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path A does not exist"
  exit 1
fi

echo "008 passed"

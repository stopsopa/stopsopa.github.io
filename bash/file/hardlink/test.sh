# main test runner for hardlink tests
#
# Purpose:
# Runs all hardlink test suites in lab/hardlink/tests/[0-9]*/test.sh sequentially.
# Exits with 0 if all pass, or 1 if any fail.
#
# Usage:
# /bin/bash bash/file/hardlink/hardlink/test.sh

GRAY="$(printf '\033[38;5;244m')"
BLACK="$(printf '\033[30m')"
RED="$(printf '\033[31m')"
GREEN="$(printf '\033[32m')"
YELLOW="$(printf '\033[33m')"
BLUE="$(printf '\033[34m')"
MAGENTA="$(printf '\033[35m')"
CYAN="$(printf '\033[36m')"
WHITE="$(printf '\033[37m')"
BOLD="$(printf '\033[1m')"
REVERSE="$(printf '\033[7m')"
RESET="$(printf '\033[0m')"

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

echo "Starting hardlink test suite..."

set -e

echo "${REVERSE}tests/001/test.sh${RESET}"
/bin/bash "${_DIR}/tests/001/test.sh"

echo "${REVERSE}tests/002/test.sh${RESET}"
/bin/bash "${_DIR}/tests/002/test.sh"

echo "${REVERSE}tests/003/test.sh${RESET}"
/bin/bash "${_DIR}/tests/003/test.sh"

echo "${REVERSE}tests/004/test.sh${RESET}"
/bin/bash "${_DIR}/tests/004/test.sh"

echo "${REVERSE}tests/005/test.sh${RESET}"
/bin/bash "${_DIR}/tests/005/test.sh"

echo "${REVERSE}tests/006/test.sh${RESET}"
/bin/bash "${_DIR}/tests/006/test.sh"

echo "${REVERSE}tests/007/test.sh${RESET}"
/bin/bash "${_DIR}/tests/007/test.sh"

echo "${REVERSE}tests/008/test.sh${RESET}"
/bin/bash "${_DIR}/tests/008/test.sh"

echo "${REVERSE}tests/009/test.sh${RESET}"
/bin/bash "${_DIR}/tests/009/test.sh"

echo "${REVERSE}tests/010/test.sh${RESET}"
/bin/bash "${_DIR}/tests/010/test.sh"

echo "${REVERSE}tests/011/test.sh${RESET}"
/bin/bash "${_DIR}/tests/011/test.sh"

echo "All hardlink tests passed!"

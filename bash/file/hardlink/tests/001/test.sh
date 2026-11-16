# test 001: basic creation of hardlink when B does not exist
#
# Purpose:
# Tests that hardlink.ts resolves relative to config.md directory by default,
# and creates a hardlink when target file B does not exist.
#
# Usage:
# /bin/bash bash/tests/001/test.sh

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

echo "Running 001: basic creation..."

# Cleanup & prep
rm -f "${_DIR}/b.txt"
echo "hello world" > "${_DIR}/a.txt"

node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md"

if [[ ! -f "${_DIR}/b.txt" ]]; then
  echo "${0} error: file B was not created"
  exit 1
fi

INODE_A="$(stat -f "%i" "${_DIR}/a.txt" 2>/dev/null || stat -c "%i" "${_DIR}/a.txt")"
INODE_B="$(stat -f "%i" "${_DIR}/b.txt" 2>/dev/null || stat -c "%i" "${_DIR}/b.txt")"

if [[ "${INODE_A}" != "${INODE_B}" ]]; then
  echo "${0} error: inode mismatch between A (${INODE_A}) and B (${INODE_B})"
  exit 1
fi

# Cleanup
rm -f "${_DIR}/a.txt" "${_DIR}/b.txt"

echo "001 passed"

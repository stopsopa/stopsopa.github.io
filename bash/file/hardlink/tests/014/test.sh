# test 014: validation failure when parent path of file B is a file, not a directory
#
# Purpose:
# When the parent of file B (or its nearest existing ancestor, when parent dirs still have to be created)
# is a regular file, neither mkdir nor link can succeed - validation has to catch it.
#
# Steps:
#   1. blocker.txt is a regular file
#   2. config.md has two lines:
#      - a.txt -> blocker.txt/b.txt        (existing parent is a file)
#      - a.txt -> blocker.txt/deep/b.txt   (parent missing, nearest existing ancestor is a file)
#   3. expect exit 1 and "is not a directory" error reported for both lines
#
# Usage:
# /bin/bash bash/file/hardlink/tests/014/test.sh

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

echo "Running 014: validation failure when parent path of file B is a file..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/blocker.txt"
}
trap cleanup EXIT
cleanup

# Prep
echo "content a" > "${_DIR}/a.txt"
echo "i am a file, not a directory" > "${_DIR}/blocker.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when parent path of file B is a file"
  exit 1
fi

COUNT="$(echo "${OUTPUT}" | grep -c "is not a directory")"
if [ "${COUNT}" != "2" ]; then
  echo "${0} error: expected 'is not a directory' error for both lines, got ${COUNT}"
  exit 1
fi

echo "014 passed"

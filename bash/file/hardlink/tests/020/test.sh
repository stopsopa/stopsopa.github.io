# test 020: directory pair - path A ends with "/" but is a regular file
#
# Expected result:
#   - exit 1 with "Path is not a directory" error
#   - symlink B not created
#
# Usage:
# /bin/bash bash/file/hardlink/tests/020/test.sh

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

echo "Running 020: directory pair - path A is a file..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/link"
}
trap cleanup EXIT
cleanup

# Prep
echo "content a" > "${_DIR}/a.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path A ending with '/' is a file"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "Path is not a directory"; then
  echo "${0} error: expected 'Path is not a directory' error"
  exit 1
fi

if [ -L "${_DIR}/link" ] || [ -e "${_DIR}/link" ]; then
  echo "${0} error: symlink B should not be created"
  exit 1
fi

echo "020 passed"

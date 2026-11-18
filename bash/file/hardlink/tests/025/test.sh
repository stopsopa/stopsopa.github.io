# test 025: mixed pair - path B ends with "/" but path A doesn't
#
# Purpose:
# Most likely operator forgot "/" at the end of path A. Instead of guessing, report error.
#
# Expected result:
#   - exit 1 with 'ends with "/"' error
#   - nothing created
#
# Usage:
# /bin/bash bash/file/hardlink/tests/025/test.sh

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

echo "Running 025: mixed pair - path B ends with '/' but path A doesn't..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/out_dir"
}
trap cleanup EXIT
cleanup

# Prep
echo "content a" > "${_DIR}/a.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 for mixed pair"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q 'ends with "/"'; then
  echo "${0} error: expected 'ends with \"/\"' error"
  exit 1
fi

if [ -e "${_DIR}/out_dir" ]; then
  echo "${0} error: nothing should be created for mixed pair"
  exit 1
fi

echo "025 passed"

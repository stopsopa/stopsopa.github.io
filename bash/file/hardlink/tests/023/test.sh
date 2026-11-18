# test 023: directory pair - path B is a regular file
#
# Expected result:
#   - exit 1 with "not a symlink" error
#   - file B left untouched
#
# Usage:
# /bin/bash bash/file/hardlink/tests/023/test.sh

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

echo "Running 023: directory pair - path B is a regular file..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/link"
}
trap cleanup EXIT
cleanup

# Prep
mkdir -p "${_DIR}/src_dir"
echo "i am a file" > "${_DIR}/link"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is a regular file"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "not a symlink"; then
  echo "${0} error: expected 'not a symlink' error"
  exit 1
fi

if [ -L "${_DIR}/link" ] || [ ! -f "${_DIR}/link" ]; then
  echo "${0} error: file B should stay untouched"
  exit 1
fi

echo "023 passed"

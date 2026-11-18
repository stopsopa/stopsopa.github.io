# test 015: directory pair - directory A exists, symlink B is created
#
# Purpose:
# Path A ends with "/" so the pair links directories. Symlink B doesn't exist yet,
# neither do its parent directories (out/deep) - they have to be created.
#
# Expected result:
#   - exit 0
#   - out/deep/link is a symlink with relative target "../../src_dir"
#   - content of directory A is reachable through the symlink
#
# Usage:
# /bin/bash bash/file/hardlink/tests/015/test.sh

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

echo "Running 015: directory pair - symlink B is created (with missing parent directories)..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/out"
}
trap cleanup EXIT
cleanup

# Prep
mkdir -p "${_DIR}/src_dir"
echo "inside" > "${_DIR}/src_dir/file.txt"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should succeed creating symlink B to directory A"
  exit 1
fi

if [ ! -L "${_DIR}/out/deep/link" ]; then
  echo "${0} error: out/deep/link should be a symlink"
  exit 1
fi

TARGET="$(readlink "${_DIR}/out/deep/link")"
if [ "${TARGET}" != "../../src_dir" ]; then
  echo "${0} error: expected relative symlink target '../../src_dir', got '${TARGET}'"
  exit 1
fi

if [ ! -f "${_DIR}/out/deep/link/file.txt" ]; then
  echo "${0} error: content of directory A is not reachable through symlink B"
  exit 1
fi

echo "015 passed"

# test 021: directory pair with --absolute-symlink-dir
#
# Purpose:
# With --absolute-symlink-dir symlink B has to contain absolute path to directory A.
# Second run with the same flag must just skip.
#
# Expected result:
#   - run 1: exit 0, readlink out/link == "<test dir>/src_dir"
#   - run 2: exit 0, "Already linked"
#
# Usage:
# /bin/bash bash/file/hardlink/tests/021/test.sh

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

echo "Running 021: directory pair with --absolute-symlink-dir..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/out"
}
trap cleanup EXIT
cleanup

# Prep
mkdir -p "${_DIR}/src_dir"

# run 1: create absolute symlink
if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --absolute-symlink-dir 2>&1; then
  echo "${0} error: hardlink.ts should succeed creating absolute symlink"
  exit 1
fi

TARGET="$(readlink "${_DIR}/out/link")"
if [ "${TARGET}" != "${_DIR}/src_dir" ]; then
  echo "${0} error: expected absolute symlink target '${_DIR}/src_dir', got '${TARGET}'"
  exit 1
fi

# run 2: same flag again - should skip
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --absolute-symlink-dir 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "Already linked"; then
  echo "${0} error: second run with --absolute-symlink-dir should report 'Already linked'"
  exit 1
fi

echo "021 passed"

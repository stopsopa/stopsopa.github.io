# test 016: directory pair - symlink B already correct, skip
#
# Purpose:
# Symlink B already exists and contains exactly the expected target ("../src_dir").
# Nothing should be changed.
#
# Expected result:
#   - exit 0
#   - output contains "Already linked" and no "CHANGED"
#   - symlink target unchanged
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/016/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 016: directory pair - symlink B already correct..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/out"
}
trap cleanup EXIT
cleanup

# Prep: correct symlink already in place
mkdir -p "${_DIR}/src_dir" "${_DIR}/out"
ln -s ../src_dir "${_DIR}/out/link"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ]; then
  echo "${0} error: hardlink.ts should succeed when symlink B is already correct"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "Already linked"; then
  echo "${0} error: expected 'Already linked' in output"
  exit 1
fi

if echo "${OUTPUT}" | grep -q "CHANGED"; then
  echo "${0} error: nothing should be CHANGED when symlink B is already correct"
  exit 1
fi

TARGET="$(readlink "${_DIR}/out/link")"
if [ "${TARGET}" != "../src_dir" ]; then
  echo "${0} error: symlink target changed, got '${TARGET}'"
  exit 1
fi

echo "016 passed"

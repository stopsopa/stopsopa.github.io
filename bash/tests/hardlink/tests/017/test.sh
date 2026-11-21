# test 017: directory pair - symlink B points to wrong place
#
# Purpose:
# Symlink B exists but points to other_dir instead of src_dir.
# It is not our symlink to fix silently - operator has to decide.
#
# Expected result:
#   - exit 1 with "but expected" error
#   - symlink B left untouched (still points to other_dir)
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/017/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 017: directory pair - symlink B points to wrong place..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/other_dir" "${_DIR}/link"
}
trap cleanup EXIT
cleanup

# Prep: symlink pointing to other directory
mkdir -p "${_DIR}/src_dir" "${_DIR}/other_dir"
ln -s other_dir "${_DIR}/link"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when symlink B points to wrong place"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "but expected"; then
  echo "${0} error: expected 'but expected' error for wrong symlink B"
  exit 1
fi

TARGET="$(readlink "${_DIR}/link")"
if [ "${TARGET}" != "other_dir" ]; then
  echo "${0} error: symlink B should stay untouched, got '${TARGET}'"
  exit 1
fi

echo "017 passed"

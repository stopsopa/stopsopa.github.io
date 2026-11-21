# test 022: directory pair - symlink B resolves to A but in other form (absolute -> relative)
#
# Purpose:
# Symlink B already points to directory A, but with absolute path (e.g. created earlier with --absolute-symlink-dir).
# Running without the flag should replace it with relative form, then a next run should just skip.
#
# Expected result:
#   - run 1: exit 0, "CHANGED", readlink link == "src_dir"
#   - run 2: exit 0, "Already linked"
#   - run 3 (--absolute-symlink-dir, other way around): exit 0, "CHANGED", readlink link == "<test dir>/src_dir"
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/022/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 022: directory pair - symlink form change (absolute -> relative)..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/link"
}
trap cleanup EXIT
cleanup

# Prep: absolute symlink pointing to directory A
mkdir -p "${_DIR}/src_dir"
ln -s "${_DIR}/src_dir" "${_DIR}/link"

# run 1: should replace with relative form
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "CHANGED"; then
  echo "${0} error: hardlink.ts should replace absolute symlink with relative one and report CHANGED"
  exit 1
fi

TARGET="$(readlink "${_DIR}/link")"
if [ "${TARGET}" != "src_dir" ]; then
  echo "${0} error: expected relative symlink target 'src_dir', got '${TARGET}'"
  exit 1
fi

# run 2: should skip
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "Already linked"; then
  echo "${0} error: second run should report 'Already linked'"
  exit 1
fi

# run 3: other way around - with --absolute-symlink-dir relative symlink should become absolute
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --absolute-symlink-dir 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "CHANGED"; then
  echo "${0} error: run with --absolute-symlink-dir should replace relative symlink with absolute one and report CHANGED"
  exit 1
fi

TARGET="$(readlink "${_DIR}/link")"
if [ "${TARGET}" != "${_DIR}/src_dir" ]; then
  echo "${0} error: expected absolute symlink target '${_DIR}/src_dir', got '${TARGET}'"
  exit 1
fi

echo "022 passed"

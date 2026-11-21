# test 018: directory pair - path B is a real directory
#
# Purpose:
# Path B exists as a real directory (not a symlink). We have no way to compare it with directory A,
# so it must not be replaced.
#
# Expected result:
#   - exit 1 with "no way to compare" error
#   - real_dir still a real directory with its content
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/018/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 018: directory pair - path B is a real directory..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/real_dir"
}
trap cleanup EXIT
cleanup

# Prep
mkdir -p "${_DIR}/src_dir" "${_DIR}/real_dir"
echo "keep me" > "${_DIR}/real_dir/file.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is a real directory"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "no way to compare"; then
  echo "${0} error: expected 'no way to compare' error when path B is a real directory"
  exit 1
fi

if [ -L "${_DIR}/real_dir" ] || [ ! -f "${_DIR}/real_dir/file.txt" ]; then
  echo "${0} error: real_dir should stay untouched"
  exit 1
fi

echo "018 passed"

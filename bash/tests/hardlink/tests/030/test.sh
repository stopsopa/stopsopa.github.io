# test 030: path B is a broken symlink
#
# Purpose:
# Broken symlink "doesn't exist" for existsSync, so it used to pass validation as missing file B
# and then link() failed with EEXIST in the middle of execution phase - after earlier pairs were already linked.
# It has to be caught in validation phase.
#
# Expected result:
#   - exit 1 with "broken symlink" error
#   - symlink B untouched
#   - first pair (valid one) not executed
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/030/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 030: path B is a broken symlink..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/first_a.txt" "${_DIR}/first_b.txt" "${_DIR}/a.txt" "${_DIR}/b.txt"
}
trap cleanup EXIT
cleanup

echo "content first" > "${_DIR}/first_a.txt"
echo "content 030" > "${_DIR}/a.txt"
ln -s does_not_exist.txt "${_DIR}/b.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is a broken symlink"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "broken symlink"; then
  echo "${0} error: expected 'broken symlink' error"
  exit 1
fi

if [ ! -L "${_DIR}/b.txt" ] || [ "$(readlink "${_DIR}/b.txt")" != "does_not_exist.txt" ]; then
  echo "${0} error: symlink B should stay untouched"
  exit 1
fi

if [ -e "${_DIR}/first_b.txt" ]; then
  echo "${0} error: first pair should not be executed when validation of other pair fails"
  exit 1
fi

echo "030 passed"

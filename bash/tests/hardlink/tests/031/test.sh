# test 031: path B is a symlink leading to a file (file pair)
#
# Purpose:
# Symlink B pointing to file A leads to the inode of A, so it used to be reported as "Already linked",
# but it is not a hardlink. It has to be replaced with real hardlink.
#
# Steps:
#   1. B is symlink to A              -> CHANGED "Replaced symlink B", B is regular file with inode of A
#   2. run again                      -> "Already linked", nothing CHANGED
#   3. B is symlink to other file with different content -> exit 1 "does not match", symlink untouched
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/031/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 031: path B is a symlink leading to a file..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/b.txt" "${_DIR}/other.txt"
}
trap cleanup EXIT
cleanup

echo "content 031" > "${_DIR}/a.txt"
ln -s a.txt "${_DIR}/b.txt"

# step 1
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "Replaced symlink B"; then
  echo "${0} error: symlink B pointing to file A should be replaced with hardlink"
  exit 1
fi

if [ -L "${_DIR}/b.txt" ]; then
  echo "${0} error: b.txt should not be a symlink anymore"
  exit 1
fi

if [ "$(inode "${_DIR}/a.txt")" != "$(inode "${_DIR}/b.txt")" ]; then
  echo "${0} error: inode mismatch between a.txt and b.txt"
  exit 1
fi

# step 2
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "Already linked" || echo "${OUTPUT}" | grep -q "CHANGED"; then
  echo "${0} error: second run should report 'Already linked' and nothing CHANGED"
  exit 1
fi

# step 3
rm -f "${_DIR}/b.txt"
echo "different content" > "${_DIR}/other.txt"
ln -s other.txt "${_DIR}/b.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ] || ! echo "${OUTPUT}" | grep -q "does not match"; then
  echo "${0} error: symlink B leading to file with different content should fail with 'does not match'"
  exit 1
fi

if [ ! -L "${_DIR}/b.txt" ] || [ "$(readlink "${_DIR}/b.txt")" != "other.txt" ]; then
  echo "${0} error: symlink B should stay untouched"
  exit 1
fi

echo "031 passed"

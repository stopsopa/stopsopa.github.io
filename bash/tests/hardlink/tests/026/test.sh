# test 026: --gitignore entry without "/" is anchored with leading "/"
#
# Purpose:
# File B lives next to .gitignore, so its relative path is just "b.txt".
# Such entry (no "/" inside) would ignore b.txt on EVERY level below gitignore.
# hardlink.ts has to write "/b.txt" instead.
#
# Steps:
#   1. run with --gitignore -> "/b.txt" between delimiters (and not "b.txt")
#   2. run again -> "No changes", entry present exactly once
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/026/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 026: gitignore entry without '/' gets anchored..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/b.txt" "${_DIR}/.gitignore"
}
trap cleanup EXIT
cleanup

echo "content 026" > "${_DIR}/a.txt"
printf '# hardlink.ts vvv\n# hardlink.ts ^^^\n' > "${_DIR}/.gitignore"

# run 1
if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --gitignore "${_DIR}/.gitignore" 2>&1; then
  echo "${0} error: hardlink.ts should succeed"
  exit 1
fi

EXPECTED="$(printf '# hardlink.ts vvv\n/b.txt\n# hardlink.ts ^^^')"
ACTUAL="$(cat "${_DIR}/.gitignore")"
if [ "${ACTUAL}" != "${EXPECTED}" ]; then
  cat <<EEE
${0} error: gitignore mismatch
Expected:
>${EXPECTED}<
Actual:
>${ACTUAL}<
EEE
  exit 1
fi

# run 2
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --gitignore "${_DIR}/.gitignore" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "No changes"; then
  echo "${0} error: second run should report 'No changes' for gitignore"
  exit 1
fi

COUNT="$(grep -cx "/b.txt" "${_DIR}/.gitignore")"
if [ "${COUNT}" != "1" ]; then
  echo "${0} error: '/b.txt' should be in gitignore exactly once, got ${COUNT}"
  exit 1
fi

echo "026 passed"

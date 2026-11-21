# test 028: the same path B used by two pairs with different path A
#
# Purpose:
# Only one of the pairs can win. Before this check the second pair replaced file B created
# by the first one without any content check (B didn't exist yet during validation).
#
# Steps:
#   1. a1.txt and a2.txt with different content -> exit 1 with "more than one pair", B not created
#   2. the same line twice (the same A and the same B) is fine -> exit 0, hardlink created
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/028/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 028: the same path B used by two pairs..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a1.txt" "${_DIR}/a2.txt" "${_DIR}/out" "${_DIR}/same.md"
}
trap cleanup EXIT
cleanup

echo "content one" > "${_DIR}/a1.txt"
echo "content two" > "${_DIR}/a2.txt"

# step 1
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is used twice"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "more than one pair"; then
  echo "${0} error: expected 'more than one pair' error"
  exit 1
fi

if [ -e "${_DIR}/out" ]; then
  echo "${0} error: nothing should be created when validation fails"
  exit 1
fi

# step 2
printf './a1.txt -> ./out/b.txt\n[again](./a1.txt) -> out/b.txt\n' > "${_DIR}/same.md"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/same.md" 2>&1; then
  echo "${0} error: identical pair repeated twice should not be an error"
  exit 1
fi

if [ "$(inode "${_DIR}/a1.txt")" != "$(inode "${_DIR}/out/b.txt")" ]; then
  echo "${0} error: inode mismatch between a1.txt and out/b.txt"
  exit 1
fi

echo "028 passed"

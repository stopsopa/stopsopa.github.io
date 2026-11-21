# test 032: hardlink.ts launched from path with spaces and through a symlink
#
# Purpose:
# "Am I the main script" check used URL.pathname which stays percent-encoded ("dir%20with%20space"),
# so from a path with spaces script silently did nothing and exited 0. Same when launched through a symlink
# (node resolves real path of main module, argv[1] keeps the symlinked one).
#
# Steps:
#   1. copy of hardlink.ts inside "dir with space/" -> hardlink created
#   2. symlink to hardlink.ts                        -> "Already linked" printed (script really ran)
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/032/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 032: script launched from path with spaces and through a symlink..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/b.txt" "${_DIR}/dir with space" "${_DIR}/link_to_hardlink.ts"
}
trap cleanup EXIT
cleanup

echo "content 032" > "${_DIR}/a.txt"

# step 1
mkdir -p "${_DIR}/dir with space"
cp "${_ROOT}/bash/hardlink.ts" "${_DIR}/dir with space/hardlink.ts"

if ! node "${_DIR}/dir with space/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts launched from path with spaces should succeed"
  exit 1
fi

if [ ! -f "${_DIR}/b.txt" ] || [ "$(inode "${_DIR}/a.txt")" != "$(inode "${_DIR}/b.txt")" ]; then
  echo "${0} error: hardlink.ts launched from path with spaces did nothing - b.txt is not a hardlink to a.txt"
  exit 1
fi

# step 2
ln -s "${_ROOT}/bash/hardlink.ts" "${_DIR}/link_to_hardlink.ts"

OUTPUT="$(node "${_DIR}/link_to_hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "Already linked"; then
  echo "${0} error: hardlink.ts launched through a symlink should run and report 'Already linked'"
  exit 1
fi

echo "032 passed"

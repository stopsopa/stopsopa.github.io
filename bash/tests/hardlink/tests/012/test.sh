# test 012: validation failure when file A and file B are on different filesystems
#
# Purpose:
# Hardlinks cannot cross filesystems (EXDEV). hardlink.ts must catch it in the validation phase,
# before anything is changed. Covers both cases: file B doesn't exist yet, and file B exists with identical content.
# In the second case file B must stay untouched (previously B was removed first and then linking failed - B was lost).
#
# Steps:
#   1. find/create a directory on a different filesystem:
#      - /dev/shm (linux tmpfs) if it is on a different device than this test directory
#      - otherwise a small ramdisk via hdiutil (macOS, no sudo needed), detached at the end
#      - otherwise the test is SKIPPED (exit 0)
#   2. symlink ./other -> that directory, so config.md can stay static (a.txt -> other/b.txt)
#   3. run with B missing -> expect exit 1 and "different filesystems" error
#   4. create B with the same content -> run again -> expect exit 1, same error, and B still exists
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/012/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 012: validation failure when file A and file B are on different filesystems..."

OTHER_DIR=""
RAMDISK=""

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -f "${_DIR}/a.txt" "${_DIR}/other"
  if [ -n "${OTHER_DIR}" ]; then
    rm -f "${OTHER_DIR}/b.txt"
  fi
  if [ -n "${RAMDISK}" ]; then
    hdiutil detach "${RAMDISK}" >/dev/null 2>&1
  fi
}
trap cleanup EXIT

# exit 0 when two given paths are on different devices
different_device() {
  node -e 'const fs = require("fs"); process.exit(fs.statSync(process.argv[1]).dev === fs.statSync(process.argv[2]).dev ? 1 : 0)' "${1}" "${2}"
}

if [ -d /dev/shm ] && [ -w /dev/shm ] && different_device "${_DIR}" /dev/shm; then
  OTHER_DIR="/dev/shm"
elif command -v hdiutil >/dev/null 2>&1; then
  RAMDISK="$(hdiutil attach -nomount ram://8192 2>/dev/null | awk '{print $1}')"
  if [ -n "${RAMDISK}" ] && diskutil erasevolume HFS+ "hardlinktest012" "${RAMDISK}" >/dev/null 2>&1; then
    OTHER_DIR="$(diskutil info "${RAMDISK}" | awk -F': *' '/Mount Point/ {print $2}')"
  fi
fi

if [ -z "${OTHER_DIR}" ]; then
  echo "012 SKIPPED: no directory on a different filesystem available"
  exit 0
fi

# Prep: a.txt here, ./other -> directory on other filesystem
echo "content a" > "${_DIR}/a.txt"
rm -f "${_DIR}/other" "${OTHER_DIR}/b.txt"
ln -s "${OTHER_DIR}" "${_DIR}/other"

# run 1: file B doesn't exist yet
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when file B (missing) would land on a different filesystem"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "different filesystems"; then
  echo "${0} error: expected 'different filesystems' error when file B is missing"
  exit 1
fi

# run 2: file B exists with identical content
echo "content a" > "${OTHER_DIR}/b.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when existing file B is on a different filesystem"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "different filesystems"; then
  echo "${0} error: expected 'different filesystems' error when file B exists"
  exit 1
fi

if [ ! -f "${OTHER_DIR}/b.txt" ]; then
  echo "${0} error: file B was removed - it must stay untouched when validation fails"
  exit 1
fi

echo "012 passed"

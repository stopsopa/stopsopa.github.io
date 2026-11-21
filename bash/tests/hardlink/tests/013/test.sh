# test 013: permission to replace file B is decided by its parent directory, not by file B itself
#
# Purpose:
# Removing/replacing file B is an operation on the directory containing it.
# Write permission on file B itself is irrelevant.
#
# Steps:
#   1. file B read-only (444) inside writable directory, same content as A
#      -> expect success and A, B sharing the same inode
#   2. file B writable but its directory read-only (555), same content as A
#      -> expect exit 1 with "is not writable" error
#      (skipped when running as root, since root ignores permissions)
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/013/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 013: parent directory decides if file B can be replaced..."

# remove everything this test created (also when it fails midway)
cleanup() {
  chmod 755 "${_DIR}/dir" 2>/dev/null
  rm -rf "${_DIR}/a.txt" "${_DIR}/dir"
}
trap cleanup EXIT
cleanup

# step 1: read-only file B in writable directory -> should succeed
echo "content a" > "${_DIR}/a.txt"
mkdir -p "${_DIR}/dir"
echo "content a" > "${_DIR}/dir/b.txt"
chmod 444 "${_DIR}/dir/b.txt"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should succeed replacing read-only file B inside writable directory"
  exit 1
fi

INODE_A="$(ls -i "${_DIR}/a.txt" | awk '{print $1}')"
INODE_B="$(ls -i "${_DIR}/dir/b.txt" | awk '{print $1}')"

if [ "${INODE_A}" != "${INODE_B}" ]; then
  echo "${0} error: inode mismatch after replacing read-only file B: A=${INODE_A} B=${INODE_B}"
  exit 1
fi

# step 2: writable file B in read-only directory -> should fail validation
if [ "$(id -u)" = "0" ]; then
  echo "013 step 2 SKIPPED: running as root, permissions are not enforced"
else
  rm -f "${_DIR}/dir/b.txt"
  echo "content a" > "${_DIR}/dir/b.txt"
  chmod 555 "${_DIR}/dir"

  OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
  STATUS="${?}"
  echo "${OUTPUT}"

  if [ "${STATUS}" = "0" ]; then
    echo "${0} error: hardlink.ts should have exited with code 1 when parent directory of file B is read-only"
    exit 1
  fi

  if ! echo "${OUTPUT}" | grep -q "is not writable"; then
    echo "${0} error: expected 'is not writable' error for read-only parent directory of file B"
    exit 1
  fi
fi

echo "013 passed"

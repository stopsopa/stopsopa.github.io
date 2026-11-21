# test 002: replace existing file with matching content with hardlink
#
# Purpose:
# Tests that hardlink.ts checks if existing file B has same content,
# removes it, and replaces it with a hardlink to file A. Also tests nested directory creation.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/002/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 002: replace identical file with hardlink..."

# Cleanup & prep
rm -rf "${_DIR}/src" "${_DIR}/dest"
mkdir -p "${_DIR}/src" "${_DIR}/dest"

echo "same content 123" > "${_DIR}/src/a.txt"
echo "same content 123" > "${_DIR}/dest/b.txt"

INODE_A_PRE="$(stat -f "%i" "${_DIR}/src/a.txt" 2>/dev/null || stat -c "%i" "${_DIR}/src/a.txt")"
INODE_B_PRE="$(stat -f "%i" "${_DIR}/dest/b.txt" 2>/dev/null || stat -c "%i" "${_DIR}/dest/b.txt")"

if [[ "${INODE_A_PRE}" == "${INODE_B_PRE}" ]]; then
  echo "${0} error: inodes should differ before test"
  exit 1
fi

node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md"

INODE_A_POST="$(stat -f "%i" "${_DIR}/src/a.txt" 2>/dev/null || stat -c "%i" "${_DIR}/src/a.txt")"
INODE_B_POST="$(stat -f "%i" "${_DIR}/dest/b.txt" 2>/dev/null || stat -c "%i" "${_DIR}/dest/b.txt")"

if [[ "${INODE_A_POST}" != "${INODE_B_POST}" ]]; then
  echo "${0} error: inodes should match after test"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/src" "${_DIR}/dest"

echo "002 passed"

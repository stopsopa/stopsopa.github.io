# test 006: config.md with --pwd <path> pointing to custom external directory
#
# Purpose:
# Tests that passing --pwd [explicit path] resolves all paths relative to that explicit path,
# regardless of current working directory or where config.md is stored.
#
# Expected result:
# src_ext.txt and dest_ext.txt are found and linked inside explicit_dir,
# and hardlink inode check succeeds.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/006/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 006: --pwd with explicit directory..."

# Setup custom explicit directory
rm -rf "${_DIR}/explicit_dir"
mkdir -p "${_DIR}/explicit_dir"
echo "custom data 006" > "${_DIR}/explicit_dir/src_ext.txt"

node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --pwd "${_DIR}/explicit_dir"

if [[ ! -f "${_DIR}/explicit_dir/dest_ext.txt" ]]; then
  echo "${0} error: dest_ext.txt was not created in explicit_dir"
  rm -rf "${_DIR}/explicit_dir"
  exit 1
fi

INODE_A="$(stat -f "%i" "${_DIR}/explicit_dir/src_ext.txt" 2>/dev/null || stat -c "%i" "${_DIR}/explicit_dir/src_ext.txt")"
INODE_B="$(stat -f "%i" "${_DIR}/explicit_dir/dest_ext.txt" 2>/dev/null || stat -c "%i" "${_DIR}/explicit_dir/dest_ext.txt")"

if [[ "${INODE_A}" != "${INODE_B}" ]]; then
  echo "${0} error: inode mismatch in 006"
  rm -rf "${_DIR}/explicit_dir"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/explicit_dir"

echo "006 passed"

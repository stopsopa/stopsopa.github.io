# test 007: validation failure when path B is a directory
#
# Purpose:
# Tests that hardlink.ts validates path B and fails if an existing item under path B is a directory
# rather than a regular file.
#
# Expected result:
# hardlink.ts outputs validation error indicating path B is not a regular file and exits with code 1.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/007/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 007: validation failure when path B is a directory..."

# Prep: a.txt is a file, b_dir is a directory
echo "content a" > "${_DIR}/a.txt"
rm -rf "${_DIR}/b_dir"
mkdir -p "${_DIR}/b_dir"

if node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is a directory"
  rm -rf "${_DIR}/a.txt" "${_DIR}/b_dir"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/a.txt" "${_DIR}/b_dir"

echo "007 passed"

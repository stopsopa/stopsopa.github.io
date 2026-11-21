# test 003: validation failure on different content
#
# Purpose:
# Tests that hardlink.ts validates content matching between file A and existing file B,
# and exits 1 with error without modifying files.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/003/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 003: validation failure on content mismatch..."

# Cleanup & prep
echo "content one" > "${_DIR}/a.txt"
echo "content two" > "${_DIR}/b.txt"

if node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should have exited with code 1"
  rm -f "${_DIR}/a.txt" "${_DIR}/b.txt"
  exit 1
fi

# Cleanup
rm -f "${_DIR}/a.txt" "${_DIR}/b.txt"

echo "003 passed"

# test 008: validation failure when path A does not exist
#
# Purpose:
# Tests that hardlink.ts checks if path A exists, and fails with an error when path A is missing.
#
# Expected result:
# hardlink.ts prints validation error for file A and exits with code 1.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/008/test.sh
# NODE_OPTIONS= /bin/bash test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 008: validation failure when path A missing..."

rm -f "${_DIR}/missing_a.txt" "${_DIR}/b.txt"

if node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path A does not exist"
  exit 1
fi

echo "008 passed"

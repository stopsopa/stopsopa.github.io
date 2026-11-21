# test 019: directory pair - directory A doesn't exist
#
# Expected result:
#   - exit 1 with "Directory does not exist" error
#   - symlink B not created
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/019/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 019: directory pair - directory A doesn't exist..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/missing_dir" "${_DIR}/link"
}
trap cleanup EXIT
cleanup

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when directory A doesn't exist"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "Directory does not exist"; then
  echo "${0} error: expected 'Directory does not exist' error"
  exit 1
fi

if [ -L "${_DIR}/link" ] || [ -e "${_DIR}/link" ]; then
  echo "${0} error: symlink B should not be created"
  exit 1
fi

echo "019 passed"

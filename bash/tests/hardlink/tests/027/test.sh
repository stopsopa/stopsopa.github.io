# test 027: --gitignore - path B outside of the directory of gitignore
#
# Purpose:
# .gitignore lives in sub/ but file B lands in out/ (sibling directory).
# Entry would be "../out/b.txt" - gitignore can't match anything above its own directory.
# It has to be reported in validation phase, before anything is changed.
#
# Expected result:
#   - exit 1 with "outside of the directory of gitignore" error
#   - file B not created, gitignore untouched
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/027/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 027: path B outside of the directory of gitignore..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/out" "${_DIR}/sub"
}
trap cleanup EXIT
cleanup

echo "content 027" > "${_DIR}/a.txt"
mkdir -p "${_DIR}/sub"
printf 'node_modules/\n' > "${_DIR}/sub/.gitignore"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --gitignore "${_DIR}/sub/.gitignore" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ]; then
  echo "${0} error: hardlink.ts should have exited with code 1 when path B is outside of gitignore directory"
  exit 1
fi

if ! echo "${OUTPUT}" | grep -q "outside of the directory of gitignore"; then
  echo "${0} error: expected 'outside of the directory of gitignore' error"
  exit 1
fi

if [ -e "${_DIR}/out" ]; then
  echo "${0} error: nothing should be created when validation fails"
  exit 1
fi

if [ "$(cat "${_DIR}/sub/.gitignore")" != "node_modules/" ]; then
  echo "${0} error: gitignore should stay untouched"
  exit 1
fi

echo "027 passed"

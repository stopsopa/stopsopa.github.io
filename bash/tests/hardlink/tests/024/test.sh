# test 024: directory pair with --gitignore
#
# Purpose:
# Symlink B has to be added to gitignore like file B - as "out/link" without trailing "/"
# (git sees symlink as a file, "out/link/" would not match it).
#
# Steps:
#   1. .gitignore with delimiters, run with --gitignore -> "out/link" inserted between delimiters
#   2. run again -> "No changes", entry present exactly once
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/024/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 024: directory pair with --gitignore..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/src_dir" "${_DIR}/out" "${_DIR}/.gitignore"
}
trap cleanup EXIT
cleanup

# Prep
mkdir -p "${_DIR}/src_dir"
printf '# hardlink.ts vvv\n# hardlink.ts ^^^\n' > "${_DIR}/.gitignore"

# run 1
if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --gitignore "${_DIR}/.gitignore" 2>&1; then
  echo "${0} error: hardlink.ts should succeed with --gitignore for directory pair"
  exit 1
fi

if [ ! -L "${_DIR}/out/link" ]; then
  echo "${0} error: out/link should be a symlink"
  exit 1
fi

# entry has to be between delimiters (second line)
LINE2="$(sed -n '2p' "${_DIR}/.gitignore")"
if [ "${LINE2}" != "out/link" ]; then
  echo "${0} error: expected 'out/link' between delimiters, got:"
  cat "${_DIR}/.gitignore"
  exit 1
fi

# run 2
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --gitignore "${_DIR}/.gitignore" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "No changes"; then
  echo "${0} error: second run should report 'No changes' for gitignore"
  exit 1
fi

COUNT="$(grep -cx "out/link" "${_DIR}/.gitignore")"
if [ "${COUNT}" != "1" ]; then
  echo "${0} error: 'out/link' should be in gitignore exactly once, got ${COUNT}"
  exit 1
fi

echo "024 passed"

# test 033: --unlink
#
# Purpose:
# --unlink turns file B of hardlinked pair back into independent copy of file A.
# Lenient mode: everything unusual is skipped silently, only unlinked pairs are reported.
#
# Steps:
#   1. link everything, then --unlink:
#        - b.txt: different inode than a.txt, the same content, permissions preserved, UNLINKED reported once
#        - no temporary files left behind
#        - directory pair skipped (link is still a symlink)
#   2. sym.txt replaced by hand with symlink to a.txt -> --unlink skips it (it is not a hardlink), nothing reported
#   3. --unlink together with --gitignore -> exit 1
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/033/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 033: --unlink..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/b.txt" "${_DIR}/sym.txt" "${_DIR}/src_dir" "${_DIR}/link" "${_DIR}/link.md"
  rm -f "${_DIR}"/*unlink_tmp*
}
trap cleanup EXIT
cleanup

echo "content 033" > "${_DIR}/a.txt"
chmod 640 "${_DIR}/a.txt"
mkdir -p "${_DIR}/src_dir"

# config.md has a line with missing file A, so linking is done with config without it
grep -v "missing.txt" "${_DIR}/config.md" > "${_DIR}/link.md"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/link.md" 2>&1; then
  echo "${0} error: linking should succeed"
  exit 1
fi

if [ "$(inode "${_DIR}/a.txt")" != "$(inode "${_DIR}/b.txt")" ]; then
  echo "${0} error: prep failed - b.txt is not a hardlink to a.txt"
  exit 1
fi

# step 1
# sym.txt becomes symlink to a.txt - the same inode when followed, but not a hardlink
rm -f "${_DIR}/sym.txt"
ln -s a.txt "${_DIR}/sym.txt"

OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --unlink 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ]; then
  echo "${0} error: --unlink should exit with code 0"
  exit 1
fi

COUNT="$(echo "${OUTPUT}" | grep -c "UNLINKED")"
if [ "${COUNT}" != "1" ]; then
  echo "${0} error: exactly one pair should be reported as UNLINKED, got ${COUNT}"
  exit 1
fi

if [ ! -f "${_DIR}/b.txt" ] || [ "$(inode "${_DIR}/a.txt")" = "$(inode "${_DIR}/b.txt")" ]; then
  echo "${0} error: b.txt should be independent file after --unlink"
  exit 1
fi

if [ "$(cat "${_DIR}/b.txt")" != "content 033" ]; then
  echo "${0} error: content of b.txt should be preserved after --unlink"
  exit 1
fi

MODE_B="$(stat -f "%Lp" "${_DIR}/b.txt" 2>/dev/null || stat -c "%a" "${_DIR}/b.txt")"
if [ "${MODE_B}" != "640" ]; then
  echo "${0} error: permissions of b.txt should be preserved (640), got ${MODE_B}"
  exit 1
fi

if ls "${_DIR}" | grep -q "unlink_tmp"; then
  echo "${0} error: temporary file left behind after --unlink"
  exit 1
fi

# step 2
if [ ! -L "${_DIR}/sym.txt" ] || [ "$(readlink "${_DIR}/sym.txt")" != "a.txt" ]; then
  echo "${0} error: symlink sym.txt should be skipped by --unlink"
  exit 1
fi

if [ ! -L "${_DIR}/link" ]; then
  echo "${0} error: directory pair should be skipped by --unlink (link is still a symlink)"
  exit 1
fi

# everything is unlinked now - second run has nothing to do and reports nothing
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --unlink 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || echo "${OUTPUT}" | grep -q "UNLINKED"; then
  echo "${0} error: second --unlink should exit 0 and report nothing"
  exit 1
fi

# step 3
OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --unlink --gitignore "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" = "0" ] || ! echo "${OUTPUT}" | grep -q "cannot be used together"; then
  echo "${0} error: --unlink with --gitignore should fail with 'cannot be used together'"
  exit 1
fi

echo "033 passed"

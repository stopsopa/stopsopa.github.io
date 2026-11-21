# test 029: strict CLI arguments
#
# Purpose:
# Typo in option must not be silently ignored (--unlnk would run link mode instead of unlink mode).
#
# Steps:
#   1. unknown option            -> exit 1 "Unknown option", nothing created
#   2. second positional arg     -> exit 1 "Unexpected extra argument", nothing created
#   3. --gitignore without value -> exit 1 "requires a file path"
#   4. --pwd=<path> and --gitignore=<path> forms work
#   5. "--pwd config.md" (only positional swallowed by --pwd) -> treated as bare --pwd + config file
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/029/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 029: strict CLI arguments..."

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${_DIR}/a.txt" "${_DIR}/b.txt" "${_DIR}/work" "${_DIR}/.gitignore"
}
trap cleanup EXIT
cleanup

echo "content 029" > "${_DIR}/a.txt"

# expect_fail <grep pattern> <args...>
expect_fail() {
  local PATTERN="${1}"
  shift
  local OUTPUT
  local STATUS
  OUTPUT="$(node "${_ROOT}/bash/hardlink.ts" "${@}" 2>&1)"
  STATUS="${?}"
  echo "${OUTPUT}"
  if [ "${STATUS}" = "0" ]; then
    echo "${0} error: hardlink.ts should have exited with code 1 for: ${*}"
    exit 1
  fi
  if ! echo "${OUTPUT}" | grep -q "${PATTERN}"; then
    echo "${0} error: expected '${PATTERN}' in output for: ${*}"
    exit 1
  fi
  if [ -e "${_DIR}/b.txt" ]; then
    echo "${0} error: nothing should be created for: ${*}"
    exit 1
  fi
}

# step 1
expect_fail "Unknown option" "${_DIR}/config.md" --unlnk
expect_fail "Unknown option" "${_DIR}/config.md" --gitignroe "${_DIR}/config.md"

# step 2
expect_fail "Unexpected extra argument" "${_DIR}/config.md" "${_DIR}/other.md"

# step 3
expect_fail "requires a file path" "${_DIR}/config.md" --gitignore

# step 4
mkdir -p "${_DIR}/work"
echo "content 029 work" > "${_DIR}/work/a.txt"
printf 'node_modules/\n' > "${_DIR}/.gitignore"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" "--pwd=${_DIR}/work" "--gitignore=${_DIR}/.gitignore" 2>&1; then
  echo "${0} error: --pwd=<path> --gitignore=<path> should work"
  exit 1
fi

if [ "$(inode "${_DIR}/work/a.txt")" != "$(inode "${_DIR}/work/b.txt")" ]; then
  echo "${0} error: --pwd=<path>: work/b.txt should be hardlink to work/a.txt"
  exit 1
fi

if ! grep -qx "work/b.txt" "${_DIR}/.gitignore"; then
  echo "${0} error: --gitignore=<path>: 'work/b.txt' should be in gitignore, got:"
  cat "${_DIR}/.gitignore"
  exit 1
fi

# step 5
rm -f "${_DIR}/work/b.txt"
OUTPUT="$(cd "${_DIR}/work" && node "${_ROOT}/bash/hardlink.ts" --pwd "${_DIR}/config.md" 2>&1)"
STATUS="${?}"
echo "${OUTPUT}"

if [ "${STATUS}" != "0" ] || ! echo "${OUTPUT}" | grep -q "current working directory"; then
  echo "${0} error: '--pwd config.md' should behave like 'config.md --pwd'"
  exit 1
fi

if [ "$(inode "${_DIR}/work/a.txt")" != "$(inode "${_DIR}/work/b.txt")" ]; then
  echo "${0} error: '--pwd config.md': work/b.txt should be hardlink to work/a.txt"
  exit 1
fi

echo "029 passed"

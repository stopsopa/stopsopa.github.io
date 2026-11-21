# test 004: paths with spaces and quotes, plus --pwd base resolution
#
# Purpose:
# Tests quoted paths containing spaces, automatic creation of target parent directory,
# and --pwd explicit path override.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/004/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 004: quoted spaces and --pwd override..."

# Cleanup & prep
rm -rf "${_DIR}/folder with space" "${_DIR}/dest with spaces"
mkdir -p "${_DIR}/folder with space"
echo "spaced file content" > "${_DIR}/folder with space/a file.txt"

# Run with --pwd pointing to ${_DIR} from elsewhere
node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --pwd "${_DIR}"

if [[ ! -f "${_DIR}/dest with spaces/b file.txt" ]]; then
  echo "${0} error: hardlink with spaces not created"
  rm -rf "${_DIR}/folder with space" "${_DIR}/dest with spaces"
  exit 1
fi

INODE_A="$(stat -f "%i" "${_DIR}/folder with space/a file.txt" 2>/dev/null || stat -c "%i" "${_DIR}/folder with space/a file.txt")"
INODE_B="$(stat -f "%i" "${_DIR}/dest with spaces/b file.txt" 2>/dev/null || stat -c "%i" "${_DIR}/dest with spaces/b file.txt")"

if [[ "${INODE_A}" != "${INODE_B}" ]]; then
  echo "${0} error: inodes do not match"
  rm -rf "${_DIR}/folder with space" "${_DIR}/dest with spaces"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/folder with space" "${_DIR}/dest with spaces"

echo "004 passed"

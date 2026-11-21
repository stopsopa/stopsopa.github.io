# test 005: deep config.md with --pwd (no path specified) resolving from changed current working directory
#
# Purpose:
# Tests that when config.md is located deeper in the directory structure (sub/deep/config.md),
# passing --pwd without a path forces hardlink.ts to resolve paths relative to process.cwd(),
# rather than relative to sub/deep/.
#
# Expected result:
# source_file.txt and target_file.txt are resolved and created in the execution directory (target_work_dir),
# not next to config.md, and hardlink inode verification passes.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/005/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 005: deep config with --pwd from changed cwd..."

# Setup target_work_dir as working directory
rm -rf "${_DIR}/target_work_dir"
mkdir -p "${_DIR}/target_work_dir"
echo "data 005" > "${_DIR}/target_work_dir/source_file.txt"

(
  cd "${_DIR}/target_work_dir"
  node "${_ROOT}/bash/hardlink.ts" "${_DIR}/sub/deep/config.md" --pwd
)

if [[ ! -f "${_DIR}/target_work_dir/target_file.txt" ]]; then
  echo "${0} error: target_file.txt was not created in target_work_dir"
  rm -rf "${_DIR}/target_work_dir"
  exit 1
fi

INODE_A="$(stat -f "%i" "${_DIR}/target_work_dir/source_file.txt" 2>/dev/null || stat -c "%i" "${_DIR}/target_work_dir/source_file.txt")"
INODE_B="$(stat -f "%i" "${_DIR}/target_work_dir/target_file.txt" 2>/dev/null || stat -c "%i" "${_DIR}/target_work_dir/target_file.txt")"

if [[ "${INODE_A}" != "${INODE_B}" ]]; then
  echo "${0} error: inode mismatch in 005"
  rm -rf "${_DIR}/target_work_dir"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/target_work_dir"

echo "005 passed"

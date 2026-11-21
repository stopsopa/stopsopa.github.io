# test 011: comprehensive test using all features
#
# Purpose:
# Tests config.md containing:
# - multiple path pairs in various formats (plain text, markdown links, quotes, spaces)
# - arbitrary comments, headers, list items, and blank lines which must be skipped
# - --pwd [path] redirecting base resolution away from config.md location
# - deep .gitignore file with delimiter markers receiving all target paths
# - all files successfully validated and hardlinked (same inode verification)
#
# Expected result:
# All 5 path pairs are hardlinked, arbitrary lines skipped, and all 5 relative paths
# are inserted inside the delimiter block in .gitignore.
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/011/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 011: comprehensive test with all features..."

REPO_DIR="${_DIR}/root_repo"
TARGET_GITIGNORE="${REPO_DIR}/.gitignore"
CONFIG_FILE="${_DIR}/manifests/config.md"
WORKSPACE="${REPO_DIR}/workspace"

rm -rf "${REPO_DIR}"
mkdir -p "${REPO_DIR}"
mkdir -p "${WORKSPACE}/src/spaced dir"

# Create source files
echo "content one" > "${WORKSPACE}/src/one.txt"
echo "content two spaced" > "${WORKSPACE}/src/spaced dir/file two.txt"
echo "content three" > "${WORKSPACE}/src/three.txt"
echo "content four" > "${WORKSPACE}/src/four.txt"
echo "content five" > "${WORKSPACE}/src/five.txt"

# Exact BEFORE snapshot of gitignore
BEFORE_SNAPSHOT=$(cat <<'EOF'
# Project gitignore
*.log

# hardlink.ts vvv
initial/keep.txt
# hardlink.ts ^^^

dist/
EOF
)

# Exact expected AFTER snapshot
EXPECTED_AFTER_SNAPSHOT=$(cat <<'EOF'
# Project gitignore
*.log

# hardlink.ts vvv
initial/keep.txt
workspace/dest/one.txt
workspace/dest/spaced dir/file two.txt
workspace/dest/three.txt
workspace/dest/four.txt
workspace/dest/nested/deep/five.txt
# hardlink.ts ^^^

dist/
EOF
)

echo "${BEFORE_SNAPSHOT}" > "${TARGET_GITIGNORE}"

# Run hardlink
node "${_ROOT}/bash/hardlink.ts" "${CONFIG_FILE}" --pwd "${WORKSPACE}" --gitignore "${TARGET_GITIGNORE}"

# Verify hardlinks and inodes
check_pair() {
  local SRC="$1"
  local DEST="$2"

  if [[ ! -f "${DEST}" ]]; then
    echo "${0} error: destination file missing: ${DEST}"
    rm -rf "${REPO_DIR}"
    exit 1
  fi

  local INODE_SRC
  local INODE_DEST
  INODE_SRC="$(stat -f "%i" "${SRC}" 2>/dev/null || stat -c "%i" "${SRC}")"
  INODE_DEST="$(stat -f "%i" "${DEST}" 2>/dev/null || stat -c "%i" "${DEST}")"

  if [[ "${INODE_SRC}" != "${INODE_DEST}" ]]; then
    echo "${0} error: inode mismatch between ${SRC} (${INODE_SRC}) and ${DEST} (${INODE_DEST})"
    rm -rf "${REPO_DIR}"
    exit 1
  fi
}

check_pair "${WORKSPACE}/src/one.txt" "${WORKSPACE}/dest/one.txt"
check_pair "${WORKSPACE}/src/spaced dir/file two.txt" "${WORKSPACE}/dest/spaced dir/file two.txt"
check_pair "${WORKSPACE}/src/three.txt" "${WORKSPACE}/dest/three.txt"
check_pair "${WORKSPACE}/src/four.txt" "${WORKSPACE}/dest/four.txt"
check_pair "${WORKSPACE}/src/five.txt" "${WORKSPACE}/dest/nested/deep/five.txt"

# Verify strict gitignore AFTER state
ACTUAL_AFTER="$(cat "${TARGET_GITIGNORE}")"
if [[ "${ACTUAL_AFTER}" != "${EXPECTED_AFTER_SNAPSHOT}" ]]; then
  cat <<EEE
${0} error: dummy .gitignore after snapshot mismatch in 011!
Expected:
>${EXPECTED_AFTER_SNAPSHOT}<
Actual:
>${ACTUAL_AFTER}<
EEE
  rm -rf "${REPO_DIR}"
  exit 1
fi

# Cleanup
rm -rf "${REPO_DIR}"

echo "011 passed"

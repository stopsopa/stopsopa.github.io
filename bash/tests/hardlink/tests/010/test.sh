# test 010: --gitignore without delimiters (append mode)
#
# Purpose:
# Tests that hardlink.ts appends file B relative paths to the end of a dummy .gitignore
# located in a deep repo directory (where config and work are inside it) when delimiters are missing.
# Verifies strict before and after snapshots.
#
# Expected result:
# File B is hardlinked and the deep .gitignore matches the exact expected AFTER snapshot
# with clean relative path (without "../").
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/010/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

echo "Running 010: deep repo with dummy .gitignore without delimiters (append mode)..."

REPO_DIR="${_DIR}/deep/repo"
TARGET_GITIGNORE="${REPO_DIR}/.gitignore"
CONFIG_FILE="${REPO_DIR}/nested/cfg/config.md"
WORK_DIR="${REPO_DIR}/nested/work"

rm -rf "${_DIR}/deep"
mkdir -p "${REPO_DIR}/nested/cfg"
mkdir -p "${WORK_DIR}"

echo "./a.txt -> ./b.txt" > "${CONFIG_FILE}"
echo "hello 010" > "${WORK_DIR}/a.txt"

# Exact BEFORE snapshot
BEFORE_SNAPSHOT=$(cat <<'EOF'
node_modules/
temp/
EOF
)

# Exact expected AFTER snapshot (relative to REPO_DIR/.gitignore)
EXPECTED_AFTER_SNAPSHOT=$(cat <<'EOF'
node_modules/
temp/
nested/work/b.txt
EOF
)

# Write initial dummy gitignore
echo "${BEFORE_SNAPSHOT}" > "${TARGET_GITIGNORE}"

# Verify strict BEFORE state
ACTUAL_BEFORE="$(cat "${TARGET_GITIGNORE}")"
if [[ "${ACTUAL_BEFORE}" != "${BEFORE_SNAPSHOT}" ]]; then
  echo "${0} error: dummy .gitignore before snapshot does not match"
  rm -rf "${_DIR}/deep"
  exit 1
fi

node "${_ROOT}/bash/hardlink.ts" "${CONFIG_FILE}" --pwd "${WORK_DIR}" --gitignore "${TARGET_GITIGNORE}"

if [[ ! -f "${WORK_DIR}/b.txt" ]]; then
  echo "${0} error: hardlink file B was not created"
  rm -rf "${_DIR}/deep"
  exit 1
fi

# Verify strict AFTER state
ACTUAL_AFTER="$(cat "${TARGET_GITIGNORE}")"
if [[ "${ACTUAL_AFTER}" != "${EXPECTED_AFTER_SNAPSHOT}" ]]; then
  cat <<EEE
${0} error: dummy .gitignore after snapshot mismatch!
Expected:
>${EXPECTED_AFTER_SNAPSHOT}<
Actual:
>${ACTUAL_AFTER}<
EEE
  rm -rf "${_DIR}/deep"
  exit 1
fi

# Cleanup
rm -rf "${_DIR}/deep"

echo "010 passed"

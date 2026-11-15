# test 009: --gitignore with block delimiters and relative path calculation
#
# Purpose:
# Tests that hardlink.ts accepts --gitignore <path>, properly computes the path of file B
# relative to a dummy .gitignore located in a deep repo directory (where config and work are inside it),
# and inserts the entry between "# hardlink.ts vvv" and "# hardlink.ts ^^^".
# Verifies strict before and after snapshots of that dummy .gitignore.
#
# Expected result:
# File B is hardlinked and the deep .gitignore matches the exact expected AFTER snapshot
# with clean relative path (without "../").
#
# Usage:
# /bin/bash lab/hardlink/tests/009/test.sh

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac

_ROOT="$(cd "${_DIR}/../../../../../.." && pwd)"

echo "Running 009: deep repo with dummy .gitignore and delimiters..."

REPO_DIR="${_DIR}/deep/repo"
TARGET_GITIGNORE="${REPO_DIR}/.gitignore"
CONFIG_FILE="${REPO_DIR}/nested/cfg/config.md"
WORK_DIR="${REPO_DIR}/nested/work"

# Reset workspace inside deep/
rm -rf "${_DIR}/deep"
mkdir -p "${REPO_DIR}/nested/cfg"
mkdir -p "${WORK_DIR}"

echo "./source.txt -> ./build/output.txt" > "${CONFIG_FILE}"
echo "source data 009" > "${WORK_DIR}/source.txt"

# Exact BEFORE snapshot
BEFORE_SNAPSHOT=$(cat <<'EOF'
node_modules/

# hardlink.ts vvv
existing/ignore.txt
# hardlink.ts ^^^

dist/
EOF
)

# Exact expected AFTER snapshot (relative to REPO_DIR/.gitignore)
EXPECTED_AFTER_SNAPSHOT=$(cat <<'EOF'
node_modules/

# hardlink.ts vvv
existing/ignore.txt
nested/work/build/output.txt
# hardlink.ts ^^^

dist/
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

# Run hardlink with config and work deeper inside the repo
node "${_ROOT}/bash/hardlink.ts" "${CONFIG_FILE}" --pwd "${WORK_DIR}" --gitignore "${TARGET_GITIGNORE}"

if [[ ! -f "${WORK_DIR}/build/output.txt" ]]; then
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

echo "009 passed"

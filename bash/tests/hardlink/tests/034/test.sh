# test 034: --gitignore - special characters are escaped
#
# Purpose:
# * ? [ are glob characters in gitignore, leading # is a comment and leading ! negates the pattern.
# Path B containing them has to be escaped, otherwise the entry would match something else (or nothing).
# Verified with real git (git check-ignore) inside throwaway repository.
#
# Expected result:
#   - gitignore content matches exact snapshot
#   - git check-ignore reports all three files B as ignored and similar looking file as not ignored
#
# Usage:
# /bin/bash bash/tests/hardlink/tests/034/test.sh

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"

_ROOT="$(cd "${_DIR}/../../../../.." && pwd)"

inode() {
  stat -f "%i" "${1}" 2>/dev/null || stat -c "%i" "${1}"
}

echo "Running 034: gitignore special characters are escaped..."

REPO="${_DIR}/repo"

# remove everything this test created (also when it fails midway)
cleanup() {
  rm -rf "${REPO}"
}
trap cleanup EXIT
cleanup

mkdir -p "${REPO}"
echo "content 034" > "${REPO}/a.txt"
printf '# hardlink.ts vvv\n# hardlink.ts ^^^\n' > "${REPO}/.gitignore"

if ! node "${_ROOT}/bash/hardlink.ts" "${_DIR}/config.md" --pwd "${REPO}" --gitignore "${REPO}/.gitignore" 2>&1; then
  echo "${0} error: hardlink.ts should succeed"
  exit 1
fi

EXPECTED=$(cat <<'EOF'
# hardlink.ts vvv
out/we\*ird \[1]\?.txt
\#hash/b.txt
/!bang.txt
# hardlink.ts ^^^
EOF
)

ACTUAL="$(cat "${REPO}/.gitignore")"
if [ "${ACTUAL}" != "${EXPECTED}" ]; then
  cat <<EEE
${0} error: gitignore mismatch
Expected:
>${EXPECTED}<
Actual:
>${ACTUAL}<
EEE
  exit 1
fi

if ! command -v git > /dev/null 2>&1; then
  echo "034 git part SKIPPED: git not found"
  echo "034 passed"
  exit 0
fi

git init -q "${REPO}"

# would be matched by unescaped "out/we*ird [1]?.txt"
echo "x" > "${REPO}/out/weXXird 1X.txt"

for FILE in 'out/we*ird [1]?.txt' '#hash/b.txt' '!bang.txt'; do
  if ! git -C "${REPO}" check-ignore -q -- "${FILE}"; then
    echo "${0} error: git should ignore '${FILE}'"
    exit 1
  fi
done

if git -C "${REPO}" check-ignore -q -- 'out/weXXird 1X.txt'; then
  echo "${0} error: git should NOT ignore 'out/weXXird 1X.txt' - glob characters were not escaped"
  exit 1
fi

if git -C "${REPO}" check-ignore -q -- 'a.txt'; then
  echo "${0} error: git should NOT ignore 'a.txt'"
  exit 1
fi

echo "034 passed"

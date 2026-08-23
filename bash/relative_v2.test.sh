#!/usr/bin/env bash

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "${DIR}/realpath_v2.sh"

passed=0
failed=0

assert_relative() {
    local from="$1"
    local to="$2"
    local expected="$3"

    local actual
    actual="$(relative_path "${from}" "${to}")" || {
        echo "FAIL: relative_path '${from}' '${to}'"
        echo "      function returned an error"
        failed=$((failed + 1))
        return
    }

    if [[ "${actual}" == "${expected}" ]]; then
        echo "PASS: '${from}' -> '${to}' = '${actual}'"
        passed=$((passed + 1))
    else
        echo "FAIL: '${from}' -> '${to}'"
        echo "      expected: '${expected}'"
        echo "      actual:   '${actual}'"
        failed=$((failed + 1))
    fi
}

echo "Testing relative_path..."
echo

# ---------------------------------------------------------------------------
# Absolute paths
# ---------------------------------------------------------------------------

assert_relative \
    "/a/b" \
    "/a/b/c" \
    "c"

assert_relative \
    "/a/b" \
    "/a/b/c/d" \
    "c/d"

assert_relative \
    "/a/b/c" \
    "/a/b/d" \
    "../d"

assert_relative \
    "/a/b/c" \
    "/a/d/e" \
    "../../d/e"

assert_relative \
    "/a/b/c" \
    "/x/y" \
    "../../../x/y"

assert_relative \
    "/a/b" \
    "/a/b" \
    "."

# ---------------------------------------------------------------------------
# Root directory
# ---------------------------------------------------------------------------

assert_relative \
    "/" \
    "/a/b/c" \
    "a/b/c"

assert_relative \
    "/a/b/c" \
    "/" \
    "../../.."

# ---------------------------------------------------------------------------
# Relative paths
# ---------------------------------------------------------------------------

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

mkdir -p \
    "${TMP}/project/src" \
    "${TMP}/project/test" \
    "${TMP}/project/dist"

assert_relative \
    "${TMP}/project" \
    "${TMP}/project/src" \
    "src"

assert_relative \
    "${TMP}/project/src" \
    "${TMP}/project/test" \
    "../test"

# ---------------------------------------------------------------------------
# Current directory
# ---------------------------------------------------------------------------

assert_relative \
    "${PWD}" \
    "${PWD}/foo" \
    "foo"

assert_relative \
    "${PWD}/foo" \
    "${PWD}" \
    ".."

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo
echo "----------------------------------------"
echo "Passed: ${passed}"
echo "Failed: ${failed}"
echo "----------------------------------------"

if (( failed > 0 )); then
    exit 1
fi
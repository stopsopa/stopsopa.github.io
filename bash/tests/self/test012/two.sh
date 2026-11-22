source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR __DIR _BINARY B__BINARY
echo "two: __DIR=${__DIR-<unset>} B__BINARY=${B__BINARY-<unset>} _DIR=${_DIR-<unset>} _0=${_0-<unset>} _SCRIPT=${_SCRIPT-<unset>} _SHELL=${_SHELL-<unset>} _BINARY=${_BINARY-<unset>} _PWD=${_PWD-<unset>}"

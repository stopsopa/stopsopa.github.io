source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR _DIR
echo "same: _DIR=${_DIR-<unset>} _0=${_0-<unset>} _SCRIPT=${_SCRIPT-<unset>} _SHELL=${_SHELL-<unset>} _BINARY=${_BINARY-<unset>} _PWD=${_PWD-<unset>}"

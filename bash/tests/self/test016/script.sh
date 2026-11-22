source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _0 _0
_self --map _DIR X_DIR _SHELL X_SHELL
echo "code=$?"
echo "ok: X_DIR=${X_DIR-<unset>} X_SHELL=${X_SHELL-<unset>} _0=${_0-<unset>} _DIR=${_DIR-<unset>}"
_self --map _NOPE X
echo "code=$?"
_self --map _DIR
echo "code=$?"
_self --map
echo "code=$?"
_self _DIR Y_DIR
echo "code=$?"
echo "errors: X=${X-<unset>} Y_DIR=${Y_DIR-<unset>} _DIR=${_DIR-<unset>}"
_self
echo "code=$?"
echo "no arguments: _DIR=${_DIR-<unset>} _0=${_0-<unset>} _PWD=${_PWD-<unset>}"

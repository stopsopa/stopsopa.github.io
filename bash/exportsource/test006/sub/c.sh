source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh"
echo "c before: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
source "${_DIR}/b.sh"
_self
echo "c after sourcing b: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"

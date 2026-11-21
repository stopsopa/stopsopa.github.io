source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../self.sh"
echo "a before: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
source "${_DIR}/sub/b.sh"
_self
echo "a after sourcing b: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
b_func
_self
echo "a after calling function from b: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
"${_BINARY}" "${_DIR}/sub/c.sh"
echo "a after executing c: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"

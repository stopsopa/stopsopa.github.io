source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh"
echo "b: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
b_func() {
  _self
  echo "b_func: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
}

# SELF_MODE=old  -> old block which used to be copy-pasted to every script
# otherwise      -> bash/self.sh
if [ "${SELF_MODE}" = "old" ]; then
  _SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
  _SHELL="${_SHELL##*/}"
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
  _PWD="$( pwd)"
else
  source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh"
fi
b_func() {
  [ "${SELF_MODE}" = "old" ] || _self
  echo "b_func: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
}

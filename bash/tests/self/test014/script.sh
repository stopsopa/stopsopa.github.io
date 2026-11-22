# self.sh sourced WITHOUT arguments - so it sees the arguments of this script
source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh"
echo "script: _DIR=${_DIR-<unset>} _0=${_0-<unset>} _SHELL=${_SHELL-<unset>} MINE=${MINE-<unset>}"

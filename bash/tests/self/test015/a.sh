source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR A_DIR _0 A_0
echo "a before: A_DIR=${A_DIR-<unset>} A_0=${A_0-<unset>}"
source "${A_DIR}/sub/b.sh"
echo "a after sourcing b: A_DIR=${A_DIR-<unset>} A_0=${A_0-<unset>}"
b_func
echo "a after calling b_func: A_DIR=${A_DIR-<unset>} A_0=${A_0-<unset>} _DIR=${_DIR-<unset>} _0=${_0-<unset>}"

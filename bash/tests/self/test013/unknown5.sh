source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR __DIR _0 __0 _WRONG X
echo "code=$?"
echo "vars: __DIR=${__DIR-<unset>} _DIR=${_DIR-<unset>} _0=${_0-<unset>}"

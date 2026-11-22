# --map is missing
source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" _DIR __DIR
echo "code=$?"
echo "forgot: __DIR=${__DIR-<unset>} _DIR=${_DIR-<unset>} _0=${_0-<unset>}"

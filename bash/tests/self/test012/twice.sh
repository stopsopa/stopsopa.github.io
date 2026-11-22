source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR FIRST _DIR SECOND _0 _0
echo "twice: FIRST=${FIRST-<unset>} SECOND=${SECOND-<unset>} _0=${_0-<unset>} _DIR=${_DIR-<unset>}"

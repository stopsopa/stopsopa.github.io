set -e
source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../self.sh" --map _DIR __DIR _0
echo "should not be printed"

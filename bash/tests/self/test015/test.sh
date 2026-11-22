#
# scripts sourcing each other, each with its own names of variables: a.sh -> --map _DIR A_DIR _0 A_0, sub/b.sh -> --map _DIR B_DIR _0 B_0
# nothing is overridden, no need to call _self
#
# /bin/bash bash/tests/self/test015/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test015"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: A_DIR=<ROOT>/${D} A_0=a.sh
b: B_DIR=<ROOT>/${D}/sub B_0=b.sh
a after sourcing b: A_DIR=<ROOT>/${D} A_0=a.sh
b_func: B_DIR=<ROOT>/${D}/sub B_0=b.sh A_0=a.sh
a after calling b_func: A_DIR=<ROOT>/${D} A_0=a.sh _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash"

COMMAND="/bin/zsh ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: A_DIR=<ROOT>/${D} A_0=a.sh
b: B_DIR=<ROOT>/${D}/sub B_0=b.sh
a after sourcing b: A_DIR=<ROOT>/${D} A_0=a.sh
b_func: B_DIR=<ROOT>/${D}/sub B_0=b.sh A_0=a.sh
a after calling b_func: A_DIR=<ROOT>/${D} A_0=a.sh _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh"

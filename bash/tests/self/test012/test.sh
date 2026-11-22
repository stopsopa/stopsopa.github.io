#
# --map with more pairs, the same name on both sides, all variables renamed, one variable under two names
#
# /bin/bash bash/tests/self/test012/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test012"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/two.sh ${N}"
EXPECTED_STDOUT="two: __DIR=<ROOT>/${D} B__BINARY=/bin/bash _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: two pairs"

COMMAND="/bin/bash ${D}/same.sh ${N}"
EXPECTED_STDOUT="same: _DIR=<ROOT>/${D} _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: _DIR _DIR - creates only _DIR"

COMMAND="/bin/bash ${D}/all.sh ${N}"
EXPECTED_STDOUT="all: X_DIR=<ROOT>/${D} X_0=all.sh X_SCRIPT=${D}/all.sh X_SHELL=bash X_BINARY=/bin/bash X_PWD=<ROOT>
all: _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: all renamed"

COMMAND="/bin/bash ${D}/twice.sh ${N}"
EXPECTED_STDOUT="twice: FIRST=<ROOT>/${D} SECOND=<ROOT>/${D} _0=twice.sh _DIR=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: one variable under two names"

COMMAND="/bin/zsh ${D}/two.sh ${N}"
EXPECTED_STDOUT="two: __DIR=<ROOT>/${D} B__BINARY=/bin/zsh _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: two pairs"

COMMAND="/bin/zsh ${D}/same.sh ${N}"
EXPECTED_STDOUT="same: _DIR=<ROOT>/${D} _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: _DIR _DIR - creates only _DIR"

COMMAND="/bin/zsh ${D}/all.sh ${N}"
EXPECTED_STDOUT="all: X_DIR=<ROOT>/${D} X_0=all.sh X_SCRIPT=${D}/all.sh X_SHELL=zsh X_BINARY=/bin/zsh X_PWD=<ROOT>
all: _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: all renamed"

COMMAND="/bin/zsh ${D}/twice.sh ${N}"
EXPECTED_STDOUT="twice: FIRST=<ROOT>/${D} SECOND=<ROOT>/${D} _0=twice.sh _DIR=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: one variable under two names"

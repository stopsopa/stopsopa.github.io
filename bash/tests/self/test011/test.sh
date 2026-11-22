#
# one pair: --map _DIR __DIR - only __DIR is created, nothing else
#
# /bin/bash bash/tests/self/test011/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test011"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash executed"

COMMAND="/bin/bash -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash sourced"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh executed"

COMMAND="/bin/zsh -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh sourced"

COMMAND="/bin/sh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh executed"

COMMAND="/bin/sh -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: __DIR=<ROOT>/${D} _DIR=<unset> _0=<unset> _SCRIPT=<unset> _SHELL=<unset> _BINARY=<unset> _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh sourced"

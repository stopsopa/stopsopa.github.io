#
# BEFORE: block pasted into the script - cases where it works
#
# /bin/bash bash/exportsource/test001/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test001"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash executed"

COMMAND="/bin/bash -c 'source ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash sourced"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh executed"

COMMAND="/bin/zsh -c 'source ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh sourced"

COMMAND="/bin/sh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh executed"

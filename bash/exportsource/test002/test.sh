#
# BEFORE: block pasted into the script - cases where it is BROKEN
# expectations below are the wrong values which the old block really produces (on mac, where /bin/sh is bash)
#
# /bin/bash bash/exportsource/test002/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test002"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/sh -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=sh _DIR=/bin _0=sh _SCRIPT=/bin/sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG: sourced in sh - describes the shell binary instead of the script"

COMMAND="/bin/zsh -c 'exec -a -zsh /bin/zsh -c \"source ${D}/script.sh\"' ${N}"
EXPECTED_STDOUT="script: _SHELL=-zsh _DIR=<ROOT> _0= _SCRIPT= _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG: sourced in login zsh (every terminal tab on mac, ps reports '-zsh') - bash branch is used, everything is empty"

COMMAND="/bin/dash ${D}/script.sh ${N}"
EXPECTED_STDOUT="${D}/script.sh: 17: Bad substitution
${D}/script.sh: 18: Bad substitution
${D}/script.sh: 19: Bad substitution"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG: executed in dash - crash, script is aborted"

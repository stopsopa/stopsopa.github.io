#
# BEFORE: the block moved as it is to separate file lib/block.sh and sourced from script.sh
# BUG: variables describe lib/block.sh instead of script.sh
#
# /bin/bash bash/exportsource/test004/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test004"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D}/lib _0=block.sh _SCRIPT=${D}/lib/block.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG bash: describes the library"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D}/lib _0=block.sh _SCRIPT=${D}/lib/block.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG zsh: describes the library"

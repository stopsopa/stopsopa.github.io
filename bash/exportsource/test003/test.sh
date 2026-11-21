#
# BEFORE: a.sh sources sub/b.sh, both have the block pasted
# BUG: after sourcing b.sh variables in a.sh describe b.sh (globals overridden) and nothing can bring them back.
# Executing b.sh (separate process) on the other hand doesn't change anything in a.sh
#
# /bin/bash bash/exportsource/test003/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test003"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after executing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG bash: a.sh variables point to b.sh after sourcing it"

COMMAND="/bin/zsh ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after executing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "BUG zsh: a.sh variables point to b.sh after sourcing it"

#
# arguments of the script itself - see "WHY --map" in the header of self.sh
# script sourced without arguments sees arguments of the script which is sourcing it,
# so self.sh takes arguments into account only if the first one is --map
#
# /bin/bash bash/tests/self/test014/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test014"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=bash MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: script called without arguments"

COMMAND="/bin/bash ${D}/script.sh foo bar baz ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=bash MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: script called with its own arguments - ignored by self.sh"

COMMAND="/bin/bash ${D}/script.sh --dir /tmp -v ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=bash MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: script called with arguments looking like options"

COMMAND="/bin/bash ${D}/script.sh _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=bash MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: script called with arguments looking like pairs - ignored by self.sh"

COMMAND="/bin/bash ${D}/script.sh foo --map _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=bash MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: script called with --map not on the first position - ignored by self.sh"

COMMAND="/bin/bash ${D}/script.sh --map _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<unset> _0=<unset> _SHELL=<unset> MINE=<ROOT>/${D}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: TRAP (the only one left) - arguments of the script start with --map, self.sh takes them as its own"

COMMAND="/bin/bash ${D}/forgot.sh ${N}"
EXPECTED_STDOUT="code=0
forgot: __DIR=<unset> _DIR=<ROOT>/${D} _0=forgot.sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: TRAP - forgotten --map is not an error, all default variables are created"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=zsh MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: script called without arguments"

COMMAND="/bin/zsh ${D}/script.sh foo bar baz ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=zsh MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: script called with its own arguments - ignored by self.sh"

COMMAND="/bin/zsh ${D}/script.sh --dir /tmp -v ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=zsh MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: script called with arguments looking like options"

COMMAND="/bin/zsh ${D}/script.sh _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=zsh MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: script called with arguments looking like pairs - ignored by self.sh"

COMMAND="/bin/zsh ${D}/script.sh foo --map _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<ROOT>/${D} _0=script.sh _SHELL=zsh MINE=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: script called with --map not on the first position - ignored by self.sh"

COMMAND="/bin/zsh ${D}/script.sh --map _DIR MINE ${N}"
EXPECTED_STDOUT="script: _DIR=<unset> _0=<unset> _SHELL=<unset> MINE=<ROOT>/${D}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: TRAP (the only one left) - arguments of the script start with --map, self.sh takes them as its own"

COMMAND="/bin/zsh ${D}/forgot.sh ${N}"
EXPECTED_STDOUT="code=0
forgot: __DIR=<unset> _DIR=<ROOT>/${D} _0=forgot.sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: TRAP - forgotten --map is not an error, all default variables are created"

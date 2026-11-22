#
# function _self with --map - these are arguments of a function, so there is no doubt whose they are:
# anything else than --map as the first argument is an error (forgotten --map too)
# and strict posix shell (dash), where arguments of "." are ignored by the shell
#
# /bin/bash bash/tests/self/test016/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test016"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="code=0
ok: X_DIR=<ROOT>/${D} X_SHELL=bash _0=script.sh _DIR=<unset>
self.sh error: unknown variable >_NOPE<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
self.sh error: arguments have to be given in pairs '<variable> <new name>', but 1 arguments given: _DIR
code=1
self.sh error: --map requires at least one pair '<variable> <new name>'
code=1
self.sh error: first argument has to be --map, but it is >_DIR<
code=1
errors: X=<unset> Y_DIR=<unset> _DIR=<unset>
code=0
no arguments: _DIR=<ROOT>/${D} _0=script.sh _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: _self with --map"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="code=0
ok: X_DIR=<ROOT>/${D} X_SHELL=zsh _0=script.sh _DIR=<unset>
self.sh error: unknown variable >_NOPE<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
self.sh error: arguments have to be given in pairs '<variable> <new name>', but 1 arguments given: _DIR
code=1
self.sh error: --map requires at least one pair '<variable> <new name>'
code=1
self.sh error: first argument has to be --map, but it is >_DIR<
code=1
errors: X=<unset> Y_DIR=<unset> _DIR=<unset>
code=0
no arguments: _DIR=<ROOT>/${D} _0=script.sh _PWD=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: _self with --map"

COMMAND="/bin/dash ${D}/posix.sh ${N}"
EXPECTED_STDOUT="source: __DIR=<unset> _DIR=<ROOT>/${D} _0=posix.sh
code=0
_self: X_DIR=<ROOT>/${D}
self.sh error: unknown variable >_NOPE<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "dash: arguments of source ignored, _self with --map works"

#
# wrong arguments: error on stderr, source returns 1, nothing is created
# (also __DIR is not created although its pair is correct)
#
#   - odd number of arguments after --map (3 arguments, 1 argument)
#   - --map without any pair
#   - unknown <variable> - not one of _DIR _0 _SCRIPT _SHELL _BINARY _PWD - on 1st, 3rd and 5th position
#   - <new name> which is not a valid name of variable (starting with digit, with dash, empty)
#   - with "set -e" the script stops on the line with source
#
# /bin/bash bash/tests/self/test013/test.sh
#

source bash/test.sh "${0}"

D="bash/tests/self/test013"
ROOT="$(pwd -P)"
# stderr merged to stdout, path to the repository replaced with <ROOT>
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/odd.sh ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 3 arguments given: _DIR __DIR _0
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: odd number of arguments"

COMMAND="/bin/bash ${D}/single.sh ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 1 arguments given: _DIR
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: one argument"

COMMAND="/bin/bash ${D}/nopairs.sh ${N}"
EXPECTED_STDOUT="self.sh error: --map requires at least one pair '<variable> <new name>'
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: --map without any pair"

COMMAND="/bin/bash ${D}/unknown1.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_DIRR<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: unknown variable on 1st position"

COMMAND="/bin/bash ${D}/unknown.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_NOPE<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: unknown variable on 3rd position"

COMMAND="/bin/bash ${D}/unknown5.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_WRONG<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: unknown variable on 5th position"

COMMAND="/bin/bash ${D}/invalid.sh ${N}"
EXPECTED_STDOUT="self.sh error: >1abc< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: new name starting with digit"

COMMAND="/bin/bash ${D}/dash.sh ${N}"
EXPECTED_STDOUT="self.sh error: >a-b< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: new name with dash"

COMMAND="/bin/bash ${D}/empty.sh ${N}"
EXPECTED_STDOUT="self.sh error: >< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: empty new name"

COMMAND="(/bin/bash ${D}/sete.sh; echo exit=\$?) ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 3 arguments given: _DIR __DIR _0
exit=1"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash: with set -e script stops"

COMMAND="/bin/zsh ${D}/odd.sh ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 3 arguments given: _DIR __DIR _0
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: odd number of arguments"

COMMAND="/bin/zsh ${D}/single.sh ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 1 arguments given: _DIR
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: one argument"

COMMAND="/bin/zsh ${D}/nopairs.sh ${N}"
EXPECTED_STDOUT="self.sh error: --map requires at least one pair '<variable> <new name>'
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: --map without any pair"

COMMAND="/bin/zsh ${D}/unknown1.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_DIRR<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: unknown variable on 1st position"

COMMAND="/bin/zsh ${D}/unknown.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_NOPE<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: unknown variable on 3rd position"

COMMAND="/bin/zsh ${D}/unknown5.sh ${N}"
EXPECTED_STDOUT="self.sh error: unknown variable >_WRONG<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: unknown variable on 5th position"

COMMAND="/bin/zsh ${D}/invalid.sh ${N}"
EXPECTED_STDOUT="self.sh error: >1abc< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: new name starting with digit"

COMMAND="/bin/zsh ${D}/dash.sh ${N}"
EXPECTED_STDOUT="self.sh error: >a-b< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: new name with dash"

COMMAND="/bin/zsh ${D}/empty.sh ${N}"
EXPECTED_STDOUT="self.sh error: >< is not a valid name of variable
code=1
vars: __DIR=<unset> _DIR=<unset> _0=<unset>"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: empty new name"

COMMAND="(/bin/zsh ${D}/sete.sh; echo exit=\$?) ${N}"
EXPECTED_STDOUT="self.sh error: arguments have to be given in pairs '<variable> <new name>', but 3 arguments given: _DIR __DIR _0
exit=1"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh: with set -e script stops"

#
# AFTER: bash/self.sh sourced from the script - all ways of calling the script
#
# /bin/bash bash/exportsource/test005/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test005"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

# executable bit is not stored in the repository, it is needed only for the time of this test
# for cases: "executed directly (shebang)" and "found through PATH"
chmod +x "${D}/script.sh"

COMMAND="/bin/bash ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash executed"

COMMAND="/bin/bash -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash sourced"

COMMAND="/bin/bash -c 'f() { . ${D}/script.sh; }; f' ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash sourced inside function"

COMMAND="/bin/zsh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh executed"

COMMAND="/bin/zsh -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh sourced"

COMMAND="/bin/zsh -c 'f() { . ${D}/script.sh; }; f' ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh sourced inside function"

COMMAND="/bin/sh ${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh executed"

COMMAND="/bin/sh -c '. ${D}/script.sh' ${N}"
EXPECTED_STDOUT="script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh sourced"

COMMAND="/bin/sh -c 'f() { . ${D}/script.sh; }; f' ${N}"
EXPECTED_STDOUT="script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh sourced inside function"

COMMAND="/bin/zsh -c 'exec -a -zsh /bin/zsh -c \"source ${D}/script.sh\"' ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sourced in login zsh"

COMMAND="/bin/bash -c 'exec -a -bash /bin/bash -c \"source ${D}/script.sh\"' ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sourced in login bash"

COMMAND="${D}/script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "executed directly (shebang)"

COMMAND="(cd ${D}/.. && /bin/bash test005/script.sh) ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=test005/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "executed from different directory, relative path"

COMMAND="(cd / && /bin/zsh -c 'source ${ROOT}/${D}/script.sh') ${N}"
EXPECTED_STDOUT="script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=<ROOT>/${D}/script.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sourced from different directory, absolute path"

COMMAND="PATH=\"${ROOT}/${D}:${PATH}\" script.sh ${N}"
EXPECTED_STDOUT="script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=<ROOT>/${D}/script.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "found through PATH"

COMMAND="/bin/dash ${D}/posix.sh ${N}"
EXPECTED_STDOUT="posix: _SHELL=sh _DIR=<ROOT>/${D} _0=posix.sh _SCRIPT=${D}/posix.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "strict posix shell (dash) executed"

COMMAND="/bin/bash -c 'source bash/self.sh; echo \"[\${_DIR}][\${_0}][\${_SCRIPT}]\"' ${N}"
EXPECTED_STDOUT="[<ROOT>][][]"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "self.sh sourced with no script at all"

chmod -x "${D}/script.sh"

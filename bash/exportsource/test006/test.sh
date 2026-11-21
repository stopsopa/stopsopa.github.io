#
# AFTER: scripts sourcing and executing each other, each of them sources bash/self.sh
#   a.sh  sources   sub/b.sh
#   a.sh  calls     function defined in sub/b.sh
#   a.sh  executes  sub/c.sh  which sources  sub/b.sh
# every script (and function) sees its own location
#
# /bin/bash bash/exportsource/test006/test.sh
#

source bash/test.sh "${0}"

D="bash/exportsource/test006"
ROOT="$(pwd -P)"
# make output independent from location of the repository
N="2>&1 | sed 's#${ROOT}#<ROOT>#g'"

COMMAND="/bin/bash ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after sourcing b: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b_func: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after calling function from b: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
c before: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
c after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
a after executing c: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash"

COMMAND="/bin/zsh ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b_func: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after calling function from b: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
c before: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
c after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
a after executing c: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh"

COMMAND="/bin/sh ${D}/a.sh ${N}"
EXPECTED_STDOUT="a before: _SHELL=sh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/sh
b: _SHELL=sh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/sh
a after sourcing b: _SHELL=sh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/sh
b_func: _SHELL=sh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/sh
a after calling function from b: _SHELL=sh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/sh
c before: _SHELL=sh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/sh
b: _SHELL=sh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/sh
c after sourcing b: _SHELL=sh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/sh
a after executing c: _SHELL=sh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/sh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh"

COMMAND="/bin/bash -c 'source ${D}/a.sh' ${N}"
EXPECTED_STDOUT="a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after sourcing b: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b_func: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after calling function from b: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
c before: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
c after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
a after executing c: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "bash, a.sh sourced"

COMMAND="/bin/zsh -c 'source ${D}/a.sh' ${N}"
EXPECTED_STDOUT="a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b_func: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after calling function from b: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
c before: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
c after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
a after executing c: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "zsh, a.sh sourced"

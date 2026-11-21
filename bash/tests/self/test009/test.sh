#
# a.sh executes sub/c.sh (separate process), c.sh sources sub/b.sh
# executed script can't change anything in a.sh - true for both
# difference is only inside c.sh after sourcing b.sh
#
# /bin/bash bash/tests/self/test009/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test009"

compare "bash" \
  "/bin/bash ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
c before: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
c after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after executing c: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash" \
  "a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
c before: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
c after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/bash
a after executing c: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash"

compare "zsh" \
  "/bin/zsh ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
c before: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
c after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after executing c: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh" \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
c before: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
c after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=c.sh _SCRIPT=<ROOT>/${D}/sub/c.sh _BINARY=/bin/zsh
a after executing c: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh"

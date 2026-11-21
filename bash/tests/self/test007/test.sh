#
# a.sh sources sub/b.sh, both use the block / self.sh
# old block: after sourcing b.sh variables in a.sh describe b.sh
# self.sh:   a.sh calls _self after sourcing b.sh
#
# /bin/bash bash/tests/self/test007/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test007"

compare "bash" \
  "/bin/bash ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after sourcing b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash" \
  "a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after sourcing b: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash"

compare "zsh" \
  "/bin/zsh ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh" \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after sourcing b: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh"

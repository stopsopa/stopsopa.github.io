#
# a.sh calls function defined in sub/b.sh, function prints the variables
# old block: function sees whatever was set last (here location of b.sh only by accident - because b.sh was sourced last)
#            and a.sh never sees its own location again
# self.sh:   function calls _self in the first line and always sees the file where it is defined, a.sh calls _self too
#
# /bin/bash bash/tests/self/test008/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test008"

compare "bash" \
  "/bin/bash ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
b_func: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after calling b_func: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash" \
  "a before: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash
b_func: _SHELL=bash _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/bash
a after calling b_func: _SHELL=bash _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/bash"

compare "zsh" \
  "/bin/zsh ${D}/a.sh" \
  DIFFERENT \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
b_func: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after calling b_func: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh" \
  "a before: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh
b_func: _SHELL=zsh _DIR=<ROOT>/${D}/sub _0=b.sh _SCRIPT=<ROOT>/${D}/sub/b.sh _BINARY=/bin/zsh
a after calling b_func: _SHELL=zsh _DIR=<ROOT>/${D} _0=a.sh _SCRIPT=${D}/a.sh _BINARY=/bin/zsh"

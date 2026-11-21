#
# script sourced from inside of a function
#
# /bin/bash bash/tests/self/test003/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test003"

compare "bash" \
  "/bin/bash -c 'f() { source ${D}/script.sh; }; f'" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"

compare "zsh" \
  "/bin/zsh -c 'f() { source ${D}/script.sh; }; f'" \
  SAME \
  "script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"

# old block: uses ${0} for sh, which is the shell binary when the script is sourced

compare "sh" \
  "/bin/sh -c 'f() { . ${D}/script.sh; }; f'" \
  DIFFERENT \
  "script: _SHELL=sh _DIR=/bin _0=sh _SCRIPT=/bin/sh _BINARY=/bin/sh" \
  "script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"

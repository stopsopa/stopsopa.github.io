#
# script executed
#
# /bin/bash bash/tests/self/test001/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test001"

compare "bash" \
  "/bin/bash ${D}/script.sh" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"

compare "zsh" \
  "/bin/zsh ${D}/script.sh" \
  SAME \
  "script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"

compare "sh" \
  "/bin/sh ${D}/script.sh" \
  SAME \
  "script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"

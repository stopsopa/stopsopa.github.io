#
# strict posix shell (dash) - script.sh sources self.sh with: . "$(dirname "${0}")/../../../self.sh"
#
# /bin/bash bash/tests/self/test006/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test006"

# old block: bash branch is used in dash and it crashes on ${BASH_SOURCE[0]}

compare "dash executed" \
  "/bin/dash ${D}/script.sh" \
  DIFFERENT \
  "${D}/script.sh: 20: Bad substitution
${D}/script.sh: 21: Bad substitution
${D}/script.sh: 22: Bad substitution" \
  "script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"

compare "sh executed" \
  "/bin/sh ${D}/script.sh" \
  SAME \
  "script: _SHELL=sh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/sh"

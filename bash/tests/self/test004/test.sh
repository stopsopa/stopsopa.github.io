#
# script sourced in login shell (every terminal tab on mac) - there 'ps -p $$ -o comm=' reports '-zsh' / '-bash'
#
# /bin/bash bash/tests/self/test004/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test004"

# old block: '-zsh' is not matching 'zsh' so bash branch is used in zsh and everything is empty

compare "login zsh" \
  "/bin/zsh -c 'exec -a -zsh /bin/zsh -c \"source ${D}/script.sh\"'" \
  DIFFERENT \
  "script: _SHELL=-zsh _DIR=<ROOT> _0= _SCRIPT= _BINARY=/bin/bash" \
  "script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/zsh"

# old block: works by accident (bash is the default branch), only _SHELL is wrong

compare "login bash" \
  "/bin/bash -c 'exec -a -bash /bin/bash -c \"source ${D}/script.sh\"'" \
  DIFFERENT \
  "script: _SHELL=-bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash" \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"

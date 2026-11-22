#
# different paths leading to the script
#
# /bin/bash bash/tests/self/test005/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test005"

# executable bit is not stored in the repository, it is needed only for the time of this test
# for cases: "executed directly (shebang)" and "found through PATH"
chmod +x "${D}/script.sh"

compare "executed directly (shebang)" \
  "${D}/script.sh" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=${D}/script.sh _BINARY=/bin/bash"

compare "executed from different directory, relative path" \
  "cd ${D}/.. && /bin/bash test005/script.sh" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=test005/script.sh _BINARY=/bin/bash"

compare "executed from different directory, relative path with .." \
  "cd ${D} && /bin/zsh ../test005/script.sh" \
  SAME \
  "script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=../test005/script.sh _BINARY=/bin/zsh"

compare "sourced from different directory, absolute path" \
  "cd / && /bin/zsh -c 'source ${ROOT}/${D}/script.sh'" \
  SAME \
  "script: _SHELL=zsh _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=<ROOT>/${D}/script.sh _BINARY=/bin/zsh"

compare "found through PATH" \
  "PATH=\"${ROOT}/${D}:${PATH}\" script.sh" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=script.sh _SCRIPT=<ROOT>/${D}/script.sh _BINARY=/bin/bash"

chmod -x "${D}/script.sh"

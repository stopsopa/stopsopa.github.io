#
# runs all tests of bash/self.sh
# each test runs the same script with the old copy-pasted block (SELF_MODE=old)
# and with bash/self.sh (SELF_MODE=new) and compares the results - see compare.sh
#
# /bin/bash bash/tests/self/test.sh
#
# test001   executed
# test002   sourced
# test003   sourced from inside of a function
# test004   sourced in login shell
# test005   shebang, different directory, absolute path, PATH
# test006   strict posix shell (dash)
# test007   script sourcing other script
# test008   function defined in other script
# test009   script executing other script
# test010   symlink
#

CODE=0

/bin/bash bash/tests/self/test001/test.sh || CODE=1
/bin/bash bash/tests/self/test002/test.sh || CODE=1
/bin/bash bash/tests/self/test003/test.sh || CODE=1
/bin/bash bash/tests/self/test004/test.sh || CODE=1
/bin/bash bash/tests/self/test005/test.sh || CODE=1
/bin/bash bash/tests/self/test006/test.sh || CODE=1
/bin/bash bash/tests/self/test007/test.sh || CODE=1
/bin/bash bash/tests/self/test008/test.sh || CODE=1
/bin/bash bash/tests/self/test009/test.sh || CODE=1
/bin/bash bash/tests/self/test010/test.sh || CODE=1

if [ "${CODE}" = "0" ]; then
  echo "[ OK ] ${0}: all test directories passed"
else
  echo "[ ERROR ] ${0}: some test directories failed"
fi

exit "${CODE}"

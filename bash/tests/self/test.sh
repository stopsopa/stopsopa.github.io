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
# arguments: --map and list of pairs <variable> <new name> (only bash/self.sh, old block had nothing like that)
#
# test011   one pair
# test012   more pairs
# test013   wrong arguments - each case: error on stderr, source returns 1, nothing is created:
#             - odd number of arguments after --map
#             - --map without any pair
#             - unknown <variable> (not one of _DIR _0 _SCRIPT _SHELL _BINARY _PWD) on 1st, 3rd or 5th position
#             - <new name> which is not a valid name of variable (starting with digit, with dash, empty)
# test014   arguments of the script itself:
#             - arguments of the script are ignored by self.sh, unless the first one is --map (trap)
#             - forgotten --map is NOT an error, all default variables are created (trap)
# test015   scripts sourcing each other, each with its own names
# test016   function _self with --map (here anything else than --map as the first argument is an error), dash
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
/bin/bash bash/tests/self/test011/test.sh || CODE=1
/bin/bash bash/tests/self/test012/test.sh || CODE=1
/bin/bash bash/tests/self/test013/test.sh || CODE=1
/bin/bash bash/tests/self/test014/test.sh || CODE=1
/bin/bash bash/tests/self/test015/test.sh || CODE=1
/bin/bash bash/tests/self/test016/test.sh || CODE=1

if [ "${CODE}" = "0" ]; then
  echo "[ OK ] ${0}: all test directories passed"
else
  echo "[ ERROR ] ${0}: some test directories failed"
fi

exit "${CODE}"

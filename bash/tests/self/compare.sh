#
# helper for tests of bash/self.sh
#
# Every test script contains both: the old block (which used to be copy-pasted to every script)
# and the line sourcing bash/self.sh. Env var SELF_MODE=old|new decides which one is used.
#
# usage (from root of the repository):
#
#   source bash/tests/self/compare.sh "${0}"
#
#   compare "label" "command" SAME      "expected output of both"
#   compare "label" "command" DIFFERENT "expected output of old block" "expected output of self.sh"
#
# it runs the command with SELF_MODE=old, then with SELF_MODE=new,
# and then compares both results with each other (SAME | DIFFERENT)
# so each compare is 3 tests
#
# stderr is merged to stdout and path to the repository is replaced with <ROOT>
#

source bash/test.sh "${1}"

ROOT="$(pwd -P)"

function compare() {
  local label="${1}" cmd="${2}" verdict="${3}" old="${4}" new="${5}"

  if [ "${verdict}" = "SAME" ]; then
    new="${old}"
  fi

  COMMAND="(export SELF_MODE=old; ${cmd}) 2>&1 | sed 's#${ROOT}#<ROOT>#g'"
  EXPECTED_STDOUT="${old}"
  EXPECTED_STDERR=""
  EXPECTED_CODE="0"
  test "${label} [old block]"
  # (RESULT_STDOUT is local inside of test function, so the command has to be executed again)
  OLD_RESULT="$(eval "${COMMAND}")"

  COMMAND="(export SELF_MODE=new; ${cmd}) 2>&1 | sed 's#${ROOT}#<ROOT>#g'"
  EXPECTED_STDOUT="${new}"
  EXPECTED_STDERR=""
  EXPECTED_CODE="0"
  test "${label} [self.sh]"
  NEW_RESULT="$(eval "${COMMAND}")"

  COMMAND='[ "${OLD_RESULT}" = "${NEW_RESULT}" ] && echo SAME || echo DIFFERENT'
  EXPECTED_STDOUT="${verdict}"
  EXPECTED_STDERR=""
  EXPECTED_CODE="0"
  test "${label} [old block vs self.sh]"
}

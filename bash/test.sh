#
# Small testing library for shell commands: runs a command and compares its stdout, stderr and exit code
# with the expected ones. Meant to be sourced (bash only) at the top of a test script,
# it is not a script to execute on its own.
#
# usage (from the root of the project):
#
#   source bash/test.sh "${0}"
#
#   COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count --save --v"
#   EXPECTED_STDOUT="John have a cat"
#   EXPECTED_STDERR="Cat have a hiv"
#   EXPECTED_CODE="6"
#   test "one"
#
#   COMMAND='...'
#   EXPECTED_STDOUT="..."
#   EXPECTED_STDERR=""
#   EXPECTED_CODE="0"
#   test "two"
#
# and then run the test script:
#
#   /bin/bash bash/node/array_test.sh
#
# The argument of "source" ("${0}") is the name of the test script printed in the messages.
# Exit code of the test script: 0 when everything passed, non zero otherwise.
#
# rules:
#   - COMMAND, EXPECTED_STDOUT, EXPECTED_STDERR and EXPECTED_CODE have to be set before EVERY call of "test",
#     they are unset when "test" ends (nothing is inherited from the previous test). Test without one of them fails.
#   - COMMAND is executed by eval in a subshell with stdin from /dev/null:
#     "exit" in it ends only the COMMAND (and gives its exit code), and it can't read stdin of the test script.
#     If the command needs stdin give it in the COMMAND: COMMAND='echo "y" | mycommand'
#     "cd" or "export" made in the COMMAND are gone after the test.
#   - trailing new lines of stdout and stderr are not compared (they are stripped).
#   - the summary is printed on EXIT (trap). Script is a success only when it reached its end with exit code 0,
#     at least one test was executed and none of them failed.
#     If you need your own EXIT trap then take the exit code first and pass it to test_result:
#       function my_exit { local CODE="${?}"; ...cleaning...; test_result "${CODE}"; }
#       trap my_exit EXIT
#   - WARNING: this library defines function "test", so the builtin "test" is not available
#     in the test script (use [[ ... ]]), and COMMAND, EXPECTED_*, LABEL, STOP, FINAL_EXIT_CODE,
#     TESTS_EXECUTED, __SCRIPT are its variables.
#
# to rerun the test on every change of the files:
#
#   npm install -g chokidar
#   npm install -g chokidar-cli
#   chokidar bash/node/*.* --initial -c '/bin/bash bash/node/array_test.sh'
#
#   NODE_OPTIONS="" /bin/bash bash/node/array_test.sh
#
# note from bash/node/array_test.sh:
#   echo 'abcdefcghi' | node bash/node/array.js --split "/c/g" --count --save --group test --block iter --v 2
#      to see exactly where temporary files are created.
#      because what is interesting it seems os.tmpdir() when var directory is present in cwd() then it will prefer this directory
#      I can't see this in documentation: https://nodejs.org/api/os.html#ostmpdir
#

FINAL_EXIT_CODE="0"
TESTS_EXECUTED="0"
__SCRIPT="${1:-${0}}"

# test <label>
# RESULT_* are set in subshells on purpose: they come back through "typeset -p" + eval
# shellcheck disable=SC2030,SC2031
function test {
    LABEL="${1}"

    TESTS_EXECUTED="$((TESTS_EXECUTED + 1))"

    # Print test label header
    echo "====== ${LABEL} ====== v"

    local MISSING=""

    if [[ -z "${COMMAND}" ]]; then
        MISSING="${MISSING} COMMAND"
    fi

    if [[ -z "${EXPECTED_STDOUT+x}" ]]; then
        MISSING="${MISSING} EXPECTED_STDOUT"
    fi

    if [[ -z "${EXPECTED_STDERR+x}" ]]; then
        MISSING="${MISSING} EXPECTED_STDERR"
    fi

    if [[ -z "${EXPECTED_CODE+x}" ]]; then
        MISSING="${MISSING} EXPECTED_CODE"
    fi

    if [[ -n "${MISSING}" ]]; then

        cat <<EEE
[ ERROR ] ${__SCRIPT}:
LABEL: ${LABEL}
REASON      not set before the test (nothing is inherited from the previous test):${MISSING}

EEE

        FINAL_EXIT_CODE="1"

        unset COMMAND EXPECTED_STDOUT EXPECTED_STDERR EXPECTED_CODE

        return
    fi

    # COMMAND in its own subshell ( ... ): "exit" in the COMMAND must not kill the shell which reports RESULT_CODE
    # < /dev/null: COMMAND must not consume (or wait for) stdin of the test script
    eval "$( ( eval "${COMMAND}" ) < /dev/null \
        2> >(RESULT_STDERR="$(cat)"; typeset -p RESULT_STDERR) \
         > >(RESULT_STDOUT="$(cat)"; typeset -p RESULT_STDOUT); RESULT_CODE="${?}"; typeset -p RESULT_CODE )"

    STOP="0"

    if [[ "${RESULT_CODE}" != "${EXPECTED_CODE}" ]]; then

        cat <<EEE
[ ERROR ] ${__SCRIPT}:
LABEL: ${LABEL}
CMD:
${COMMAND}
REASON      RESULT_CODE != EXPECTED_CODE
RESULT_CODE     >${RESULT_CODE}<
EXPECTED_CODE   >${EXPECTED_CODE}<
RESULT_STDOUT       >${RESULT_STDOUT}<
EXPECTED_STDOUT     >${EXPECTED_STDOUT}<
RESULT_STDERR   >${RESULT_STDERR}<
EXPECTED_STDERR >${EXPECTED_STDERR}<

EEE

        STOP="1"
        FINAL_EXIT_CODE="1"
    fi

    if [[ "${STOP}" == "0" && "${RESULT_STDOUT}" != "${EXPECTED_STDOUT}" ]]; then

        cat <<EEE
[ ERROR ] ${__SCRIPT}:
LABEL: ${LABEL}
CMD:
${COMMAND}
REASON      RESULT_STDOUT != EXPECTED_STDOUT
RESULT_CODE     >${RESULT_CODE}<
EXPECTED_CODE   >${EXPECTED_CODE}<
RESULT_STDOUT       >${RESULT_STDOUT}<
EXPECTED_STDOUT     >${EXPECTED_STDOUT}<
RESULT_STDERR   >${RESULT_STDERR}<
EXPECTED_STDERR >${EXPECTED_STDERR}<

EEE

        STOP="1"
        FINAL_EXIT_CODE="1"
    fi

    if [[ "${STOP}" == "0" && "${RESULT_STDERR}" != "${EXPECTED_STDERR}" ]]; then

        cat <<EEE
[ ERROR ] ${__SCRIPT}:
LABEL: ${LABEL}
CMD:
${COMMAND}
REASON      RESULT_STDERR != EXPECTED_STDERR
RESULT_CODE     >${RESULT_CODE}<
EXPECTED_CODE   >${EXPECTED_CODE}<
RESULT_STDOUT       >${RESULT_STDOUT}<
EXPECTED_STDOUT     >${EXPECTED_STDOUT}<
RESULT_STDERR   >${RESULT_STDERR}<
EXPECTED_STDERR >${EXPECTED_STDERR}<

EEE

        STOP="1"
        FINAL_EXIT_CODE="1"
    fi

    if [[ "${STOP}" == "0" ]]; then
        echo "[ OK ] ${__SCRIPT}: success: command>${COMMAND}<"
    fi

    # next test has to define everything again
    unset COMMAND EXPECTED_STDOUT EXPECTED_STDERR EXPECTED_CODE
}

# test_result [exit code of the script]
# without the argument: exit code with which the script is ending (${?} of the EXIT trap),
# so when it is called from another trap function pass the code, see "rules" above
function test_result {

    # has to be the first command of this function
    local CODE="${?}"

    if [[ -n "${1}" ]]; then
        CODE="${1}"
    fi

    if [[ "${FINAL_EXIT_CODE}" != "0" ]]; then
        cat <<EEE

    ${__SCRIPT} error: Some tests failed (executed: ${TESTS_EXECUTED}).

EEE

        exit "${FINAL_EXIT_CODE}"
    fi

    if [[ "${CODE}" != "0" ]]; then
        cat <<EEE

    ${__SCRIPT} error: script ended with exit code >${CODE}< - not all tests were executed (executed: ${TESTS_EXECUTED}).

EEE

        exit "${CODE}"
    fi

    if [[ "${TESTS_EXECUTED}" == "0" ]]; then
        cat <<EEE

    ${__SCRIPT} error: no tests were executed.

EEE

        exit 1
    fi

    cat <<EEE

    [ OK ] ${__SCRIPT}: All tests passed (${TESTS_EXECUTED}).

EEE
}

trap test_result EXIT

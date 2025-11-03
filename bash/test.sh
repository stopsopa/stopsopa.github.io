
#
# npm install -g chokidar
# npm install -g chokidar-cli
# chokidar bash/node/*.* --initial -c '/bin/bash bash/node/array_test.sh'
# 
# NODE_OPTIONS="" /bin/bash bash/node/array_test.sh
# 

# 
# in case of this particular test run
# echo 'abcdefcghi' | node bash/node/array.js --split "/c/g" --count --save --group test --block iter --v 2
#    to see exactly where temporary files are created.
#    because what is interesting it seems os.tmpdir() when var directory is present in cwd() then it will prefer this directory
#    I can't see this in documentation: https://nodejs.org/api/os.html#ostmpdir

# usage:

# source bash/test.sh "${0}"
# export NODE_OPTIONS=""

# COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count --save --v"
# EXPECTED_STDOUT="John have a cat"
# EXPECTED_STDERR="Cat have a hiv"
# EXPECTED_CODE="6"
# test "one";

FINAL_EXIT_CODE=0
__SCRIPT="${1}"

function test() {   
    LABEL="${1}"

eval "$( eval "${COMMAND}" \
        2> >(RESULT_STDERR=$(cat); typeset -p RESULT_STDERR) \
         > >(RESULT_STDOUT=$(cat); typeset -p RESULT_STDOUT); RESULT_CODE=$?; typeset -p RESULT_CODE )"

    STOP="0"

    if [ "${RESULT_CODE}" != "${EXPECTED_CODE}" ]; then

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

    if [ "${STOP}" = "0" ] && [ "${RESULT_STDOUT}" != "${EXPECTED_STDOUT}" ]; then

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

    if [ "${STOP}" = "0" ] && [ "${RESULT_STDERR}" != "${EXPECTED_STDERR}" ]; then

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
    

    if [ "${STOP}" = "0" ]; then
        echo "[ OK ] ${__SCRIPT}: success: command>${COMMAND}<"
    fi
}

function test_result {

    if [ "${FINAL_EXIT_CODE}" = "0" ]; then
        cat <<EEE

    [ OK ] ${__SCRIPT}: All tests passed.

EEE
    else
        cat <<EEE

    [ ERROR ] ${__SCRIPT}: Some tests failed.

EEE

        exit "${FINAL_EXIT_CODE}"
    fi
}
trap test_result EXIT;




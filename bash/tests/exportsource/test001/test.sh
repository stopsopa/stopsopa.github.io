#
# bash/exportsource.sh and bash/exportsource.ts - both should behave the same
#
# /bin/bash bash/tests/exportsource/test001/test.sh
#

source bash/test.sh "${0}"

export NODE_OPTIONS=""

D="bash/tests/exportsource/test001"
ROOT="$(pwd -P)"

SH="/bin/bash bash/exportsource.sh"
TS="node bash/exportsource.ts"

# ---------- plain.env: comments, empty value, "export" prefix ----------

PLAIN="export ES_A='abc'
export ES_B='a b'
export ES_EMPTY=''
export ES_EXP='exported'
export ES_LAST='last'"

COMMAND="${SH} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: plain"

COMMAND="${TS} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: plain"

COMMAND="${SH} ${D}/plain.env false"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: plain, override false given explicitly"

COMMAND="${TS} ${D}/plain.env false"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: plain, override false given explicitly"

COMMAND="cd ${D} && /bin/bash ../../../exportsource.sh plain.env"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: plain, file given without directory"

COMMAND="cd ${D} && node ../../../exportsource.ts plain.env"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: plain, file given without directory"

# ---------- existing variables, override false ----------

PLAIN_WITHOUT_A="export ES_B='a b'
export ES_EMPTY=''
export ES_EXP='exported'
export ES_LAST='last'"

COMMAND="ES_A=fromenv ${SH} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN_WITHOUT_A}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: existing variable is not overridden"

COMMAND="ES_A=fromenv ${TS} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN_WITHOUT_A}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: existing variable is not overridden"

COMMAND="ES_A= ${SH} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN_WITHOUT_A}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: existing but empty variable is not overridden"

COMMAND="ES_A= ${TS} ${D}/plain.env"
EXPECTED_STDOUT="${PLAIN_WITHOUT_A}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: existing but empty variable is not overridden"

# ---------- existing variables, override true ----------

COMMAND="ES_A=fromenv ${SH} ${D}/plain.env true"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: override true - existing variable is overridden"

COMMAND="ES_A=fromenv ${TS} ${D}/plain.env true"
EXPECTED_STDOUT="${PLAIN}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: override true - existing variable is overridden"

# ---------- special.env: characters which shell would interpret ----------

SPECIAL="export ES_DOLLAR='pa\$\$word \$HOME'
export ES_QUOTE='say \"hi\"'
export ES_BACKTICK='a\`echo INJECTED\`b'
export ES_SUBSHELL='a\$(echo INJECTED)b'
export ES_BACKSLASH='a\\nb'
export ES_SINGLE='it'\\''s'
export ES_MULTI='line1
line2 x'"

COMMAND="${SH} ${D}/special.env"
EXPECTED_STDOUT="${SPECIAL}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: special characters - output"

COMMAND="${TS} ${D}/special.env"
EXPECTED_STDOUT="${SPECIAL}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: special characters - output"

SPECIAL_EVALUATED="ES_DOLLAR=>pa\$\$word \$HOME<
ES_QUOTE=>say \"hi\"<
ES_BACKTICK=>a\`echo INJECTED\`b<
ES_SUBSHELL=>a\$(echo INJECTED)b<
ES_BACKSLASH=>a\\nb<
ES_SINGLE=>it's<
ES_MULTI=>line1
line2 x<"

COMMAND="/bin/bash ${D}/print.sh ${SH} ${D}/special.env"
EXPECTED_STDOUT="${SPECIAL_EVALUATED}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "sh: special characters - values after eval are exactly like in the file"

COMMAND="/bin/bash ${D}/print.sh ${TS} ${D}/special.env"
EXPECTED_STDOUT="${SPECIAL_EVALUATED}"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ts: special characters - values after eval are exactly like in the file"

# ---------- errors: nothing on stdout (it would be evaluated), message on stderr, exit code 1 ----------

COMMAND="${SH} ${D}/nope.env"
EXPECTED_STDOUT=""
EXPECTED_STDERR="bash/exportsource.sh error: file '${D}/nope.env' doesn't exist"
EXPECTED_CODE="1"
test "sh: file doesn't exist"

COMMAND="${TS} ${D}/nope.env"
EXPECTED_STDOUT=""
EXPECTED_STDERR="${ROOT}/bash/exportsource.ts error: file '${D}/nope.env' doesn't exist"
EXPECTED_CODE="1"
test "ts: file doesn't exist"

COMMAND="${SH}"
EXPECTED_STDOUT=""
EXPECTED_STDERR="bash/exportsource.sh error: .env file not specified - provide it in first arg"
EXPECTED_CODE="1"
test "sh: file not specified"

COMMAND="${TS}"
EXPECTED_STDOUT=""
EXPECTED_STDERR="${ROOT}/bash/exportsource.ts error: .env file not specified - provide it in first arg"
EXPECTED_CODE="1"
test "ts: file not specified"

COMMAND="${SH} ${D}/plain.env yes"
EXPECTED_STDOUT=""
EXPECTED_STDERR="bash/exportsource.sh error: second arg (override mode) should be 'true', 'false' or not specified, it is 'yes'"
EXPECTED_CODE="1"
test "sh: wrong override arg"

COMMAND="${TS} ${D}/plain.env yes"
EXPECTED_STDOUT=""
EXPECTED_STDERR="${ROOT}/bash/exportsource.ts error: second arg (override mode) should be 'true', 'false' or not specified, it is 'yes'"
EXPECTED_CODE="1"
test "ts: wrong override arg"

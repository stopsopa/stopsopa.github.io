#
# runs all tests of bash/exportsource.sh and bash/exportsource.ts
#
# /bin/bash bash/tests/exportsource/test.sh
#
# test001   both scripts should behave the same: plain file, existing variables, override, special characters, errors
#

CODE=0

/bin/bash bash/tests/exportsource/test001/test.sh || CODE=1

if [ "${CODE}" = "0" ]; then
  echo "[ OK ] ${0}: all test directories passed"
else
  echo "[ ERROR ] ${0}: some test directories failed"
fi

exit "${CODE}"

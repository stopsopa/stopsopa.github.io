#
# runs all tests of bash/self.sh (and tests documenting behaviour of the old copy-pasted block)
#
# /bin/bash bash/exportsource/test.sh
#
# test001 - test004   BEFORE  old block pasted into every script
# test005 - test006   AFTER   bash/self.sh
#

CODE=0

/bin/bash bash/exportsource/test001/test.sh || CODE=1
/bin/bash bash/exportsource/test002/test.sh || CODE=1
/bin/bash bash/exportsource/test003/test.sh || CODE=1
/bin/bash bash/exportsource/test004/test.sh || CODE=1
/bin/bash bash/exportsource/test005/test.sh || CODE=1
/bin/bash bash/exportsource/test006/test.sh || CODE=1

if [ "${CODE}" = "0" ]; then
  echo "[ OK ] ${0}: all test directories passed"
else
  echo "[ ERROR ] ${0}: some test directories failed"
fi

exit "${CODE}"

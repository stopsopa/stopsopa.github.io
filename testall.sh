
#
# this test executing in order:
#   * unit tests
#   * attempt to kill api and vite server is any is running
#   * build vite
#   * run api server in production mode
#   * int tests
#   * e2e tests (in docker)
#   * attempt to kill api
# 
# If any of above actions will faile this script will exit with non zero exit code
#
# General purpose of this script is to have single script that once executed locally will
# prepare prod server and run all tests against it.
#   For example to make sure that git commit that you are about to push have not introduced regression
#

function cleanup {

    /bin/bash .github/stop-server.sh
}

trap cleanup EXIT;

set -e
set -x

cleanup

/bin/bash build.sh

node server.js --flag "3_${FLAG}" & disown

sleep 1

cat <<EE

    api server should be running now, testing healthcheck:    

EE

TIMEOUT="2000" node .github/healtcheck.js

# cat <<EE

#     INTEGRATION TESTS:

# EE

# TYPE=int /bin/bash jest.sh

cat <<EE

    E2E TESTS:

EE

/bin/bash playwright.sh

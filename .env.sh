
if [ "${NODE_API_PORT}" = "" ]; then

  echo "${0} error: NODE_API_PORT is not defined"

  exit 1;
fi

if [ "${LOCAL_HOSTS}" = "" ]; then

  echo "${0} error: LOCAL_HOSTS is not defined"

  exit 1;
fi

if [ "${FLAG}" = "" ]; then

  echo "${0} error: FLAG is not defined"

  exit 1;
fi

if [ "${PROD_SCHEMA}" = "" ]; then

  echo "${0} error: PROD_SCHEMA is not defined"

  exit 1;
fi

if [ "${PROD_HOSTNAME}" = "" ]; then

  echo "${0} error: PROD_HOSTNAME is not defined"

  exit 1;
fi

TEST="^[0-9]+$"

if ! [[ ${PROD_PORT} =~ ${TEST} ]]; then

    echo "${0} error: PROD_PORT >${PROD_PORT}< don't match ${TEST}"

    exit 1;
fi
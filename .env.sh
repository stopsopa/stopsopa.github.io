
if [ "${NODE_PORT}" = "" ]; then

  echo "${0} error: NODE_PORT is not defined"

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

if [ "${PROD_HOST}" = "" ]; then

  echo "${0} error: PROD_HOST is not defined"

  exit 1;
fi
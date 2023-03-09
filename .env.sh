
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
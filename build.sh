
if [ ! -f ".env" ]; then

    echo "file .env doesn't exist";

    exit 1
fi

source ".env";

if [ "${PROJECT_NAME}" = "" ]; then

    echo "env var PROJECT_NAME is not defined";

    exit 1
fi

if [ "${GITSTORAGE_CORE_REPOSITORY}" = "" ]; then

    echo "env var GITSTORAGE_CORE_REPOSITORY is not defined";

    exit 1
fi

if [ "${LOCAL_HOSTS}" = "" ]; then

    echo "env var LOCAL_HOSTS is not defined";

    exit 1
fi

if [ "${GITHUB_SOURCES_PREFIX}" = "" ]; then

    echo "env var GITHUB_SOURCES_PREFIX is not defined";

    exit 1
fi

if [ "${EXPOSE_EXTRA_ENV_VARIABLES}" = "" ]; then

    echo "env var EXPOSE_EXTRA_ENV_VARIABLES is not defined";

    exit 1
fi

node pages/portsregistry/lists/ports-generator.js

# call those together in this order vvv
/bin/bash uglify.sh
/bin/bash template.sh
# call those together in this order ^^^

node libs/preprocessor.js

node node_modules/.bin/webpack

/bin/bash remove-not-changed-builds.sh
#/bin/bash pages/kubernetes/compress.sh

/bin/bash bash/substitute-variables-bash.sh gitstorage-core.sh -- \
  GITSTORAGE_CORE_REPOSITORY "${GITSTORAGE_CORE_REPOSITORY}" \
  PROD_SCHEMA "${PROD_SCHEMA}" \
  PROD_HOST "${PROD_HOST}"

yarn style:fix

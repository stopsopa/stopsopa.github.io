
if [ ! -f ".env" ]; then

    echo "file .env doesn't exist";

    exit 1
fi

source ".env";

if [ "${GITSTORAGE_CORE_REPOSITORY}" = "" ]; then

    echo "env var GITSTORAGE_CORE_REPOSITORY is not defined";

    exit 1
fi

node pages/portsregistry/lists/ports-generator.js
/bin/bash pages/bookmarklets/compress.sh
/bin/bash remove-not-changed-builds.sh
#/bin/bash pages/kubernetes/compress.sh

/bin/bash bash/substitute-variables.sh gitstorage-core.sh -- \
  GITSTORAGE_CORE_REPOSITORY "${GITSTORAGE_CORE_REPOSITORY}" \
  PROD_SCHEMA "${PROD_SCHEMA}" \
  PROD_HOST "${PROD_HOST}"

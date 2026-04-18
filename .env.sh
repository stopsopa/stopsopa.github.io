
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ENVFILE="${ENVFILE:-.env}"

if [[ -f "${DIR}/${ENVFILE}" ]]; then
    # https://unix.stackexchange.com/a/79065
    eval "$(/bin/bash "${DIR}/bash/exportsource.sh" "${DIR}/${ENVFILE}")"
fi

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

re_number='^[0-9]+$'

# Validate NODE_API_PORT
if [[ -z "${NODE_API_PORT}" ]]; then
    echo "${0} error: NODE_API_PORT is not set"
    exit 1
fi
if ! [[ "${NODE_API_PORT}" =~ ${re_number} ]]; then
   echo "${0} error: NODE_API_PORT=>${NODE_API_PORT}< is not a number"
   exit 1
fi

if [[ -z "${NODE_API_PORT_HTTPS}" ]]; then
    echo "${0} error: NODE_API_PORT_HTTPS is not set"
    exit 1
fi
if ! [[ "${NODE_API_PORT_HTTPS}" =~ ${re_number} ]]; then
   echo "${0} error: NODE_API_PORT_HTTPS=>${NODE_API_PORT_HTTPS}< is not a number"
   exit 1
fi

if [[ -z "${LOCAL_HOSTS}" ]]; then
    echo "${0} error: LOCAL_HOSTS is not set"
    exit 1
fi

if [[ -z "${FLAG}" ]]; then
    echo "${0} error: FLAG is not set"
    exit 1
fi

if [[ -z "${PROD_SCHEMA}" ]]; then
    echo "${0} error: PROD_SCHEMA is not set"
    exit 1
fi

if [[ -z "${PROD_HOSTNAME}" ]]; then
    echo "${0} error: PROD_HOSTNAME is not set"
    exit 1
fi

if [[ -z "${PROD_PORT}" ]]; then
    echo "${0} error: PROD_PORT is not set"
    exit 1
fi
if ! [[ "${PROD_PORT}" =~ ${re_number} ]]; then
   echo "${0} error: PROD_PORT=>${PROD_PORT}< is not a number"
   exit 1
fi
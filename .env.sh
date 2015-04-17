
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ENVFILE="${ENVFILE:-.env}"

if [[ -f "${DIR}/${ENVFILE}" ]]; then
    # https://unix.stackexchange.com/a/79065
    eval "$(/bin/bash "${DIR}/bash/exportsource.sh" "${DIR}/${ENVFILE}")"
fi

source "${DIR}/bash/require_non_empty_var.sh"

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

require_non_empty_and_matching_var "${0}" "NODE_API_PORT" "^[0-9]+$"
require_non_empty_and_matching_var "${0}" "NODE_API_PORT_HTTPS" "^[0-9]+$"
require_non_empty_var "${0}" "LOCAL_HOSTS"
require_non_empty_var "${0}" "FLAG"
require_non_empty_var "${0}" "PROD_SCHEMA"
require_non_empty_var "${0}" "PROD_HOSTNAME"
require_non_empty_and_matching_var "${0}" "PROD_PORT" "^[0-9]+$"

# script is here to assist running docker compose with mysql and pma
# in addition to just spinning those containers it also wait for 'healthy' state of mysql container
# and set proper privileges for external connectivity
# and created database defined in MYSQL_DB env var
# it is also packed with checking that all necessary environments are present

_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

ENV="${_DIR}/../.env"

if [ ! -f "${ENV}" ]; then

  echo "${0} error: ${ENV} doesn't exist"

  exit 1
fi

source "${ENV}"

if [ "${PROJECT_NAME}" = "" ]; then

  echo "${0} error: PROJECT_NAME is not defined"

  exit 1
fi

if [ "${ARANGO_VERSION}" = "" ]; then

  echo "${0} error: ARANGO_VERSION is not defined"

  exit 1
fi

if [ "${ARANGO_COORDINATOR1}" = "" ]; then

  echo "${0} error: ARANGO_COORDINATOR1 is not defined"

  exit 1
fi

if [ "${ARANGO_COORDINATOR2}" = "" ]; then

  echo "${0} error: ARANGO_COORDINATOR2 is not defined"

  exit 1
fi

#set -x
#TMP="$(/bin/bash "${_DIR}/../bash/envrender.sh" "${ENV}" "${_DIR}/docker-compose.yml" --clear -g "doc-up-tmp")"
#set +x

if [ "${1}" = "up" ]; then

    set -e

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose-arango.yml" up -d --remove-orphans
#    docker compose -f "${TMP}" up -d

    set +x

    docker ps | grep "${PROJECT_NAME}"

cat << EOF

  all good

  visit:

    coordinator1:
      http://0.0.0.0:${ARANGO_COORDINATOR1}

    coordinator2:
      http://0.0.0.0:${ARANGO_COORDINATOR2}

EOF

    exit 0;
fi

if [ "${1}" = "down" ]; then

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose-arango.yml" down
#    docker compose -f "${TMP}" down

    docker ps | grep "${PROJECT_NAME}"

    exit 0;
fi

cat << EOF

  # to run container
  /bin/bash ${0} up

  # to stop container
  /bin/bash ${0} down

EOF
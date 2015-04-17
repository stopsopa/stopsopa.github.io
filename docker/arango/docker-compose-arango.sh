
# script is here to assist running docker compose with mysql and pma
# in addition to just spinning those containers it also wait for 'healthy' state of mysql container
# and set proper privileges for external connectivity
# and created database defined in MYSQL_DB env var
# it is also packed with checking that all necessary environments are present

# Generally script is here to quickly create local instance of arangodb in dockerized fashion
# and to control containers name and other parameters from local .env file

# just simply run the script
#     /bin/bash docker-compose-arango.sh
# and if something will be missing just follow instructions on the screen

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

ROOT="${_DIR}/..";

ENV="${ROOT}/.env"

if [ ! -f "${ENV}" ]; then

  echo "${0} error: ${ENV} doesn't exist"

  exit 1
fi

source "${ENV}"

if [ "${PROJECT_NAME}" = "" ]; then

  echo "${0} error: PROJECT_NAME is not defined"

  exit 1
fi

if [ "${ARANGO_SCRIPTING_VERSION}" = "" ]; then

  echo "${0} error: ARANGO_SCRIPTING_VERSION is not defined"

  exit 1
fi

if [ "${ARANGO_SCRIPTING_COORDINATOR1}" = "" ]; then

  echo "${0} error: ARANGO_SCRIPTING_COORDINATOR1 is not defined"

  exit 1
fi

if [ "${ARANGO_SCRIPTING_COORDINATOR2}" = "" ]; then

  echo "${0} error: ARANGO_SCRIPTING_COORDINATOR2 is not defined"

  exit 1
fi

if [ "${1}" = "up" ]; then

    set -e

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose-arango.yml" up -d --remove-orphans

    set +x

    docker ps | grep "${PROJECT_NAME}"

cat << EOF

  all good

  visit:

    coordinator1:
      http://0.0.0.0:${ARANGO_SCRIPTING_COORDINATOR1}

    coordinator2:
      http://0.0.0.0:${ARANGO_SCRIPTING_COORDINATOR2}

EOF

    exit 0;
fi

if [ "${1}" = "down" ]; then

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose-arango.yml" down

    docker ps | grep "${PROJECT_NAME}"

    exit 0;
fi

if [ "${1}" = "rm" ]; then

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose-arango.yml" rm

    docker ps | grep "${PROJECT_NAME}"

    exit 0;
fi

cat << EOF

  # to run container
  /bin/bash ${0} up

  # to stop container
  /bin/bash ${0} down

  # to remove containers
  /bin/bash ${0} rm

EOF
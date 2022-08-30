
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

function check {

  __VAR_NAME="$(eval echo "\$${1}")"

  if [[ -z "${__VAR_NAME}" ]]; then

    echo "${0} error: env var ${1} is not defined"

    exit 1
  fi
}

ENV="${_DIR}/../.env"

if [ ! -f "${ENV}" ]; then

  echo "${0} error: ${ENV} doesn't exist"

  exit 1
fi

source "${ENV}"

check PROJECT_NAME;

check COMPOSE_PROJECT_NAME;

check PHPMYADMIN_PORT;

check MYSQL_HOST;

check MYSQL_PORT;

check MYSQL_USER;

check MYSQL_PASS;

check MYSQL_DB;

check PMA_PMADB;

check PHPMYADMIN_PORT;

#set -x
#TMP="$(/bin/bash "${_DIR}/../bash/envrender.sh" "${ENV}" "${_DIR}/docker-compose.yml" --clear -g "doc-up-tmp")"
#set +x

if [ "${1}" = "up" ]; then

    set -e

    # regarding --project-name : https://github.com/docker/compose/issues/4939
    docker compose --project-name "${COMPOSE_PROJECT_NAME}" --env-file "${ENV}" -f "${_DIR}/docker-compose.yml" up -d
#    docker compose -f "${TMP}" up -d

    CONTAINER="${PROJECT_NAME}_mysql"

    if [ "$(docker inspect -f {{.State.Health.Status}} ${CONTAINER})" != "healthy" ]; then

      set +x

      printf "Waiting for status \"HEALTHY\": ";
      # https://stackoverflow.com/a/33520390/5560682
      until [ "$(docker inspect -f {{.State.Health.Status}} ${CONTAINER})" = "healthy" ]; do
          printf "."
          sleep 3;
      done;
      echo ""
      set -x

    fi

    # https://stackoverflow.com/a/50131831
    docker exec -it "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -e "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}'; flush privileges;"

    docker exec -it "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} /*\!40100 DEFAULT CHARACTER SET utf8 */"

    set +x

    docker ps | grep "${PROJECT_NAME}"

cat << EOF

  all good

  visit:

    http://0.0.0.0:${PHPMYADMIN_PORT}

    watch "docker ps -a && docker logs ${CONTAINER}"

EOF

    exit 0;
fi

if [ "${1}" = "down" ]; then

    docker compose --project-name "${COMPOSE_PROJECT_NAME}" --env-file "${ENV}" -f "${_DIR}/docker-compose.yml" down
#    docker compose -f "${TMP}" down

    docker ps | grep "${PROJECT_NAME}"

    exit 0;
fi

cat << EOF

# script is here to assist running docker compose with mysql and pma
# in addition to just spinning those containers it also wait for 'healthy' state of mysql container
# and set proper privileges for external connectivity
# and created database defined in MYSQL_DB env var
# it is also packed with checking that all necessary environments are present

  # to run container
  /bin/bash ${0} up

  # to stop container
  /bin/bash ${0} down

EOF
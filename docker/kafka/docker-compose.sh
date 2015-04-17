# script is here to assist running docker compose with mysql and pma
# in addition to just spinning those containers it also wait for 'healthy' state of mysql container
# and set proper privileges for external connectivity
# and created database defined in MYSQL_DB env var
# it is also packed with checking that all necessary environments are present

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

ENV="${_DIR}/.env"

if [ ! -f "${ENV}" ]; then

  echo "${0} error: file ${ENV} doesn't exist"

  exit 1
fi

source "${ENV}"

function check {

  __VAR_NAME="$(eval echo "\$${1}")"

  if [[ -z "${__VAR_NAME}" ]]; then

    echo "${0} error: env var ${1} is not defined"

    exit 1
  fi
}

check PROJECT_NAME;

check PHPMYADMIN_PORT;

check MYSQL_DB;

check MYSQL_PORT;

check MYSQL_PASS;

check MYSQL_DEFAULT_CHARACTER_SET;

check PMA_PMADB;

check PROJECT_NAME;

check REDIS_PORT;

check REDISINSIGHT_PORT;

check KAFKA_PORT;

check KAFKA_ZOOKEEPER_PORT;

check KAFKA_KAFDROP_PORT;

check KAFKA_CREATE_TOPICS;

check KAFKA_ADVERTISED_HOST_NAME_EXTRACTING_COMMAND;

KAFKA_ADVERTISED_HOST_NAME="$(eval "${KAFKA_ADVERTISED_HOST_NAME_EXTRACTING_COMMAND}")"

TEST="^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$"

if ! [[ ${KAFKA_ADVERTISED_HOST_NAME} =~ ${TEST} ]]; then

    echo "${0} error: KAFKA_ADVERTISED_HOST_NAME_EXTRACTING_COMMAND(${KAFKA_ADVERTISED_HOST_NAME_EXTRACTING_COMMAND}) after evaluation (${KAFKA_ADVERTISED_HOST_NAME}) have not found host ip address needed to populate env var KAFKA_ADVERTISED_HOST_NAME";

    exit 1;
fi

export KAFKA_ADVERTISED_HOST_NAME;

rm -rf "${_DIR}/persistence/kafka/meta.properties"
# "You should also remove the meta.properties file in the Kafka logs once so that Kafka retrieves the right cluster id from Zookeeper. After that the IDs should match and you don't have to do this anymore."
  # from: https://stackoverflow.com/a/60864763/5560682

if [ "${1}" = "up" ]; then

    set -e

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose.yml" up -d

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
    docker exec -it "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -S /var/lib/mysql/mysql.sock -e "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}'; flush privileges;"

    docker exec -it "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -S /var/lib/mysql/mysql.sock -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} /*\!40100 DEFAULT CHARACTER SET ${MYSQL_DEFAULT_CHARACTER_SET} */"

    set +x

    docker ps | grep "${PROJECT_NAME}"

cat << EOF

  all good

  For PHPMyAdmin visit:

    http://0.0.0.0:${PHPMYADMIN_PORT}

  For redisinsight visit:

    http://0.0.0.0:${REDISINSIGHT_PORT}

    use credentials:
      host      : redis
      port      : 6379
      name      : docker
      username  : <empty>
      password  : <empty>

  Kafdrop UI:

    http://0.0.0.0:${KAFKA_KAFDROP_PORT}

EOF

    exit 0;
fi

if [ "${1}" = "down" ]; then

    docker compose --env-file "${ENV}" -f "${_DIR}/docker-compose.yml" down

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
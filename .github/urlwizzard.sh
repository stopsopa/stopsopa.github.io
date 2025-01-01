
#
# see /research/urlwizzard/urlwizzard.html 
#   to test
#
# /bin/bash .github/urlwizzard.sh
#   above will run only in dry-run mode
#
# to run it for real:
#   CI=true /bin/bash .github/urlwizzard.sh
# or
#   /bin/bash .github/urlwizzard.sh --run
# 
# script is looking for matches and changes them to values driven by PROD_SCHEMA and PROD_HOSTNAME env vars
#
# stopsopa.github.io       location.hostname
#   // will become something like domain.co.uk
# 
# https       location.protocol.replace(/^([a-z]+).*$/, "$1")
#   // usually it will be 'http' or 'https'
# 
# 
#   // ":80" or "" or ":5567"
# 
# 443
#   // simply location.port - sometimes "" sometimes "7439"
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

ROOT="${_DIR}/.."

cd "${ROOT}"

ROOT="$(pwd)"

# it is actually not needed because in CI it will generate additional noise like:
#           Debugger listening on ws://127.0.0.1:35133/beec5c79-0b8f-43c1-b83a-f9ebc185d9a9
#           For help, see: https://nodejs.org/en/docs/inspector
# but for local machine node part will not be called normally, unless forced. 
# I don't necessarily care about forced cases locally
# export NODE_OPTIONS="" 

ENV=".env" 

if [ -f "${ENV}" ]; then

    source "${ENV}";
fi

if [ "${PROD_SCHEMA}" = "" ]; then
    echo "${0} error: PROD_SCHEMA is not defined";

    exit 1
fi

if [ "${PROD_HOSTNAME}" = "" ]; then
    echo "${0} error: PROD_HOSTNAME is not defined";

    exit 1
fi

TEST="^[0-9]+$"

if ! [[ ${PROD_PORT} =~ ${TEST} ]]; then

    echo "${0} error: PROD_PORT >${PROD_PORT}< don't match ${TEST}"

    exit 1;
fi

PROD_SCHEMA_ESCAPED="$(/bin/bash "bash/preg_quote.sh" "${PROD_SCHEMA}")"
PROD_HOSTNAME_ESCAPED="$(/bin/bash "bash/preg_quote.sh" "${PROD_HOSTNAME}")"

PROD_PORT_NEGOTIATED="$(/bin/bash "bash/negotiatePort.sh" "${PROD_SCHEMA}" "${PROD_PORT}" ":")"
PROD_HOST_ESCAPED="${PROD_HOSTNAME_ESCAPED}${PROD_PORT_NEGOTIATED}"

# set -e
# cat <<EEE
# PROD_SCHEMA_ESCAPED>${PROD_SCHEMA_ESCAPED}<
# PROD_HOSTNAME_ESCAPED>${PROD_HOSTNAME_ESCAPED}<
# PROD_PORT_NEGOTIATED>${PROD_PORT_NEGOTIATED}<
# PROD_HOST_ESCAPED>${PROD_HOST_ESCAPED}<
# EEE
# exit 0
# set +e;

# WARNING: 
# IF YOU WOULD LIKE TO ADD ANOTHER DIRECTORY TO NOT ENTER BE CAREFUL WITH -o
# IT SHOULD AFTER ALL EXCEPT LAST ONE LINE IN FIRST \( ... \)
# WARNING: 
S="\\"
FIND="$(cat <<EOF
find . \( $S
    -type d -name node_modules -prune -o $S
    -type d -name .git -prune -o $S
    -type d -name .github -prune -o $S
    -type d -name dist -prune -o $S
    -type d -name docker -prune -o $S
    -type d -name bash -prune -o $S
    -type d -name coverage -prune -o $S
    -type d -name var -prune -o $S
    -type d -name noprettier -prune $S
\) $S
-o $S
\( -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.scss" -o -name "*.sh" \) -print \) | sort
EOF
)"

cat <<EEE

${0} log:

PROD_HOSTNAME>${PROD_HOSTNAME}<
PROD_SCHEMA>${PROD_SCHEMA}<

PROD_SCHEMA_ESCAPED>${PROD_SCHEMA_ESCAPED}<
PROD_HOSTNAME_ESCAPED>${PROD_HOSTNAME_ESCAPED}<

PROD_PORT_NEGOTIATED>${PROD_PORT_NEGOTIATED}<
PROD_HOST_ESCAPED>${PROD_HOST_ESCAPED}<

${FIND}

EEE

if [ "${PROD_HOST_ESCAPED}" = "" ]; then

    echo "${0} error: PROD_HOSTNAME_ESCAPED or PROD_HOST_ESCAPED is not defined";

    exit 1
fi

FIND="${FIND//\\$'\n'/}"

# or capture result
LIST="$(eval "${FIND}")" 

cat <<EEE

${0}: found for processing:

EEE

while read -r FILE
do
echo "${0}: found: ${FILE}"
done <<< "${LIST}"

MATCHING=()

MATCH="urlwizzard\.hostnegotiated|urlwizzard\.hostname|urlwizzard\.schema|urlwizzard\.portnegotiated|urlwizzard\.port|GITHUB_SOURCES_PREFIX"

while read -r FILE
do
    if grep -Eq "${MATCH}" "$FILE"; then

        # add to the end of array
        MATCHING+=("${FILE}") 
    fi
done <<< "${LIST}"

# to new line separated list
MATCHING=$(printf "%s\n" "${MATCHING[@]}")

cat <<EEE

${0}: list of files where match >${MATCH}< was found FOUND:

EEE

while read -r FILE
do
echo "${0} match: ${FILE}"
done <<< "${MATCHING}"

if [ "${CI}" != "" ] || [ "${1}" = "--run" ]; then

    if [ "${CI}" != "" ]; then
        cat <<EEE

${0}: env var CI="${CI}" found, processing on...

EEE
    fi

    if [ "${1}" = "--run" ]; then
        cat <<EEE

${0}: --run argument was given, processing on...

EEE
    fi

    if [ "${MATCHING}" = "" ]; then

  cat <<EEE

  ${0}: nothing to process

EEE
    else

        while read -r MATCHINGFILE
        do
            if [ "${MATCHINGFILE}" != "" ]; then
                echo "${0}: processing ${MATCHINGFILE}"    
                perl -pi -e "s/urlwizzard\.hostname/${PROD_HOSTNAME_ESCAPED}/g" "${MATCHINGFILE}"
                perl -pi -e "s/urlwizzard\.schema/${PROD_SCHEMA_ESCAPED}/g" "${MATCHINGFILE}"
                perl -pi -e "s/urlwizzard\.hostnegotiated/${PROD_HOST_ESCAPED}/g" "${MATCHINGFILE}"
                perl -pi -e "s/urlwizzard\.portnegotiated/${PROD_PORT_NEGOTIATED}/g" "${MATCHINGFILE}"
                perl -pi -e "s/urlwizzard\.port/${PROD_PORT}/g" "${MATCHINGFILE}"
                perl -pi -e "s/GITHUB_SOURCES_PREFIX/g" "${GITHUB_SOURCES_PREFIX}"
            fi        
        done <<< "${MATCHING}"

        cat <<EEE

${0}: finished

EEE

    fi

else
    cat <<EEE

    WARNING:

    ${0}: will not process matching files because CI env var is not present
        nor --run argumet was passed

EEE

fi


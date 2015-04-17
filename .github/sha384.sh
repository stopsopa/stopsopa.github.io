#
# replaces all             
#       sha384.sh::pages/vault/vault.sh
#       to
#       sha384-OdBGfw1BV7BWBiuVl5BDC5KREOG6aHeoK9kCLSvM7rczqmRDoc/u2ViiBp6LmeDy
#       real sha384 generated from file pages/vault/vault.sh
# in all found *.html files
#
# /bin/bash .github/sha384.sh
#   above will run only in dry-run mode
#
# to run it for real:
#   CI=true /bin/bash .github/sha384.sh
# or
#   /bin/bash .github/sha384.sh --run
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

cd "${ROOT}"

# it is actually not needed because in CI it will generate additional noise like:
#           Debugger listening on ws://127.0.0.1:35133/beec5c79-0b8f-43c1-b83a-f9ebc185d9a9
#           For help, see: https://nodejs.org/en/docs/inspector
# but for local machine node part will not be called normally, unless forced. 
# I don't necessarily care about forced cases locally
# export NODE_OPTIONS="" 

S="\\"
FIND="$(cat <<EOF
find "pages" -type f -name "*.html"
EOF
)"

cat <<EEE

${0} log:

$FIND

EEE

FIND="${FIND//\\$'\n'/}"

# or capture result
LIST="$(eval "${FIND}")" 

LIST=$(cat <<END
${LIST}
index.html
END
)

cat <<EEE

${0}: found for processing:

EEE

while read -r FILE
do
echo "${0}: found: ${FILE}"
done <<< "${LIST}"

MATCHING=()

# look for sha384::
MATCH="sha384\.sh::"

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

RUN="0";

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

    RUN="1";
else
    cat <<EEE

    WARNING:

    ${0}: dry-run mode, files will not be procesed. 
    reason: CI env var is not present nor --run argumet was passed

EEE

fi





if [ "${MATCHING}" = "" ]; then

  cat <<EEE

  ${0}: nothing to process

EEE
else

    STATUS="0"

    while read -r MATCHINGFILE
    do
        if [ "${MATCHINGFILE}" != "" ]; then

            if [ "${RUN}" = "1" ]; then
                echo "${0}: processing ${MATCHINGFILE}" 
                
                node .github/sha384.cjs "${MATCHINGFILE}"
            else
                echo "${0}: checking ${MATCHINGFILE}" 
                
                node .github/sha384.cjs "${MATCHINGFILE}" --dry-run
            fi

            if [ "${?}" != "0" ]; then
                STATUS="1"
            fi
        fi        
    done <<< "${MATCHING}"

    cat <<EEE

${0}: finished

EEE

    exit ${STATUS}

fi



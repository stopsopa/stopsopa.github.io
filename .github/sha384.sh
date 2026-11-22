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
# to list files which will be processed (those containing the marker at least once):
#   { find "pages" -type f -name "*.html"; echo "index.html"; } | xargs grep -l "sha384\.sh::"
# to list every occurrence with line numbers:
#   { find "pages" -type f -name "*.html"; echo "index.html"; } | xargs grep -n "sha384\.sh::"
#
# example snippet for the html page (download, verify, run or delete):
# only first three lines change from case to case, rest stays identical
#
#   URL="urlwizzard.schema://urlwizzard.hostnegotiated/pages/node/curl.js"
#   FILE="curl.js"
#   SHA384="sha384.sh::pages/node/curl.js"
#
#   if command -v wget > /dev/null; then
#     wget --no-cache -O "${FILE}" "${URL}"
#   else
#     curl -fL "${URL}" -o "${FILE}"
#   fi
#
#   if [ "sha384-$(openssl dgst -sha384 -binary "${FILE}" | base64)" = "${SHA384}" ]; then
#     echo "checksum verified"
#     /bin/bash "${FILE}"
#   else
#     echo "checksum corrupted - deleting file"
#     rm -f "${FILE}"
#   fi
#
# example snippet to only execute the script (download to temporary file, verify,
# pass to bash only when verified, nothing is left on the disk):
# only first two lines change from case to case, arguments for the script go after "${FILE}"
#
#   URL="urlwizzard.schema://urlwizzard.hostnegotiated/pages/node/curl.js"
#   SHA384="sha384.sh::pages/node/curl.js"
#   FILE="$(mktemp)"
#
#   if command -v wget > /dev/null; then
#     wget --no-cache -O "${FILE}" "${URL}"
#   else
#     curl -fL "${URL}" -o "${FILE}"
#   fi
#
#   if [ "sha384-$(openssl dgst -sha384 -binary "${FILE}" | base64)" = "${SHA384}" ]; then
#     echo "checksum verified"
#     /bin/bash "${FILE}"
#   else
#     echo "checksum corrupted - not executing"
#   fi
#
#   rm -f "${FILE}"
#
# NOTICE: marker ends on first double quote, so keep it as the last thing inside "..."
# NOTICE: path in the marker is relative to the root of the repository
#
# more: .github/sha384.md
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
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
export NODE_OPTIONS="" 

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



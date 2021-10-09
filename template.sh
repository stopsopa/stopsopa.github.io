
# Usually it's good idea to execute it after /bin/bash uglify.sh

# Finds all *.template.html files in this directory (excluding searching through node_modules)
# and then pass this file through babel and then through uglifyjs
# then generates from each *.template.html corresponding *.template.html in the same location

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

set -e
#set -x

if [ ! -e ""${DIR}/node_modules/.bin/uglifyjs"" ]; then

    echo "${0} error: ${DIR}/node_modules/.bin/uglifyjs doesn't exist"

    exit 1
fi

LIST="$(find . -type d -name 'node_modules' -prune -o -type f -name '*.template.html' -print)"

while read -r FILE
do

  FILE="$(realpath "${FILE}")"

  PD="$(dirname "${FILE}")"
  PB="$(basename "${FILE}")"
  EXTENSION="${PB##*.}"
  FILENAME="${PB%.*}"
  if [ "${FILENAME}" = "" ]; then
    FILENAME="${PB}"
    EXTENSION=""
  fi
  if [ "${FILENAME}" = "${PB}" ]; then
    EXTENSION=""
  fi

  FILENAME2="${FILENAME%.*}"

  MIN="$(realpath "${PD}/${FILENAME2}.${EXTENSION}")"

  echo "bash: processing \"${FILE}\""

  node "${DIR}/template.js" "${FILE}" "${MIN}"

  echo "bash: generated  \"${MIN}\""

  echo ""

done <<< "${LIST}"
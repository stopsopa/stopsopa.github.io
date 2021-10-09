
# Usually it's good idea to execute it before /bin/bash template.sh

# Finds all *.uglify.js files in this directory (excluding searching through node_modules)
# and then pass this file through babel and then through uglifyjs
# then generates from each *.uglify.js corresponding *.uglify.min.js in the same location

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

set -e
#set -x

if [ ! -e ""${DIR}/node_modules/.bin/uglifyjs"" ]; then

    echo "${0} error: ${DIR}/node_modules/.bin/uglifyjs doesn't exist"

    exit 1
fi

LIST="$(find . -type d -name 'node_modules' -prune -o -type f -name '*.uglify.js' -print)"

while read -r FILE
do

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
#
  TMP="${PD}/${FILENAME}.tmp.${EXTENSION}"

  MIN="${PD}/${FILENAME}.min.${EXTENSION}"

  echo "processing \"${FILE}\""

  node node_modules/.bin/babel "${FILE}" -o "${TMP}"

  node "${DIR}/node_modules/.bin/uglifyjs" "${TMP}" -o "${MIN}" -m -c toplevel,sequences=false --mangle-props

  rm -rf "${TMP}"

  echo "generated  \"${MIN}\""

  echo ""

done <<< "${LIST}"
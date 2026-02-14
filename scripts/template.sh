
# Usually it's good idea to execute it after /bin/bash scripts/uglify.sh

# Finds all *.template.html and process them to *.rendered.html in the same location
# <%url pages/bookmarklets/jira-create.uglify.min.js %>
# <%inject pages/bookmarklets/periscope.uglify.js %>

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

cd "${_DIR}/.."

# export NODE_OPTIONS="" 

set -e
#set -x

if [ ! -e "node_modules/.bin/esbuild" ]; then

    echo "${0} error: node_modules/.bin/esbuild doesn't exist"

    exit 1
fi

function process_file {
  local FILE="${1}"

  if [ ! -f "${FILE}" ]; then
    echo "Error: File \"${FILE}\" not found"
    return 1
  fi

  FILE="$(/bin/bash "bash/realpath.sh" "${FILE}")"

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

  MIN="$(/bin/bash "bash/realpath.sh" "${PD}/${FILENAME2}.rendered.${EXTENSION}")"

  echo "bash: processing \"${FILE}\""

  node "scripts/template.js" "${FILE}" "${MIN}"

  echo "bash: generated  \"${MIN}\""

  echo ""
}


if [ "$1" = "" ]; then
  LIST="$(find . -type d -name 'node_modules' -prune -o -type f -name '*.template.html' -print)"

  while read -r FILE
  do
    process_file "${FILE}"
  done <<< "${LIST}"
else
  process_file "$1"
fi
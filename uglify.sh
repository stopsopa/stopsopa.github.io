
# Usually it's good idea to execute it before /bin/bash template.sh

# Finds all *.uglify.js files in this directory
# and then pass this file through babel and then through uglifyjs
# then generates from each *.uglify.js corresponding *.uglify.min.js in the same location

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

export NODE_OPTIONS="" 

cd "${_DIR}"

set -e
#set -x

if [ ! -e node_modules/.bin/esbuild ]; then

    echo "${0} error: node_modules/.bin/esbuild doesn't exist"

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

  # node node_modules/.bin/babel "${FILE}" -o "${TMP}"

  # node "${_DIR}/node_modules/.bin/uglifyjs" "${TMP}" -o "${MIN}" -m -c toplevel,sequences=false --mangle-props
  # node "${_DIR}/node_modules/.bin/esbuild" "${TMP}" --bundle --minify --outfile="${MIN}" --target=es6

  # after incorporating esbuild-minify-templates https://github.com/maxmilton/esbuild-minify-templates
  node uglify.mjs --input "${FILE}" --output "${MIN}"

  rm -rf "${TMP}"

  echo "generated  \"${MIN}\""

  echo ""

done <<< "${LIST}"
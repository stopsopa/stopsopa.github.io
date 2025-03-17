
# bundles all files "*.node.js" or "*.node.cjs" or "*.node.mjs"
# and processes it to xx.node.bundled.gitignored.js
# and then it copies each of xx.node.bundled.gitignored.js to xx.node.bundled.gitignored.cjs right next to it
#
# /bin/bash esbuild.sh                     - just build and finish
# /bin/bash esbuild.sh whatever            - build and then watch files

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

cd "${_DIR}"

export NODE_OPTIONS="" 

if [ ! -e "${_DIR}/node_modules/.bin/esbuild" ]; then

    echo "${0} error: ${DIR}/node_modules/.bin/esbuild doesn't exist"

    exit 1
fi

EXEFIND="find . \( \
    -type d -name node_modules -prune -o \
    -type d -name .git -prune -o \
    -type d -name coverage -prune \
\) \
-o \
\( -type f \( -name "*.node.js" -o -name "*.node.cjs" -o -name "*.node.mjs" \) -print \)"

LIST="$(eval "${EXEFIND}")"

VARFILE="${_DIR}/var/esbuild.txt";

echo -n "${LIST}" > "${VARFILE}"

if [ "${1}" = "" ]; then
    node esbuild.js "${VARFILE}"
else
    node esbuild.js "${VARFILE}" --watch
fi

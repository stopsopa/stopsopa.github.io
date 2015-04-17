# remove all from coverage/* directory, except to file coverage/coverage-badge.svg

cat <<EEE

No need for this one really, I will not remove content of directory coverage before publishing to github actions
but it's still interesting script to remove everything from directory except SOMETHING
EEE

exit 1

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac
_PWD="$(pwd)"

set -e
set -x

cd "${_DIR}/../../coverage"

set +x

LIST="$(find . -mindepth 1 -maxdepth 1 | grep -v -i -E '^\./coverage-badge\.svg$' || true)"

if [ "${LIST}" = "" ]; then
    echo nothing found to remove
else
cat <<EEE
deleting:
${LIST}
EEE
fi

cat <<EEE | xargs -I % rm -rf "%"
${LIST}
EEE
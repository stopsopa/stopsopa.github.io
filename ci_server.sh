
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
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

ROOT="${_DIR}"

set -e
set -x

if [ ! -f "${ROOT}/.env" ]; then
  
  echo "${0} error: file ${ROOT}/.env doesn't exist"

  exit 1
fi

source "${ROOT}/.env"

if [ ! -f "${ROOT}/.env.sh" ]; then
  
  echo "${0} error: file ${ROOT}/.env doesn't exist"

  exit 1
fi

source "${ROOT}/.env.sh"

node server.js --flag "3_${FLAG}" 

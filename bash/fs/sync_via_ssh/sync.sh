
#   
# call from machine directory lie
# ovh-hello-world/
# where is
# ovh-hello-world/scripts/.env.sh
# and then call
# /bin/bash ../scripts/sync/sync.sh
#   

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

_ROOT="$(cd "${_DIR}/../.." && pwd)"

cd "${_ROOT}";

set -euo pipefail

/bin/bash "${_PWD}/scripts/hostwall.sh" mac

# that should be .env.sh from given machien
# so this entire command is to be called from particular machine directory like /ovh-hello-world
source "${_PWD}/scripts/.env.sh"

export NODE_OPTIONS=

fswatch -r -x --event-flag-separator=, . | \
    NODE_OPTIONS= node scripts/sync/transform.ts | \
    NODE_OPTIONS= node scripts/sync/filter-gitignored.ts .syncignore | \
    NODE_OPTIONS= node scripts/sync/sync.ts
    

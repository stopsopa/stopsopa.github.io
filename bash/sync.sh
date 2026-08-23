

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

DUMPFILE="${_DIR}/sync.dump"

HELP=1
if [ "${1}" = "dump" ]; then
HELP=0


fi

if [ "${1}" = "pull" ]; then
HELP=0



fi

if [ "${1}" = "pull-existing" ]; then
HELP=0


fi

if [ "${HELP}" = "1" ]; then

  cat <<EEE

/bin/bash ${0} dump
    # to create local dump file: ${DUMPFILE}

/bin/bash ${0} pull
    # to sync all local with remote

/bin/bash ${0} pull-existing
    # to sync only these which exist locally

EEE

fi
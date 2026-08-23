set -e

WEB="https://stopsopa.github.io"

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

source "${_DIR}/realpath_v2.sh"

DUMPFILE="$(relative_path "$(pwd)" "${_DIR}/bash.tar.gz" )"

HELP=1
if [ "${1}" = "dump" ]; then
HELP=0

FOUND="$(find bash -type f ! -path "$DUMPFILE" | sort)"

rm -f "${DUMPFILE}"

printf '%s\n' "${FOUND}" | tar -czf "${DUMPFILE}" -T -

cat <<EEE

${0} output:
CREATED ${DUMPFILE} WITH >>
${FOUND}
<<

EEE

ls -la ${DUMPFILE}

fi

TARGETDIR=""
function prepareDir {
  while true
  do
    TARGETDIR="$(openssl rand -hex 2)"

    echo "checking TARGETDIR >${TARGETDIR}<"

    if ! [ -d "${TARGETDIR}" ]; then

      echo "TARGETDIR >${TARGETDIR}< can be created"

      break;
    fi
  done

  mkdir "${TARGETDIR}"

  trap "rm -rf \"${TARGETDIR}\"" EXIT
}

if [ "${1}" = "pull" ]; then
HELP=0

prepareDir



cat <<EEE

TARGETDIR >${TARGETDIR}<

EEE




  printf "\n      Press Enter to continue\n"
  read

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
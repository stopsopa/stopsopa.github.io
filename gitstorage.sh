#!/bin/bash

#GITSTORAGESOURCE="git@github.com:xxx/gitstorage.git"

exec 3<> /dev/null
function green {
  printf "\e[32m${1}\e[0m\n"
}

function red {
  printf "\e[31m${1}\e[0m\n"
}

function yellow {
  printf "\e[33m${1}\e[0m\n"
}

set -e
#set -x

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

_CONFIG="${_DIR}/gitstorage-config.sh";
_CREATE="0"
_FORCE="0"
_BACKUP="0"
_RESTORE="0"

PARAMS=""

while (( "${#}" )); do
  case "${1}" in
    --force)
      _FORCE="1";
      shift;
      ;;
    --create)
      _CREATE="1";
      shift;
      ;;
    -c|--config)
      _CONFIG="${2}";
      shift 2;
      ;;

    --backup)
      _BACKUP="1";
      shift;
      ;;
    --restore)
      _RESTORE="1";
      shift;
      ;;
    -*|--*=) # unsupported flags
      { red "${0} error: Unsupported flag ${1}"; } 2>&3
      exit 1;
      ;;
    *) # preserve positional arguments
      if [ "${PARAMS}" = "" ]; then
          PARAMS="\"${1}\""
      else
          PARAMS="${PARAMS} \"${1}\""
      fi
      shift;
      ;;
  esac
done

CONFIG=$(cat <<END
#!/bin/bash

# used in
# https://github.com/user/repositiry

GITSTORAGESOURCE="git@github.com:xxx/gitstorage.git"

GITSTORAGETARGETDIR="github-xxx.github.io"

GITSTORAGELIST=(
    ".env::\$GITSTORAGETARGETDIR/.env"
    "gitstorage-config.sh::\$GITSTORAGETARGETDIR/gitstorage-config.sh"
)
END
);

if [ "${_CREATE}" = "1" ]; then

  if [ -f gitstorage-config.sh ]; then

    { red "\n    file gitstorage-config.sh already exist\n"; } 2>&3
  else

    echo "${CONFIG}" > gitstorage-config.sh

    { green "\n    file gitstorage-config.sh created\n"; } 2>&3
  fi

  exit 0;
fi

if [ "${_CONFIG}" = "" ]; then

  { red "${0} error: --config value can't be empty"; } 2>&3

  exit 1;
fi

if ! [ -f "${_CONFIG}" ]; then

  { red "${0} error: --config file '${_CONFIG}' doesn't exist"; } 2>&3

  exit 1;
fi

source "${_CONFIG}";

_GITHUB="^git@github"

if [[ ${GITSTORAGESOURCE} =~ ${_GITHUB} ]]; then

  URL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")/tree/master/${GITSTORAGETARGETDIR}"
else

  URL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")/raw/master/${GITSTORAGETARGETDIR}"
fi

# this will check if array exist and it will count it,
# if it doesn't exist and can't be counted then this will return 0
_COUNT="${#GITSTORAGELIST[@]}";

if [ ${_COUNT} -lt 1 ] ; then

  { red "${0} error: list GITSTORAGELIST in config '${_CONFIG}' shouldn't be empty"; } 2>&3

  exit 1;
fi

# set positional arguments in their proper place
eval set -- "${PARAMS}"

if [ "${1}" = "" ] || [ "${1}" = "--help" ]; then

cat << EOF

Just create config file gitstorage-config.sh like:

  use command

    /bin/bash "${0}" --create

  to create it

>>>>>>>
${CONFIG}
<<<<<<<<


and use this script like:

/bin/bash ${0} isinsync
/bin/bash ${0} diff
/bin/bash ${0} pull
/bin/bash ${0} push
/bin/bash ${0} url

# you can specify different config
/bin/bash ${0} -c "gitstorage-config.sh"

EOF


  exit 0
fi

MODE="${1}"

shift;

TEST="^(url|isinsync|diff|pull|push|backup|restore)$"

if ! [[ ${MODE} =~ ${TEST} ]]; then

  { red "${0} error: mode ${MODE} don't match pattern ${TEST}"; } 2>&3

  exit 1;
fi

TEST="^(backup|restore)$"

if [[ ${MODE} =~ ${TEST} ]]; then

  if [ "${1}" = "" ]; then

    { red "${0} error: mode ${MODE} - directory not specified"; } 2>&3
  fi

  mkdir -p "${1}";
fi

_CONFIGDIR="$(dirname "${_CONFIG}")"

if [ ${MODE} = "url" ]; then

  echo "final url ${URL}";

  exit 0
fi

if [ ${MODE} = "backup" ]; then

  _TARGETGITDIR="${1}"

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_S}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_S}' -> '${_T}'"; } 2>&3

      cp "${_S}" "${_T}"

    else

      { red "${0} error: source file '${_S}' doesn't exist"; } 2>&3
    fi

  done

  { green "\n    files backup created\n"; } 2>&3

  exit 0;
fi

if [ ${MODE} = "restore" ]; then

  _TARGETGITDIR="${1}"

  for index in "${GITSTORAGELIST[@]}"; do

    _T="${index%%::*}"

    _S="${_TARGETGITDIR}/${_T}"

    _TT="${_T}"

    if ! [[ ${_T} =~ ^~{0,1}/.* ]]; then

      _TT="${_CONFIGDIR}/${_T}"
    fi

    eval _TT="${_TT}"

    if [ -f "${_S}" ]; then

      _TMPDIR="$(dirname "${_TT}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_S}' -> '${_T}'"; } 2>&3

      cp "${_S}" "${_TT}"
    else

      { red "file '${_S}' doesn't exist in backup directory"; } 2>&3
    fi

  done

  { green "\n    files restored\n"; } 2>&3

  exit 0;
fi

_TARGETGITDIR="";

while true
do

  _TARGETGITDIR="${_CONFIGDIR}/$(openssl rand -hex 2)"

  if ! [ -d "${_TARGETGITDIR}" ]; then

    break;
  fi
done

function cleanup {

  rm -rf "${_TARGETGITDIR}" || true
}

trap cleanup EXIT

mkdir -p "${_TARGETGITDIR}"




if [ ${MODE} = "isinsync" ]; then

  (cd "${_TARGETGITDIR}" && git clone "${GITSTORAGESOURCE}" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _S="${_CONFIGDIR}/${_S}"
    fi

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      { red "${0} error: source file '${_S}' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "${_TARGETGITDIR}" && git status -s)"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  { red "\n    files are not in sync\n"; } 2>&3

  (cd "${_TARGETGITDIR}" && git status)

  echo "final url ${URL}";

  exit 1;
fi


if [ ${MODE} = "diff" ]; then

  (cd "${_TARGETGITDIR}" && git clone "${GITSTORAGESOURCE}" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _S="${_CONFIGDIR}/${_S}"
    fi

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      { red "${0} error: source file '${_S}' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "${_TARGETGITDIR}" && git status -s)"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  { red "\n    files are not in sync\n"; } 2>&3

  (cd "${_TARGETGITDIR}/${GITSTORAGETARGETDIR}" && git diff)

  (cd "${_TARGETGITDIR}/${GITSTORAGETARGETDIR}" && git status)

  echo "final url ${URL}";

  exit 1;
fi




if [ ${MODE} = "push" ]; then

  if [ "${_FORCE}" = "0" ]; then

    set +e

    /bin/bash "${0}" -c "${_CONFIG}" isinsync

    if [ "${?}" = "0" ]; then

      echo "final url ${URL}";

      exit 0;
    else

      { red "${0} error: files are not in sync, if you sure that you want to push them add --force param"; } 2>&3

      echo "final url ${URL}";

      exit 1;
    fi

    set -e
  fi

  (cd "${_TARGETGITDIR}" && git clone "${GITSTORAGESOURCE}" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"


      # making sure that file will be copied in at least one directory
      _TMPDIR="$(dirname "${_T}")"

      if [ "${_TMPDIR}" = "." ]; then

        { red "${0} error: target file '${_T}' should be in folder like 'xxx/${_T}'"; } 2>&3

        exit 1

      fi

    _SS="${_S}"

    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _SS="${_CONFIGDIR}/${_S}"
    fi

    eval _SS="${_SS}"

    if [ -f "${_SS}" ]; then

      _TT="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_TT}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_S}' -> '${_T}'"; } 2>&3

      cp "${_SS}" "${_TT}"

    else

      { red "${0} error: source file '${_SS}' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "${_TARGETGITDIR}" && git status -s)"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      echo "final url ${URL}";

      exit 0;
  fi

  (cd "${_TARGETGITDIR}" && git add .)

  (cd "${_TARGETGITDIR}" && git commit -a --allow-empty-message -m '')

  (cd "${_TARGETGITDIR}" && git push origin master)

  { green "\n    files pushed\n"; } 2>&3

  echo "final url ${URL}";

  exit 0;
fi



if [ ${MODE} = "pull" ]; then

  if [ "${_FORCE}" = "0" ]; then

    set +e

    /bin/bash "${0}" -c "${_CONFIG}" isinsync

    if [ "${?}" = "0" ]; then

      echo "final url ${URL}";

      exit 0;
    else

      { red "${0} error: files are not in sync, if you sure that you want to pull them add --force param"; } 2>&3

      echo "final url ${URL}";

      exit 1;
    fi

    set -e
  fi

  (cd "${_TARGETGITDIR}" && git clone "${GITSTORAGESOURCE}" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    _SS="${_S}"

    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _SS="${_CONFIGDIR}/${_S}"
    fi

    eval _SS="${_SS}"

    _TT="${_TARGETGITDIR}/${_T}"

    if [ -f "${_TT}" ]; then

      _TMPDIR="$(dirname "${_SS}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_T}' -> '${_S}'"; } 2>&3

      cp "${_TT}" "${_SS}"
    else

      { red "file '${_TT}' doesn't exist in repository, it might be worth to remove it from config file '${_CONFIG}'"; } 2>&3
    fi

  done

  { green "\n    files pulled\n"; } 2>&3

  echo "final url ${URL}";

  exit 0;
fi

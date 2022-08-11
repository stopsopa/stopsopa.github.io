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

_CONFIG=".git/gitstorage-config.sh";
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

/bin/bash ${0} isinsync
/bin/bash ${0} diff
/bin/bash ${0} pull
/bin/bash ${0} push
/bin/bash ${0} url
/bin/bash ${0} move git@xxx:project/source-repo.git git@yyy/target-repo.git

# you can specify different config
/bin/bash ${0} -c "gitstorage-config.sh"

EOF


  exit 0
fi

MODE="${1}"

shift;

TEST="^(url|isinsync|diff|pull|push|backup|restore|move)$"

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


if [ ${MODE} = "move" ]; then

function deslash {
  echo "$(echo "${1}"| sed -E 's/\//__/g')"
}

  echo "${URL}"

  SOURCE="${1}"

  FROM="$(deslash "${SOURCE}")"

  shift;

  TARGET="${1}"

  TO="$(deslash "${TARGET}")"

  shift;

  _GITHUB="^git@github"

  if [[ ${GITSTORAGESOURCE} =~ ${_GITHUB} ]]; then

    BASEURL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")"
  else

    BASEURL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")"
  fi

  RENAMEDIRLINK="${BASEURL}/edit/master/${FROM}/gitstorage-config.sh"

  EDITCONFIG="${BASEURL}/edit/master/${TO}/gitstorage-config.sh"

colorred=$(tput setaf 2)

coloryellow=$(tput setaf 3)

colorreset=$(tput sgr0)

cat <<DOC

Go to repository and file:

  ${colorred}${RENAMEDIRLINK}${colorreset}

rename directory:

  ${colorred}${FROM}${colorreset}

to:

  ${colorred}${TO}${colorreset}

manual how to do it via GitHub:

  ${coloryellow}https://github.blog/2013-03-15-moving-and-renaming-files-on-github${colorreset}

AND ALSO IN ONE MOVE, while you are on that page, change in gitstorage-config.sh itself variable:

    GITSTORAGETARGETDIR="${FROM}"

    to

    GITSTORAGETARGETDIR="${TO}"

You can check everything if it's ok on this url after change:

  ${EDITCONFIG}

That would be all about config file and it's location, now we have to move all other files in directory ${FROM}.
In order to do that open terminal and paste:

rm -rf ____temporary_directory_remove_later
mkdir ____temporary_directory_remove_later
cd ____temporary_directory_remove_later
git clone ${GITSTORAGESOURCE} .
mv ${FROM}/* ${TO}/
mv ${FROM}/.* ${TO}/
git add .
git commit -m "gits move ${SOURCE} ${TARGET}"
git push
cd ..
rm -rf ____temporary_directory_remove_later

and then visit again

  ${EDITCONFIG}

  go one directory up and review all files, espcecially if there is gitstorage-config.sh and next to it other files

DOC


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

      { red "${0} error: source file1 '${_S}' doesn't exist"; } 2>&3
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

    _TT="$(echo "${_TT}" | sed -E 's/( )/\\\1/g')"

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

    _S="$(echo "${_S}" | sed -E 's/( )/\\\1/g')"

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      { red "${0} error: source file2 '${_S}' doesn't exist"; } 2>&3

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

    _S="$(echo "${_S}" | sed -E 's/( )/\\\1/g')"

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      { red "${0} error: source file3 '${_S}' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "${_TARGETGITDIR}" && git status -s)"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      echo "final url ${URL}";

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

    _SS="$(echo "${_SS}" | sed -E 's/( )/\\\1/g')"

    eval _SS="${_SS}"

    if [ -f "${_SS}" ]; then

      _TT="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_TT}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_S}' -> '${_T}'"; } 2>&3

      cp "${_SS}" "${_TT}"

    else

      { red "${0} error: source file4 '${_SS}' doesn't exist"; } 2>&3

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

    _SS="$(echo "${_SS}" | sed -E 's/( )/\\\1/g')"

    eval _SS="${_SS}"

    _TT="${_TARGETGITDIR}/${_T}"

    if [ -f "${_TT}" ]; then

      _TMPDIR="$(dirname "${_SS}")"

      mkdir -p "${_TMPDIR}";

      { yellow "'${_T}' -> '${_S}'"; } 2>&3

      cp "${_TT}" "${_SS}" | true
    else

      { red "file '${_TT}' doesn't exist in repository, it might be worth to remove it from config file '${_CONFIG}'"; } 2>&3
    fi

  done

  { green "\n    files pulled\n"; } 2>&3

  echo "final url ${URL}";

  exit 0;
fi

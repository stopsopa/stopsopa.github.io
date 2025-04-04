#!/bin/bash

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="${_SHELL##*/}"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
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


LOCKDIR=".git/xxlockdir"
LOCKDIRABS="${_PWD}/.git/xxlockdir"

realpath . &> /dev/null

if [ "${?}" != "0" ]; then

  { red "realpath is not installed run: brew install coreutils"; } 2>&3

  exit 1;
fi

function checkIfGITSTORAGESOURCEdefined {

  if [ "${GITSTORAGESOURCE}" = "" ]; then
    echo "${0} error: can't operate when GITSTORAGESOURCE env var is not defined, either globally or in local .git/gitstorage-config.sh"

    exit 1
  fi
}

if [ "${1}" = "" ] || [ "${1}" = "--help" ]; then

cat << EOF

/bin/bash ${0} isinsync
/bin/bash ${0} diff
/bin/bash ${0} pull
/bin/bash ${0} push
/bin/bash ${0} url
/bin/bash ${0} move git@xxx:project/source-repo.git git@yyy/target-repo.git
/bin/bash ${0} init
  # generate gitstorage-config.sh for the first time for given directory (dir have to contain .git)

/bin/bash ${0} add [file|directory]
  # register files from path in gitstorage-config.sh

/bin/bash ${0} lock [file|directory]
  # add files given by path to .git/xxlockdir and register in gitstorage-config.sh

/bin/bash ${0} -c "gitstorage-config.sh"
  # you can specify different config

/bin/bash ${0} state
  # will look for each ${_CONFIG} anywhere in current PWD and check if files pointed by it are up to date

/bin/bash ${0} existing
  # will look for all .git directories and try to determine if there is gitstorage-config.sh for it
  # if yes then it will pull it with all tools around it

/bin/bash ${0} clean
  # will look for all gitstorage-config.sh and remove them in current PWD

EOF

  exit 0
fi

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
trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

_CONFIG_FILE="gitstorage-config.sh"
_CONFIG_DIR=".git"
_CONFIG="${_CONFIG_DIR}/${_CONFIG_FILE}";

_FORCE="0"
_BACKUP="0"
_RESTORE="0"

PARAMS=""
REMOTE="origin";

GITSTORAGE_CORE_REPOSITORY="git@github.com:stopsopa/gitstorage.git"; # @substitute

while (( "${#}" )); do
  case "${1}" in
    -r|--remote)
      if [ "${2}" = "" ]; then
        { red "$(basename "${0}") error: --remote value can't be empty"; } 2>&3
        exit 1;
      fi
      REMOTE="${2}";
      shift 2;
      ;;
    -s|--core_repository)
      if [ "${2}" = "" ]; then                            # PUT THIS CHECKING ALWAYS HERE IF YOU WAITING FOR VALUE
        { red "$(basename "${0}") error: --core_repository value can't be empty"; } 2>&3
        exit 1;                                          # optional
      fi                                  # optional
      GITSTORAGE_CORE_REPOSITORY="${2}";
      shift 2;
      ;;
    --yes)
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
      { red "$(basename "${0}") error: Unsupported flag ${1}"; } 2>&3
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

_P="$(pwd)"

# set positional arguments in their proper place
eval set -- "${PARAMS}"

MODE="${1}"

shift;

function cloneTarget {
  _TARGETGITDIR="";

  while true
  do

    _TARGETGITDIR="$(openssl rand -hex 2)"

    _TARGETGITDIR="${PWD}/${_TARGETGITDIR}"

    echo "_TARGETGITDIR: ${_TARGETGITDIR}"

    if ! [ -d "${_TARGETGITDIR}" ]; then

      break;
    fi
  done

  function cleanup {

    { yellow "\n$(basename "${0}") cleaning ${_TARGETGITDIR}"; } 2>&3

    rm -rf "${_TARGETGITDIR}"
  }

  trap cleanup EXIT

  mkdir -p "${_TARGETGITDIR}"
}

function init {

  if [ ! -d ".git" ]; then

    cat <<EEE

    $(basename "${0}") error: you have to execute it in directory where .git exist

EEE
 
    return 1
  fi

  GITSTORAGESCRIPT="gitstorage-core.sh"

  GITSTORAGESCRIPT_WITH_RELATIVE_DIR=".git/${GITSTORAGESCRIPT}"

  unlink "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"

  if [ -d "${REPO_DIR}" ] && [ -f "${REPO_DIR}/${GITSTORAGESCRIPT}" ]; then
    { yellow "linking ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3
    
    (cd .git && ln -s "${REPO_DIR}/${GITSTORAGESCRIPT}" "${GITSTORAGESCRIPT}")

    if [ ! -L "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}" ]; then

      { red "${0} error: can't download file ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

      exit 1
    fi
  else
    { yellow "downloading ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

    /bin/bash .git/wget.sh "${PROD}/${GITSTORAGESCRIPT}" "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"

    if [ ! -f "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}" ]; then

      { red "${0} error: can't download file ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

      exit 1
    fi
  fi
  
  /bin/bash ".git/gitstorage-core.sh"
}

if [ "${MODE}" = "add" ]; then

  if [ ! -f "${_CONFIG}" ]; then

    cat <<EEE

  file ${_CONFIG} doesn't exist

EEE

    exit 1
  fi

  LIST="$(find "${1}" -type f)"

  node "${_DIR}/gitstorage.cjs" "${_PWD}" "${_CONFIG}" "${LIST}"

  exit 0
fi

if [ "${MODE}" = "lock" ]; then

  set +x

  if [ ! -d "${LOCKDIR}" ]; then

    cat <<EEE

    directory "${LOCKDIR}" doesn't exist

    create it first:

    mkdir -p "${LOCKDIR}"

EEE

    exit 1
  fi

  LIST="$(find "${1}" -type f 2> /dev/null)"

  if [ "${LIST}" = "" ]; then

    cat <<EEE

    directory "${LOCKDIR}" is empty

    add some files to it first:
      gits lock src/main/resources/application-local.yaml

    and register them with gitstorage-config.sh
      gits add "${LOCKDIR}"

EEE

  else
    while read -r FILE
    do

      PD="$(dirname "${FILE}")"

      cat <<EEE

mkdir -p "${LOCKDIR}/${PD}"
cp "${FILE}" "${LOCKDIR}/${FILE}"
EEE

      mkdir -p "${LOCKDIR}/${PD}"
      cp "${FILE}" "${LOCKDIR}/${FILE}"

    done <<< "${LIST}"

  cat <<EEE

now run:
  
  gits add "${LOCKDIR}"

EEE

  fi

  exit 0
fi

if [ "${MODE}" = "init" ]; then
  init

  exit 0
fi

if [ "${MODE}" = "state" ]; then

LIST="$(find . -type d -name 'node_modules' -prune -o -type f -name "${_CONFIG_FILE}" -print | grep "/.git/${_CONFIG_FILE}")"
# LIST="$(find SPECIAL_storage -type d -name 'node_modules' -prune -o -type f -name "gitstorage-config.sh" -print | grep "/.git/gitstorage-config.sh")"

LIST=$(cat <<END
${LIST}
./SPECIAL_storage/SPECIAL_storage/.git/${_CONFIG_FILE}
END
);

LIST="$(trim "${LIST}")"

LIST="$(echo "${LIST}" | sort -u)" # deduplicate

# echo ">${LIST}<"

# exit

LIST_FILTERED=();

while read -r xxx
do
  if [ "${xxx}" != "" ]; then

    # DIR="$(dirname "${xxx}")"

    # CORE="${DIR}/gitstorage-core.sh"

    # if [ -e "${CORE}" ]; then

      LIST_FILTERED+=("${xxx}")
    # fi
  fi

done <<< "${LIST}"

if [ "${#LIST_FILTERED[@]}" = "0" ]; then

  cat <<EEE

  nothing found

EEE
else


  { green "===================================================================================================================="; } 2>&3
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  echo ""
  { green "===================================================================================================================="; } 2>&3

  cloneTarget


  COUNT_SUCCESS="0"
  COUNT_ERROR="0"

  COUNT="${#LIST_FILTERED[@]}"
  COUNT="$(trim "${COUNT}")"
  I="0"
  for xxx in "${LIST_FILTERED[@]}"
  do

    cd "$_P"

    I="$(($I + 1))"

    echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${I} : ${COUNT} >${xxx}<"
    DIR="$(dirname "${xxx}")"
    PROJECT_DIR="$(dirname "${DIR}")"

    cat <<EEE

  cd "$(realpath "${PROJECT_DIR}")"
  gits diff

EEE

    unset GITSTORAGELIST;

    XXX_REAL="$(realpath "${xxx}")"

    cd "${PROJECT_DIR}"

    source "${XXX_REAL}";

    cd "$_P"

    _COUNT="${#GITSTORAGELIST[@]}";

    if [ ${_COUNT} -lt 1 ] ; then

      { red "$(basename "${0}") error: list GITSTORAGELIST in config '${xxx}' shouldn't be empty"; } 2>&3

      exit 1;
    fi    

    checkIfGITSTORAGESOURCEdefined

    GITSTORAGETARGETDIR="$(echo "${GITSTORAGESOURCE}"| sed -E 's/\//__/g')"

    CLONED_TARGET_DIR="${_TARGETGITDIR}/${GITSTORAGETARGETDIR}"

    if [ -d "${CLONED_TARGET_DIR}" ]; then

      { green "directory '${CLONED_TARGET_DIR}' for '${xxx}' already exist"; } 2>&3
    else
      mkdir -p "${CLONED_TARGET_DIR}"
      
      { green "cloning directory '${CLONED_TARGET_DIR}' for '${xxx}'"; } 2>&3

      set -e
      cd "${CLONED_TARGET_DIR}"
      git clone "${GITSTORAGESOURCE}" .
      cd "$_P"
      set +e

      echo cloned..
    fi

    cd "${CLONED_TARGET_DIR}"
    echo before checkout vvv
    git clean -df
    git checkout .
    echo after checkout ^^^
    cd "$_P"

    # ls -la "${CLONED_TARGET_DIR}/"
    
    cd "${PROJECT_DIR}"

    # echo "PROJECT_DIR: ${PROJECT_DIR}"

    MISSING="0"

    for index in "${GITSTORAGELIST[@]}"; do

      _S="${index%%::*}"

      _T="${index##*::}"

      # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
      # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
      if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

        _S="${_CONFIG_DIR}/${_S}"
      fi

      _S="$(echo "${_S}" | sed -E 's/( )/\\\1/g')"

      eval _S="${_S}"

      if [ -f "${_S}" ]; then

        _T="${CLONED_TARGET_DIR}/${_T}"

        _TMPDIR="$(dirname "${_T}")"

        mkdir -p "${_TMPDIR}";

        cp "${_S}" "${_T}"

      else

        MISSING="1"

        { red "$(basename "${0}") error: source file (state) '${_S}' doesn't exist"; } 2>&3
      fi

      # echo "moving _S>${_S}< to _T>${_T}<"

    done
  
    if [ "${MISSING}" = "1" ]; then

      { red "\n    files are not in sync - at least one source file is missing\n"; } 2>&3

    else

      cd "${CLONED_TARGET_DIR}"

      DIFFSTATUS="$(git status -s)"

      cd "$_P"

      if [ "${DIFFSTATUS}" = "" ] ; then

          { green "    files are in sync"; } 2>&3

          COUNT_SUCCESS="$((${COUNT_SUCCESS} + 1))"
      else

          { red "    files are not in sync"; } 2>&3

          COUNT_ERROR="$((${COUNT_ERROR} + 1))"

          cd "${CLONED_TARGET_DIR}"
          git status
          cd "$_P"
      fi
    fi
  done

  echo ""
  { green "COUNT_SUCCESS : ${COUNT_SUCCESS}"; } 2>&3
  { red   "COUNT_ERROR   : ${COUNT_ERROR}"; } 2>&3
  echo ""

  cd "$_P"
fi

  exit 0;
fi


if [ "${MODE}" = "existing" ]; then


git help > /dev/null;

if [ "${?}" != "0" ]; then

    { red "git is not installed"; } 2>&3

    exit 3
fi

LIST="$(find . -type d -name 'node_modules' -prune -o -type d -name ".git" -print)"

LIST="$(trim "${LIST}")"

LIST_FILTERED=();

while read -r xxx
do
  cd "${_P}"
  if [ "${xxx}" != "" ]; then
    TMP="${xxx}/config"
    if [ -f "${TMP}" ]; then
          DIR="$(dirname "${xxx}")"
          cd "${DIR}"
          REPOURL="$(git config --get "remote.${REMOTE}.url")"
          if [ "${?}" = "0" ]; then
            LIST_FILTERED+=("${xxx}")
          else
              { red "git config --get \"remote.${REMOTE}.url\" - failed - tested for '${xxx}'"; } 2>&3
          fi
    else
        { red "${TMP} is not a file - tested for '${xxx}'"; } 2>&3
    fi
  fi
done <<< "${LIST}"

cd "${_P}"

if [ "${#LIST_FILTERED[@]}" = "0" ]; then

  cat <<EEE

  nothing found

EEE
else

  cloneTarget

  set -e
  cd "${_TARGETGITDIR}"
  git clone "${GITSTORAGE_CORE_REPOSITORY}" .
  tree
  cd "$_P"
  set +e

  COUNT="${#LIST_FILTERED[@]}"
  COUNT="$(trim "${COUNT}")"
  I="0"
  for xxx in "${LIST_FILTERED[@]}"
  do

    # echo "xxx: >${xxx}<"

    cd "$_P"

    I="$(($I + 1))"

    echo -e ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${I} : ${COUNT} >${xxx}<"
    DIR="${xxx}"
    PROJECT_DIR="$(dirname "${DIR}")"

    cat <<EEE
  cd "$(realpath "${PROJECT_DIR}")"

EEE

  cd "${xxx}"

  REPOURL="$(git config --get "remote.${REMOTE}.url")"

  GITSTORAGETARGETDIR="$(echo "${REPOURL}"| sed -E 's/\//__/g')"

  cd "$_P"

  # echo "GITSTORAGETARGETDIR: >${GITSTORAGETARGETDIR}<"

  GITDIR_CONFIGFILE="${xxx}/${_CONFIG_FILE}"

  # echo "GITDIR_CONFIGFILE: >${GITDIR_CONFIGFILE}<"

  if [ -f "${GITDIR_CONFIGFILE}" ]; then

    { green "${GITDIR_CONFIGFILE} is already present - initialization not needed"; } 2>&3
  else

    # { yellow "try to download ${GITDIR_CONFIGFILE}"; } 2>&3

    _TARGETCONFIG="${_TARGETGITDIR}/${GITSTORAGETARGETDIR}/${_CONFIG_FILE}"

    if [ -f "${_TARGETCONFIG}" ]; then

      cp "${_TARGETCONFIG}" "${xxx}/"

      cd "${PROJECT_DIR}"

      init

      cd "$_P"

      { green "${GITDIR_CONFIGFILE} cloned from ${GITSTORAGE_CORE_REPOSITORY}/${GITSTORAGETARGETDIR}"; } 2>&3
    else

      { red "${_TARGETCONFIG} doesn't exist"; } 2>&3
    fi
  fi

  done
fi

  exit 0;
fi


if [ "${MODE}" = "clean" ]; then

set +e
LIST="$(find . -type d -name 'node_modules' -prune -o -type f -name "${_CONFIG_FILE}" -print | grep "/.git/${_CONFIG_FILE}")"
set -e

LIST="$(trim "${LIST}")"

  if [ "${LIST}" = "" ]; then
    cat <<EEE

    none of ${_CONFIG_FILE} found

EEE
  else
    COUNT="$(echo $LIST | wc -l)"
    COUNT="$(trim "${COUNT}")"

    I="0"
    while read -r xxx
    do

      cd "$_P"

      I="$(($I + 1))"

      echo -e "\n\n>>>> before >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ${I} : ${COUNT} >${xxx}<"
      DIR="$(dirname "${xxx}")"

      cd "${DIR}"
      pwd
      ls -la
      
      rm "${_CONFIG_FILE}"
      rm "gitstorage.sh"
      rm "gitstorage-core.sh"

      echo -e "\n\n>>>> after >>>>"
      ls -la

    done <<< "${LIST}"
  fi

  exit 0
fi


if [ "${_CONFIG}" = "" ]; then

  { red "$(basename "${0}") error: --config value can't be empty"; } 2>&3

  exit 1;
fi

if ! [ -f "${_CONFIG}" ]; then

  { red "$(basename "${0}") error: --config file '${_CONFIG}' doesn't exist"; } 2>&3

  exit 1;
fi

source "${_CONFIG}";

_GITHUB="^git@github"

checkIfGITSTORAGESOURCEdefined

if [[ ${GITSTORAGESOURCE} =~ ${_GITHUB} ]]; then

  URL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")/tree/master/${GITSTORAGETARGETDIR}"
else

  URL="$(echo "${GITSTORAGESOURCE}" | sed -E "s/^git@([^:]+):([^\/]+)\/([^\.]+).*/https:\/\/\1\/\2\/\3/")/raw/master/${GITSTORAGETARGETDIR}"
fi

# this will check if array exist and it will count it,
# if it doesn't exist and can't be counted then this will return 0
_COUNT="${#GITSTORAGELIST[@]}";

if [ ${_COUNT} -lt 1 ] ; then

  { red "$(basename "${0}") error: list GITSTORAGELIST in config '${_CONFIG}' shouldn't be empty"; } 2>&3

  exit 1;
fi



TEST="^(url|isinsync|diff|pull|push|backup|restore|move|state)$"

if ! [[ ${MODE} =~ ${TEST} ]]; then

  { red "$(basename "${0}") error: mode ${MODE} don't match pattern ${TEST}"; } 2>&3

  exit 1;
fi

TEST="^(backup|restore)$"

if [[ ${MODE} =~ ${TEST} ]]; then

  if [ "${1}" = "" ]; then

    { red "$(basename "${0}") error: mode ${MODE} - directory not specified"; } 2>&3
  fi

  mkdir -p "${1}";
fi

if [ "${MODE}" = "url" ]; then

  echo "final url ${URL}";

  exit 0
fi


if [ "${MODE}" = "move" ]; then

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

  RENAMEDIRLINK="${BASEURL}/edit/master/${FROM}/${_CONFIG_FILE}"

  EDITCONFIG="${BASEURL}/edit/master/${TO}/${_CONFIG_FILE}"

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
git clone "${GITSTORAGESOURCE}" .
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

if [ "${MODE}" = "backup" ]; then

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

      { red "$(basename "${0}") error: source file1 '${_S}' doesn't exist"; } 2>&3
    fi

  done

  { green "\n    files backup created\n"; } 2>&3

  exit 0;
fi

if [ "${MODE}" = "restore" ]; then

  _TARGETGITDIR="${1}"

  for index in "${GITSTORAGELIST[@]}"; do

    _T="${index%%::*}"

    _S="${_TARGETGITDIR}/${_T}"

    _TT="${_T}"

    # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
    # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
    if ! [[ ${_T} =~ ^~{0,1}/.* ]]; then

      _TT="${_CONFIG_DIR}/${_T}"
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



cloneTarget



if [ "${MODE}" = "isinsync" ]; then

  checkIfGITSTORAGESOURCEdefined

  set -e
  cd "${_TARGETGITDIR}"
  git clone "${GITSTORAGESOURCE}" .
  cd "$_P"
  set +e

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
    # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _S="${_CONFIG_DIR}/${_S}"
    fi

    _S="$(echo "${_S}" | sed -E 's/( )/\\\1/g')"

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      { red "$(basename "${0}") error: source file2 '${_S}' doesn't exist"; } 2>&3

    fi

  done

  cd "${_TARGETGITDIR}"

  git status -s

  cd "$_P"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  { red "\n    files are not in sync\n"; } 2>&3

  (cd "${_TARGETGITDIR}" && git status)

  echo "final url ${URL}";

  exit 1;
fi


if [ "${MODE}" = "diff" ]; then

  checkIfGITSTORAGESOURCEdefined

  set -e
  cd "${_TARGETGITDIR}" 
  git clone "${GITSTORAGESOURCE}" .
  cd "$_P"
  set +e

  MISSING="0"

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
    # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _S="${_CONFIG_DIR}/${_S}"
    fi

    _S="$(echo "${_S}" | sed -E 's/( )/\\\1/g')"

    eval _S="${_S}"

    if [ -f "${_S}" ]; then

      _T="${_TARGETGITDIR}/${_T}"

      _TMPDIR="$(dirname "${_T}")"

      mkdir -p "${_TMPDIR}";

      cp "${_S}" "${_T}"

    else

      MISSING="1"

      { red "$(basename "${0}") error: source file3 '${_S}' doesn't exist"; } 2>&3

    fi

  done
  
  if [ "${MISSING}" = "1" ]; then

    { red "\n    files are not in sync - at least one source file is missing\n"; } 2>&3

    echo "final url ${URL}";

    exit 1
  fi

  cd "${_TARGETGITDIR}"

  pwd

  DIFFSTATUS="$(git status -s)"

  cd "$_P"

  if [ "${DIFFSTATUS}" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      echo "final url ${URL}";

      exit 0;
  fi

  { red "\n    files are not in sync\n"; } 2>&3

  cd "${_TARGETGITDIR}/${GITSTORAGETARGETDIR}"

  git diff

  git status

  echo "final url ${URL}";

  exit 1;
fi




if [ "${MODE}" = "push" ]; then

  if [ "${_FORCE}" = "0" ]; then

    set +e

    /bin/bash "${0}" -c "${_CONFIG}" isinsync

    if [ "${?}" = "0" ]; then

      echo "final url ${URL}";

      exit 0;
    else

      { red "$(basename "${0}") error: files are not in sync, if you sure that you want to push them add --yes param"; } 2>&3

      echo "final url ${URL}";

      exit 1;
    fi

    set -e
  fi

  checkIfGITSTORAGESOURCEdefined

  set -e
  cd "${_TARGETGITDIR}"
  git clone "${GITSTORAGESOURCE}" .
  cd "$_P"
  set +e

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"


      # making sure that file will be copied in at least one directory
      _TMPDIR="$(dirname "${_T}")"

      if [ "${_TMPDIR}" = "." ]; then

        { red "$(basename "${0}") error: target file '${_T}' should be in folder like 'xxx/${_T}'"; } 2>&3

        exit 1

      fi

    _SS="${_S}"

    # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
    # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _SS="${_CONFIG_DIR}/${_S}"
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

      { red "$(basename "${0}") error: source file4 '${_SS}' doesn't exist"; } 2>&3

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



if [ "${MODE}" = "pull" ]; then

  if [ "${_FORCE}" = "0" ]; then

    set +e

    /bin/bash "${0}" -c "${_CONFIG}" isinsync

    cat <<EEE

  run with --yes to actually do pull

EEE

    if [ "${?}" = "0" ]; then

      echo "final url ${URL}";

      exit 0;
    else

      { red "$(basename "${0}") error: files are not in sync, if you sure that you want to pull them add --yes param"; } 2>&3

      echo "final url ${URL}";

      exit 1;
    fi

    set -e
  fi

  checkIfGITSTORAGESOURCEdefined

  set -e
  cd "${_TARGETGITDIR}"
  tree
  git clone "${GITSTORAGESOURCE}" .
  cd "$_P"
  set +e

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    _SS="${_S}"

    # we are working here form main directory of each project, so if path is not starting from absolute path (/) or home directory (~) then
    # adjust it to project directory, because each path in GITSTORAGELIST should be declared relative to gitstorage-config.sh
    if ! [[ ${_S} =~ ^~{0,1}/.* ]]; then

      _SS="${_CONFIG_DIR}/${_S}"
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
#!/bin/bash

realpath . &> /dev/null

if [ "${?}" != "0" ]; then

  { red "realpath is not installed run: brew install coreutils"; } 2>&3

  exit 1;
fi

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

__METHOD="wget"

wget --help 1> /dev/null 2> /dev/null

if [ "${?}" != "0" ]; then

  curl --help 1> /dev/null 2> /dev/null

  if [ "${?}" != "0" ]; then

    { red "${0} error: wget nor curl found"; } 2>&3

    set -e; _exit 1> /dev/null 2> /dev/null
  fi

  __METHOD="curl";
fi

REMOTE="origin";
PROD_SCHEMA=https; # @substitute
PROD_HOST=stopsopa.github.io; # @substitute
GITSTORAGE_CORE_REPOSITORY=git@github.com:stopsopa/gitstorage.git; # @substitute

PROD="${PROD_SCHEMA}://${PROD_HOST}"

PARAMS=""
while (( "${#}" )); do
  case "${1}" in
    -r|--remote)
      if [ "${2}" = "" ]; then                            # PUT THIS CHECKING ALWAYS HERE IF YOU WAITING FOR VALUE
        { red "${0} error: --remote value can't be empty"; } 2>&3
        exit 1;                                          # optional
      fi                                  # optional
      REMOTE="${2}";
      shift 2;
      ;;
    -s|--core_repository)
      if [ "${2}" = "" ]; then                            # PUT THIS CHECKING ALWAYS HERE IF YOU WAITING FOR VALUE
        { red "${0} error: --core_repository value can't be empty"; } 2>&3
        exit 1;                                          # optional
      fi                                  # optional
      GITSTORAGE_CORE_REPOSITORY="${2}";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "${#}" )); do          # optional
        if [ "${1}" = "&&" ]; then
          PARAMS="${PARAMS} \&\&"
        else
          if [ "${PARAMS}" = "" ]; then
            PARAMS="\"${1}\""
          else
            PARAMS="${PARAMS} \"${1}\""
          fi
        fi
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash ${0} -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      { red "${0} error: Unsupported flag ${1}"; } 2>&3
      exit 2;
      ;;
    *) # preserve positional arguments
      if [ "${1}" = "&&" ]; then
          PARAMS="${PARAMS} \&\&"
      else
        if [ "${PARAMS}" = "" ]; then
            PARAMS="\"${1}\""
        else
          PARAMS="${PARAMS} \"${1}\""
        fi
      fi
      shift;
      ;;
  esac
done

eval set -- "${PARAMS}"

git help > /dev/null;

if [ "${?}" != "0" ]; then

    { red "git is not installed"; } 2>&3

    exit 3
fi

#_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

TMP=".git"

if [ ! -d "${TMP}" ]; then

    { red "${TMP} is not a directory - run /bin/bash .git/gitstorage-core.sh from main directory of the project"; } 2>&3

    exit 4
fi

TMP="${TMP}/config"

if [ ! -f "${TMP}" ]; then

    { red "${TMP} is not a file"; } 2>&3

    exit 5
fi

REPOURL="$(git config --get "remote.${REMOTE}.url")"

if [ "${?}" != "0" ]; then

    { red "git config --get \"remote.${REMOTE}.url\" - failed"; } 2>&3

    exit 6
fi

GITSTORAGETARGETDIR="$(echo "${REPOURL}"| sed -E 's/\//__/g')"

#echo "REMOTE=${REMOTE}"
#echo "REPOURL=${REPOURL}"
#echo "${@}"

{ yellow "downloading .git/wget.sh"; } 2>&3

if [ "${__METHOD}" = "wget" ]; then

  wget --no-cache -O ".git/wget.sh" "${PROD}/bash/wget.sh"
else

  curl "${PROD}/bash/wget.sh" -o ".git/wget.sh"
fi

if [ ! -f ".git/wget.sh" ]; then

  { red "${0} error: can't download file .git/wget.sh"; } 2>&3

  exit 1
fi
GITSTORAGESCRIPT="gitstorage.sh"

GITSTORAGESCRIPT_WITH_RELATIVE_DIR=".git/${GITSTORAGESCRIPT}"

unlink "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"

if [ -d "${REPO_DIR}" ] && [ -f "${REPO_DIR}/${GITSTORAGESCRIPT}" ]; then
  { yellow "linking ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3
  
  (cd .git && ln -s "${REPO_DIR}/${GITSTORAGESCRIPT}" gitstorage.sh)

  if [ ! -L "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}" ]; then

    { red "${0} error: can't download file ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

    exit 1
  fi
else
  { yellow "downloading ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

  /bin/bash .git/wget.sh "${PROD}/gitstorage.sh" "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"

  if [ ! -f "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}" ]; then

    { red "${0} error: can't download file ${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"; } 2>&3

    exit 1
  fi
fi

_CONFIG_FILE="gitstorage-config.sh"

{ yellow "${_CONFIG_FILE} initialization ..."; } 2>&3

GITDIR_CONFIGFILE=".git/${_CONFIG_FILE}"

function allgood {

cat <<END

Now check config file:

vi ${GITDIR_CONFIGFILE}

Now run:

/bin/bash "${GITSTORAGESCRIPT_WITH_RELATIVE_DIR}"

END

}

if [ -f "${GITDIR_CONFIGFILE}" ]; then

  { green "${GITDIR_CONFIGFILE} is already present - initialization not needed"; } 2>&3

  allgood

  exit 0
fi

_TARGETGITDIR="";

while true
do

 _TARGETGITDIR=".git/__rm__$(openssl rand -hex 2)"

 _TARGETGITDIR="$(realpath "${_TARGETGITDIR}")"

 if ! [ -d "${_TARGETGITDIR}" ]; then

   break;
 fi
done

function cleanup {

 rm -rf "${_TARGETGITDIR}" || true
}

trap cleanup EXIT

mkdir -p "${_TARGETGITDIR}"

set -e

(cd "${_TARGETGITDIR}" && git clone "${GITSTORAGE_CORE_REPOSITORY}" .)

set +e

_TARGETCONFIG="${_TARGETGITDIR}/${GITSTORAGETARGETDIR}/${_CONFIG_FILE}"

if [ -f "${_TARGETCONFIG}" ]; then

  cp "${_TARGETCONFIG}" .git/

  { green "${GITDIR_CONFIGFILE} cloned from ${GITSTORAGE_CORE_REPOSITORY}/${GITSTORAGETARGETDIR}"; } 2>&3
else

echo "GITDIR_CONFIGFILE: ${GITDIR_CONFIGFILE}";

cat <<END > "${GITDIR_CONFIGFILE}"
#!/bin/bash

# used in ${REPOURL}

GITSTORAGESOURCE="${GITSTORAGE_CORE_REPOSITORY}"

GITSTORAGETARGETDIR="${GITSTORAGETARGETDIR}"

# paths will be solved from directory where ${_CONFIG_FILE} is, usually it means from .git directory
GITSTORAGELIST=(
    "${_CONFIG_FILE}::\$GITSTORAGETARGETDIR/${_CONFIG_FILE}"
    "../.vscode/settings.json::\$GITSTORAGETARGETDIR/.vscode/settings.json"
    "../../.vscode/settings.json::\$GITSTORAGETARGETDIR/.vscode/parent_settings.json"
)

#set -o pipefail
#INTELIJ="\$(ls -la ../gdm1_root/Users/sdzialowski/Library/Application\ Support/JetBrains/ | awk '{ print \$9 }' | grep  -i -E "^IntelliJIdea" | sort -r | head -n 1)"
#
#if [ "\${?}" = "0" ]; then
# echo "all good \${INTELIJ}"
# TRAPS+=("../../gdm1_root/Users/sdzialowski/Library/Application Support/JetBrains/\${INTELIJ}/scratches/scratch.http::\$GITSTORAGETARGETDIR/gdm1_root/Library/Application Support/JetBrains/IntelliJIdeaxxxx.x/scratches/scratch.http")
# TRAPS+=("../../gdm1_root/Users/sdzialowski/Library/Application Support/JetBrains/\${INTELIJ}/scratches/businessfabric__notifications.http::\$GITSTORAGETARGETDIR/gdm1_root/Library/Application Support/JetBrains/IntelliJIdeaxxxx.x/scratches/businessfabric__notifications.http")
#else
# cat <<EEE
#
# WARNING:
# WARNING:
# WARNING:
#
#   couldn't extract INTELIJ current dir with command:
#     ls -la ../../gdm1_root/Users/sdzialowski/Library/Application\ Support/JetBrains/ | awk '{ print \$9 }' | grep  -i -E "^IntelliJIdea" | sort -r | head -n 1
#
#   usually it means you have to install intelij first
#   some files were skipped due to this, but don't worry, if files were uploaded then they are still there
#
# WARNING:
# WARNING:
# WARNING:
#
#EEE
#
#fi
#set +o pipefail

END

  if [ -f "${GITDIR_CONFIGFILE}" ]; then

    { green "${GITDIR_CONFIGFILE} generated\nnow you can add some files to store"; } 2>&3
  else

    { red "${0} error: can't create file ${GITDIR_CONFIGFILE}"; } 2>&3

    exit 1
  fi
fi

allgood



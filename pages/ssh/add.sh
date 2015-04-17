#!/bin/bash

# This script is for registering particular key everytime you run terminal
# There is another though for manual changing of keys
# called sshh.sh
#
# to install it , just add to ~/.bash_profile
#        /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh firstkey secondkey
#
# you might specify directory as an argument (to override SSHH_DIR_WITH_KEYS)
#        /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh firstkey secondkey -d path/to/directory/with/keys
# and then also use sshh script from:
# https://stopsopa.github.io/pages/ssh/index.html#sshh-manually-swap-ssh-key
#
# you might unzip directory before mounting
# /bin/bash 7zunseal.sh --7z_file /Users/sdzialowski/.ssh/keys.7z --7z_del_dir /Users/sdzialowski/.ssh/keys -- /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh firstkey secondkey

#SSHH_DIR_WITH_KEYS="/Volumes/WINSCP/ssh/ssh"

PARAMS=""
_EVAL=""
while (( "${#}" )); do
  case "${1}" in
    -d|--dir)
      SSHH_DIR_WITH_KEYS="${2}";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "${#}" )); do          # optional
        if [ "${1}" = "&&" ]; then
          PARAMS="${PARAMS} \&\&"
          _EVAL="${_EVAL} &&"
        else
          if [ "${PARAMS}" = "" ]; then
            PARAMS="\"${1}\""
            _EVAL="\"${1}\""
          else
            PARAMS="${PARAMS} \"${1}\""
            _EVAL="${_EVAL} \"${1}\""
#          PARAMS="$(cat <<EOF
#${PARAMS}
#- "${1}"
#EOF
#)"
          fi
        fi
        echo "                PARAMS1>>${PARAMS}<<"
        echo "                _EVAL 2>>${_EVAL}<<"
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash ${0} -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      echo "${0} error: Unsupported flag ${1}" >&2
      exit 1;
      ;;
    *) # preserve positional arguments
      if [ "${1}" = "&&" ]; then
          PARAMS="${PARAMS} \&\&"
          _EVAL="${_EVAL} &&"
      else
        if [ "${PARAMS}" = "" ]; then
            PARAMS="\"${1}\""
            _EVAL="\"${1}\""
        else
          PARAMS="${PARAMS} \"${1}\""
            _EVAL="${_EVAL} \"${1}\""
#          PARAMS="$(cat <<EOF
#${PARAMS}
#- "${1}"
#EOF
#)"
        fi
      fi
      # echo "                PARAMS2>>${PARAMS}<<"
      # echo "                _EVAL 1>>${_EVAL}<<"
      shift;
      ;;
  esac
done

if [ "${SSHH_DIR_WITH_KEYS}" = "" ]; then

  { red "\n${0} error: --dir or SSHH_DIR_WITH_KEYS env var is not specified\n"; } 2>&3

  _exit 2> /dev/null
fi

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

PARAMS="$(trim "${PARAMS}")"
_EVAL="$(trim "${_EVAL}")"

# set positional arguments in their proper place
eval set -- "${PARAMS}"

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

if [ "${#}" = "0" ]; then

  { red "\n${0} error:   specify parameters\n"; } 2>&3

  exit 1
fi

LOADED="$(ssh-add -l)"

if [[ ! ${LOADED} = *"The agent has no identities"* ]]; then

  { green "\n${0}: Keys already loaded\n"; } 2>&3

  echo "${LOADED}"

  echo -e "\nto unregister keys run ssh-add -D"

  exit 0
fi

_CMD="find \"${SSHH_DIR_WITH_KEYS}\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

_LIST="$(eval "${_CMD}")"

_CODE="${?}"

if [ "${_CODE}" != "0" ]; then

{ red "${0} error: $(cat <<END

${0} error:
command:

  ${_CMD}

has crushed with status code: >>${_CODE}<<

END
)"; } 2>&3

    exit ${_CODE};
fi

_LINES="$(echo "${_LIST}" | wc -l)"

_LINES="$(trim "${_LINES}")"

if [ "${_LIST}" = "" ] || [ "${_LINES}" -lt "1" ]; then

  { red "\n${0} error:   No keys found\n"; } 2>&3

  exit 1
fi

ssh-add -D

while : ; do

  if [ "${1}" = "" ]; then

    echo -e "\n\n   loaded keys:"

    ssh-add -l

    echo -e "\nto unregister keys run ssh-add -D"

    { green "\n   all good"; } 2>&3

    exit 0
  fi

  KEY="${1}"

  shift;

  (

    cd "${SSHH_DIR_WITH_KEYS}";

    if [ ! -e "${SSHH_DIR_WITH_KEYS}/${KEY}" ]; then

      { red "\n${0} error:   file '${SSHH_DIR_WITH_KEYS}/${KEY}' doesn't exist\n"; } 2>&3

      exit 1
    fi

    chmod 700 ~/.ssh/

    cp "${SSHH_DIR_WITH_KEYS}/${KEY}" ~/.ssh/

    chmod 600 ~/.ssh/${KEY}

    echo -e "executing command:\n\n    ssh-add ~/.ssh/${KEY}\n"

    ssh-add ~/.ssh/${KEY}

    _CODE="${?}"

    rm ~/.ssh/${KEY}

    GITCONFIG="${SSHH_DIR_WITH_KEYS}/${KEY}.sh"

    if [ -f "${GITCONFIG}" ]; then

      echo "Executing '${GITCONFIG}'"

      /bin/bash "${GITCONFIG}"

      git config --global -l | egrep "(user\.name|user\.email)"
    else

    { yellow "$(cat <<END

  WARNING:

  git config file '${GITCONFIG}' not found

  check config:

    git config --global -l

END
    )"; } 2>&3

    fi

    if [ "${_CODE}" != "0" ]; then

    { red "${0} error:$(cat <<END

${0} error:
command:

  ${_CMD}

has crushed with status code: >>${_CODE}<<

END
)"; } 2>&3

      exit ${_CODE};
    fi

  )
done

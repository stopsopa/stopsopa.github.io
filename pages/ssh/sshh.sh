
# This script is for manual change of keys
# There is another though to autmaticaly register key
# everytime you run terminal called add.sh
# To install visit link:
#     https://stopsopa.github.io/pages/ssh/index.html#sshh-manually-swap-ssh-key


# usage once installed:
# just call
#     sshh
# or
#     sshh 2
# to choose second key from the list
#
#     sshh _
# to list current key in form of string basename of the key/file loaded, eg: "key1"
#
#     sshh _ key1
# to print number of the key on the list by name, return example "1" - for first, "2" - for second
# then you can use it to switch to that using: sshh 2
#
#     sshh -i
#     sshh --init
# initialising .git/sshh value
#
#     sshh -a
#     sshh --auto
# autoswitch based on .git/sshh value
#
#
# To clear all keys in ssh agent
# ssh-add -D
# to list added
# ssh-add -L

# SSHH_DIR_WITH_KEYS="/Volumes/WINSCP/ssh/ssh"

PARAMS=""
_EVAL=""
while (( "${#}" )); do
  case "${1}" in
    -a|--auto)
      AUTO="1";
      shift 1;
      ;;
    -i|--init)
      INIT="1";
      shift 1;
      ;;
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

if [ "${SSHH_DIR_WITH_KEYS}" = "" ]; then

  { red "\n${0} error: --dir or SSHH_DIR_WITH_KEYS env var is not specified\n"; } 2>&3

  _exit 2> /dev/null
fi

if [ "${1}" = "install" ]; then

  CMD="alias sshh=\"/bin/bash ~/sshh.sh\""

  CONTENT="$(cat ~/.bashrc)"

  if [[ ${CONTENT} =~ ${CMD} ]]; then

      echo "already installed just use"
  else

      echo "${CMD}" >> ~/.bashrc

      echo "${CMD}" >> ~/.bash_profile

      source ~/.bashrc

      echo "now just use"
  fi

  echo -e "\n    sshh\n\nto switch ssh key"

  _exit 2> /dev/null || true
fi

_CMD="find \"${SSHH_DIR_WITH_KEYS}\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

_LIST="$(eval "${_CMD}")"

_LIST="$(trim "${_LIST}")"

_CODE="${?}"

if [ "${_CODE}" != "0" ]; then

{ red "${0} error:$(cat <<END

${0} error:
command:

  ${_CMD}

has crushed with status code: >>${_CODE}<<

END
)"; } 2>&3

    echo exit ${_CODE};

    _exit 2> /dev/null || true
fi

if [ "${AUTO}" = "1" ]; then

  CURRENTDIR="$(pwd)"

  while : ; do

      GITDIR="${CURRENTDIR}/.git"
      GITCONFIG="${GITDIR}/config"

#      echo "CURRENTDIR=>${CURRENTDIR}<"
#      echo "GITDIR=${GITDIR}"
#      echo "GITCONFIG=${GITCONFIG}"

      [ "${CURRENTDIR}" = "/" ] && break
      [ -d "${GITDIR}" ] && [ -f "${GITCONFIG}" ] && break

      CURRENTDIR="$(dirname "${CURRENTDIR}")"
  done

  if [ "${CURRENTDIR}" = "/" ]; then

    echo "${0} error: CURRENTDIR is pointing to /"

    exit 1
  fi

  SSHHCONFIG="${CURRENTDIR}/sshh";

  if [ ! -f "${SSHHCONFIG}" ]; then

    echo "${0} error: SSHHCONFIG [${SSHHCONFIG}] doesn't exit. use -i param to define it"

    exit 0
  fi

  exit 0
fi

if [ "${INIT}" = "1" ]; then

  CURRENTDIR="$(pwd)"

  while : ; do

      GITDIR="${CURRENTDIR}/.git"
      GITCONFIG="${GITDIR}/config"

#      echo "CURRENTDIR=>${CURRENTDIR}<"
#      echo "GITDIR=${GITDIR}"
#      echo "GITCONFIG=${GITCONFIG}"

      [ "${CURRENTDIR}" = "/" ] && break
      [ -d "${GITDIR}" ] && [ -f "${GITCONFIG}" ] && break

      CURRENTDIR="$(dirname "${CURRENTDIR}")"
  done

  if [ "${CURRENTDIR}" = "/" ]; then

    echo "${0} error: CURRENTDIR is pointing to /"

    exit 1
  fi

  SSHHCONFIG="${CURRENTDIR}/sshh";

  _LINES="$(echo "${_LIST}" | wc -l)"

  _LINES="$(trim "${_LINES}")"

  if [ "${_LIST}" = "" ] || [ "${_LINES}" -lt "1" ]; then

    { red "\n${0} error:   No keys found\n"; } 2>&3

    _exit 2> /dev/null || true
  fi

  echo "Choose key to add to config ${SSHHCONFIG}:"

  SSHS=""

  TEST="^[0-9]+$"

  while : ; do

      i="1"

      for name in ${_LIST}
      do

          name="$(echo "${name}" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

          echo "${i}) ${name}"

          i=$((${i} + 1))
      done

      printf ">"

      if [ "${_LINES}" -lt "10" ]; then

        read -n1 i
      else

        read i
      fi

      echo ""

      if ! [[ ${i} =~ ${TEST} ]] || [[ "${i}" -lt "1" ]] || [ "${i}" -gt "${_LINES}" ]; then

  { red "${0} error: $(cat <<END

given value (${i}) should be an integer > 0 but <= than ${_LINES}

try again:

END
    )"; } 2>&3

        continue;
      fi

      break;
  done

  SSHS="$(echo "${_LIST}" | sed -n "${i} p")"

  PB="$(basename "${SSHS}")"
  FILENAME="${PB%.*}"
  if [ "${FILENAME}" = "" ]; then
      FILENAME="${PB}"
  fi

  cat <<EEE

  ADDING:

    ${FILENAME}

  cat file:

    $(cat "${SSHHCONFIG}")


EEE

  echo "${FILENAME}" > "${SSHHCONFIG}";

  exit 0
fi

if [ "${1}" = "_" ]; then

  if [ "${2}" = "" ]; then

    TODETERMINEPOSITION="$(ssh-add -L | head -n 1 | awk '{print $2}')"
  else

    TODETERMINEPOSITION="${SSHH_DIR_WITH_KEYS}/${2}.pub"

    if [ ! -f "${TODETERMINEPOSITION}" ]; then

      echo "${0} error: TODETERMINEPOSITION>${TODETERMINEPOSITION}< doesn't exist, list $(ls -la "${SSHH_DIR_WITH_KEYS}")"

      exit 1
    fi

    TODETERMINEPOSITION="$(cat "${TODETERMINEPOSITION}" | awk '{print $2}')"
  fi

#cat <<EEE
#
#TODETERMINEPOSITION:
#${TODETERMINEPOSITION}
#
#EEE

  N="0"
  while read -r FILE
  do
    N=$((N + 1))

    FILE="${FILE}.pub"

    CONTENT="$(cat "${FILE}" | awk '{print $2}')"

#cat <<EEE
#
#FILENAME:
#>${TODETERMINEPOSITION}<
#>${CONTENT}<
#
#EEE

    if [ "${CONTENT}" = "${TODETERMINEPOSITION}" ]; then
#      printf " equal ${N}"

      printf ${N};
      exit 0

#    else
#      printf " not equal ${N}"
    fi

#    echo ""
#    echo ""
  done <<< "${_LIST}"

  echo "${0} error: key number not found by name >${2}< on the list >${_LIST}<"

  exit 1
fi

echo "currently loaded files"
ssh-add -l

echo ""
echo -e "executing command:\n\n    ${_CMD}\n"

_LINES="$(echo "${_LIST}" | wc -l)"

_LINES="$(trim "${_LINES}")"

if [ "${_LIST}" = "" ] || [ "${_LINES}" -lt "1" ]; then

  { red "\n${0} error:   No keys found\n"; } 2>&3

  _exit 2> /dev/null || true
fi

echo "Choose key to add:"

SSHS=""

TEST="^[0-9]+$"


if [ "${1}" = "" ]; then
  while : ; do

      i="1"
      for name in ${_LIST}
      do

          name="$(echo "${name}" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

          echo "${i}) ${name}"

          i=$((${i} + 1))
      done

      printf ">"

      if [ "${_LINES}" -lt "10" ]; then

        read -n1 i
      else

        read i
      fi

      echo ""

      if ! [[ ${i} =~ ${TEST} ]] || [[ "${i}" -lt "1" ]] || [ "${i}" -gt "${_LINES}" ]; then

  { red "${0} error: $(cat <<END

given value (${i}) should be an integer > 0 but <= than ${_LINES}

try again:

END
    )"; } 2>&3

        continue;
      fi

      break;
  done
else
  i="${1}"

  if ! [[ ${i} =~ ${TEST} ]] || [[ "${i}" -lt "1" ]] || [ "${i}" -gt "${_LINES}" ]; then

    { red "${0} error: $(cat <<END

given value (${i}) should be an integer > 0 but <= than ${_LINES}

try again:

END
    )"; } 2>&3

    exit 1
  fi
fi

SSHS="$(echo "${_LIST}" | sed -n "${i} p")"

ssh-add -D

#for name in ${_LIST}
#do
#
#    key="$(echo "${name}" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"
#
#    ssh-add -D "${name}"
#done

key="$(echo "${SSHS}" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

cp "${SSHS}" ~/.ssh/
chmod 700 ~/.ssh/${key}

echo -e "executing command:\n\n    ssh-add ~/.ssh/${key}\n"

ssh-add ~/.ssh/${key}

_CODE="${?}"

rm ~/.ssh/${key}

GITCONFIG="${SSHH_DIR_WITH_KEYS}/${key}.sh"

if [ -f "${GITCONFIG}" ]; then

  echo "Executing '${GITCONFIG}'"

  /bin/bash "${GITCONFIG}"

  echo ""
  git config --global -l | egrep "(user\.name|user\.email)"
  echo ""
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

{ red "${0} error: $(cat <<END

${0} error:
command:

  ${_CMD}

has crushed with status code: >>${_CODE}<<

END
)"; } 2>&3

  _exit 2> /dev/null || true
fi

ssh-add -l

{ green "\n   all good\n"; } 2>&3

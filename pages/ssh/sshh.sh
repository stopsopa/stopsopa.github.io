
# This script is for manual change of keys
# There is another though to autmaticaly register key
# everytime you run terminal called add.sh
# To install visit link:
#     https://stopsopa.github.io/pages/ssh/index.html#sshh-manually-swap-ssh-key
#
# To see help just run
# /bin/bash ${0} --help
#
# To clear all keys in ssh agent
# ssh-add -D
# to list added
# ssh-add -L

# SSHH_DIR_WITH_KEYS="/Volumes/WINSCP/ssh/ssh"

TEST="^[0-9]+$"

PARAMS=""
_EVAL=""
while (( "${#}" )); do
  case "${1}" in
    --hook)
      HOOK="1";
      shift 1;
      ;;
    --help)
      HELP="1";
      shift 1;
      ;;
    -f|--find)
      FIND="1";
      shift 1;
      ;;
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
#        echo "                PARAMS1>>${PARAMS}<<"
#        echo "                _EVAL 2>>${_EVAL}<<"
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
function gray {
    printf "\e[90m${1}\e[0m\n"
}
function green {
    printf "\e[32m${1}\e[0m\n"
}

function red {
    printf "\e[31m${1}\e[0m\n"
}

function yellow {
    printf "\e[33m${1}\e[0m\n"
}

if [ "${FIND}" = "1" ]; then

  function help {

    cat <<EEE

    sshh -f
      # help for find mode

    sshh -f list
      # list all found .git directories ans .git/sshh content in each of them if exists

    sshh -f exec -- ls -la
      # execute command in each found .git directory (not entering directories "node_modules")

    sshh -f exec -- 15 | tee log.log
      # special case where we not running "15" command (that wouldn't make much sense)
      # but running
        /bin/bash "${0}" -i 15
      # for each found .git directory

    sshh -f exec -- hook | tee log.log
      # special case where we not running "hook" command (that wouldn't make much sense)
      # but running
        /bin/bash "${0}" --hook
      # for each found .git directory

EEE
  }

  if [ "${1}" = "" ]; then

    help

    exit 0
  fi

    case "${1}" in
      exec)
        shift 1;

        LIST="$(find . -type d -name 'node_modules' -prune -o -type d -name .git -print)"

        SPECIALCASE="0"
        if [[ ${1} =~ ${TEST} ]]; then

          _EVAL="/bin/bash \"${0}\" -i ${1}"

          SPECIALCASE="-i"
        fi

        if [ "${1}" = "hook" ]; then

          _EVAL="/bin/bash \"${0}\" --hook"

          SPECIALCASE="--hook"
        fi

        while read -r GITDIR
        do
          (
            cd "${GITDIR}/.."

            { green "processing: $(pwd):"; } 2>&3

            if [ ${SPECIALCASE} = "-i" ]; then

              if [ ! -f ".git/sshh" ]; then

                eval "$_EVAL"
              else

                { gray "    already set: $(cat ".git/sshh")"; } 2>&3
              fi

            elif [ ${SPECIALCASE} = "--hook" ]; then

              eval "$_EVAL"
            else

              eval "$_EVAL"
            fi
          )
        done <<< "${LIST}"

        exit 0
        ;;
      list)

        LIST="$(find . -type d -name 'node_modules' -prune -o -type d -name .git -print)"

        while read -r GITDIR
        do
          (
            cd "${GITDIR}"

            echo "$(pwd)";

            if [ -f "sshh" ]; then
              SSHH="$(cat sshh)"

              { green "    ${SSHH}"; } 2>&3
            else

              { red "    not set"; } 2>&3
            fi
          )
        done <<< "${LIST}"

        exit 0
        ;;
    *)

      echo ""
      echo "${0} error: unhandled arg";
      ;;
    esac

  help

  exit 0
fi

if [ "${HELP}" = "1" ]; then

  cat <<EEE

 usage once installed:
 just call
     sshh
 or
     sshh 2
 to choose second key from the list

      sshh -i \$(sshh _ xyz)
 switch .git/sshh to key given by name xyz

     sshh _
 to list current key in form of string basename of the key/file loaded, eg: "key1"

     sshh _ key1
 to print number of the key on the list by name, return example "1" - for first, "2" - for second
 then you can use it to switch to that using: sshh 2

     sshh -i
     sshh --init
 initialising .git/sshh value in interactive mode

     sshh -i 2
     sshh --init 2
 initialising .git/sshh value in non interactive mode - immediately

     sshh -a
     sshh --auto
 autoswitch based on .git/sshh value
 not switching and exit status 0 if file not found

     sshh -f
 find mode with its own help page

     sshh --hook
 mounting standalone ".git/.sshhooks/commit-msg" on husky not detected in git config --get core.hooksPath

EEE

  exit 0
fi

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

if [ "${HOOK}" = "1" ]; then

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

    echo "${0} error: CURRENTDIR 2 is pointing to /"

    exit 1
  fi

  (
    cd "${CURRENTDIR}"

    CURRENT="$(git config --get core.hooksPath)"

    if [ "${CURRENT}" = ".husky" ]; then

      { yellow "\n${0} info:\n\nHooks are already controlled by husky\n\n    git config --get core.hooksPath            ${CURRENT}\n"; } 2>&3

      exit 0
    fi

    HOOKDIR=".git/.sshhooks"

#    if [ "${CURRENT}" = "${HOOKDIR}" ]; then
#
#      { green "\n${0} info:\n\nHook is already mounted\n\n    git config --get core.hooksPath            ${CURRENT}\n"; } 2>&3
#
#      exit 0
#    fi

    git config core.hooksPath "${HOOKDIR}"

    mkdir -p "${HOOKDIR}"

    HOOKFILE="${HOOKDIR}/commit-msg"

    cat <<EEE > "${HOOKFILE}"
if [ -f ~/.huskyrc ]; then

  cat <<III

  ${HOOKDIR} mode:

III

  source ~/.huskyrc
else

  echo "\${0} error: ~/.huskyrc doesn't exist"

  exit 1
fi
EEE

    chmod a+x "${HOOKFILE}"

    echo 'mounted'
  )

  exit 0
fi

if [ "${AUTO}" = "1" ]; then

  echo "auto mode"

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

  SSHHCONFIG="${CURRENTDIR}/.git/sshh";

  if [ ! -f "${SSHHCONFIG}" ]; then

    cat <<EEE

  sshh: NOTICE: SSHHCONFIG [${SSHHCONFIG}] doesn't exit. use -i param to define it
  = NOTICE == NOTICE == NOTICE ===================================================

EEE

    exit 0
  fi

  VALUE="$(cat "${SSHHCONFIG}")"

  echo "${VALUE}"

  INDEXCUR="$(/bin/bash "${0}" _)"

  INDEXVAL="$(/bin/bash "${0}" _ "${VALUE}")"

  if [ "${INDEXCUR}" != "${INDEXVAL}" ]; then

    cat <<EEE

  sshh: switching ssh key to >${VALUE}< index >${INDEXVAL}<
  =========================================================

EEE

    /bin/bash "${0}" "${INDEXVAL}"

    cat <<EEE

  sshh: now repeat action again because switching is not enough...
  ================================================================

EEE

    exit 1
  else

  cat <<EEE

  sshh: key is already >${VALUE}<
  ===============================

EEE

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

  SSHHCONFIG="${CURRENTDIR}/.git/sshh";

  _LINES="$(echo "${_LIST}" | wc -l)"

  _LINES="$(trim "${_LINES}")"

  if [ "${_LIST}" = "" ] || [ "${_LINES}" -lt "1" ]; then

    { red "\n${0} error:   No keys found\n"; } 2>&3

    _exit 2> /dev/null || true
  fi

  if [ "${1}" = "" ]; then

    echo ""

    echo "Choose key to add to config:"

    echo "    ${SSHHCONFIG}"
  else
    SKIP="1"
  fi

  SSHS=""

  if [[ ${1} =~ ${TEST} ]] && [[ "${1}" -gt "0" ]] && [ "${1}" -le "${_LINES}" ]; then

    i="${1}"
  fi

  if [ "${i}" = "" ]; then

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
  fi

  SSHS="$(echo "${_LIST}" | sed -n "${i} p")"

  PB="$(basename "${SSHS}")"
  FILENAME="${PB%.*}"
  if [ "${FILENAME}" = "" ]; then
      FILENAME="${PB}"
  fi

  echo "${FILENAME}" > "${SSHHCONFIG}";

  cat <<EEE
           adding: ${FILENAME}
    cat from file: $(cat "${SSHHCONFIG}")
EEE

  if [ "${1}" != "1" ]; then
    echo ""
  fi

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

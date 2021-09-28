
# just run this script in main directory of any git repository
# where you would like to link all files from this directory
#     /bin/bash ../../z_helpers/hardlink.sh
# or use alias, to run it from any directory,
# more about this you will find if you use --help parameter with this script

exec 3<> /dev/null
function green {
    printf "\e[32m$1\e[0m"
}

function red {
    printf "\e[31m$1\e[0m"
}

function yellow {
    printf "\e[33m$1\e[0m"
}

_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh).*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )<"
    BINARY="/bin/zsh"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )<"
    BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )<"
    BINARY="/bin/bash"
    ;;
esac

_CWD="$(pwd -P)"

if [ "$1" = "--help" ]; then

  if [ "$2" = "" ]; then

    ALIAS="hardlink"
  else

    ALIAS="$2"
  fi

  USERDIR="$(eval "realpath ~")"

  if [ "${_SHELL}" = "zsh" ]; then

    RCFILE="${USERDIR}/.zshrc";
  else

    RCFILE="${USERDIR}/.bashrc";
  fi

  { green "\n# to install alias run:\n"; } 2>&3

cat <<EOF

 cat <<WRITE >> "${RCFILE}"

alias hardlink="${BINARY} \"${_DIR}/$(basename "${0}")\""
WRITE
source "${RCFILE}"
alias

EOF

  set -e; _exit 1> /dev/null 2> /dev/null
fi

if [ -n "$1" ]; then

  _CWD="1: $1"
fi

git --help 1> /dev/null 2> /dev/null

if [ "$?" = "127" ]; then

  { red "git is not installed"; } 2>&3

  set -e; _exit 1> /dev/null 2> /dev/null
fi

git diff --exit-code 1> /dev/null 2> /dev/null

if [ "$?" = "129" ]; then

  { red "can't run this script in directory not tracked with git"; } 2>&3

  set -e; _exit 1> /dev/null 2> /dev/null
fi

if [ -f "${_CWD}/.git/config" ]; then

  echo '.git/config detected, creating helpers directory'

  mkdir -p helpers

  _CWD="${_CWD}/helpers";

  echo ""
fi

function processLine {
  (
    cd "${_CWD}"

    RELATIVE="$(node -e "var p=require('path');process.stdout.write(p.relative(\"${_CWD}\", p.resolve(\"${_DIR}\", \"$1\")))")"

    TRY_TO_LINK="0";

    echo -n "$1 "

    if [ -f "$1" ]; then

      INODES="$(ls -l "$1" | awk '{ print $2 }')"

      if [ "${INODES}" = "1" ]; then

        git diff --exit-code "$1" 1> /dev/null 2> /dev/null

        if [ "$?" = "0" ]; then # file is not changed

          diff "${RELATIVE}" "$1" > /dev/null

          if [ "$?" = "0" ]; then # file is not changed

            TRY_TO_LINK="1"

            { green "1 inode "; } 2>&3
          else

            { red "can't link file '$1' to '${RELATIVE}' because files content is different\n"; } 2>&3

            return 1
          fi

        else # there is git diff - file has changed

          { red "file is modified locally, can't relink because local changes will be lost\n"; } 2>&3

          return 1
        fi
      else

        { green "${INODES} inodes - already linked\n"; } 2>&3
      fi
    else

      { green "file missing "; } 2>&3

      TRY_TO_LINK="1"
    fi

    if [ "${TRY_TO_LINK}" = "1" ]; then

      mkdir -p "$(dirname "$1")"

      rm -rf "$1"

      { yellow "linking ${RELATIVE}\n"; } 2>&3

      ln "${RELATIVE}" "$1"
    fi
  )
}

(

  cd "${_DIR}"

  echo ""

  LIST="$(find . -type f | grep -v "$(basename "$0")")"

  echo -e "${LIST}" | while read line ; do

    processLine "$line"

  done

  echo ""
)

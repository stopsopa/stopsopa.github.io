#!/bin/bash

exec 3<> /dev/null
function green {
  printf "\e[32m$1\e[0m\n"
}

function red {
  printf "\e[31m$1\e[0m\n"
}

function yellow {
  printf "\e[33m$1\e[0m\n"
}

REMOTE="origin";
PROD_SCHEMA="https"; # @substitute
PROD_HOST="stopsopa.github.io"; # @substitute
STORAGE="git@github.com:stopsopa/gitstorage.git"; # @substitute

PARAMS=""
while (( "$#" )); do
  case "$1" in
    -r|--remote)
      if [ "$2" = "" ]; then                            # PUT THIS CHECKING ALWAYS HERE IF YOU WAITING FOR VALUE
        { red "$0 error: --remote value can't be empty"; } 2>&3
        exit 1;                                          # optional
      fi                                  # optional
      REMOTE="$2";
      shift 2;
      ;;
    -s|--storage)
      if [ "$2" = "" ]; then                            # PUT THIS CHECKING ALWAYS HERE IF YOU WAITING FOR VALUE
        { red "$0 error: --storage value can't be empty"; } 2>&3
        exit 1;                                          # optional
      fi                                  # optional
      STORAGE="$2";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "$#" )); do          # optional
        if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
        else
          if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
          else
            PARAMS="$PARAMS \"$1\""
          fi
        fi
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash $0 -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      { red "$0 error: Unsupported flag $1"; } 2>&3
      exit 2;
      ;;
    *) # preserve positional arguments
      if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
      else
        if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
        else
          PARAMS="$PARAMS \"$1\""
        fi
      fi
      shift;
      ;;
  esac
done

eval set -- "$PARAMS"

git help > /dev/null;

if [ "${?}" != "0" ]; then

    { red "git is not installed"; } 2>&3

    exit 3
fi

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

TMP="${_DIR}/.git"

if [ ! -d "${TMP}" ]; then

    { red "${TMP} is not a directory"; } 2>&3

    exit 4
fi

TMP="${TMP}/config"

if [ ! -f "${TMP}" ]; then

    { red "${TMP} is not a file"; } 2>&3

    exit 5
fi

REPOURL="$(git config --get "remote.$REMOTE.url")"

if [ "${?}" != "0" ]; then

    { red "git config --get \"remote.$REMOTE.url\" - failed"; } 2>&3

    exit 6
fi

REPOURL="$(echo "${REPOURL}"| sed -E 's/\//__/g')"

echo "REMOTE=$REMOTE"
echo "REPOURL=$REPOURL"
echo "$@"



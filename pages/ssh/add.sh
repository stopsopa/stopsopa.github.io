#!/bin/bash

# This script is for registering particular key everytime you run terminal
# There is another though for manual changing of keys
# called sshh.sh

# to install it , just add to ~/.bash_profile
#        /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh firstkey secondkey

# and then also use sshh script from:
# https://stopsopa.github.io/pages/ssh/index.html#sshh-manually-swap-ssh-key

DIR="/Volumes/WINSCP/ssh/ssh"

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

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

if [ "$#" = "0" ]; then

  { red "\n$0 error:   specify parameters\n"; } 2>&3

  exit 1
fi

LOADED="$(ssh-add -l)"

if [[ ! $LOADED = *"The agent has no identities"* ]]; then

  { green "\n$0: Keys already loaded\n"; } 2>&3

  echo "$LOADED"
  
  echo -e "\nto unregister keys run ssh-add -D"

  exit 0
fi

_CMD="find \"$DIR\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

_LIST="$(eval "$_CMD")"

_CODE="$?"

if [ "$_CODE" != "0" ]; then

{ red "$0 error: $(cat <<END

$0 error:
command:

  $_CMD

has crushed with status code: >>$_CODE<<

END
)"; } 2>&3

    exit $_CODE;
fi

_LINES="$(echo "$_LIST" | wc -l)"

_LINES="$(trim "$_LINES")"

if [ "$_LIST" = "" ] || [ "$_LINES" -lt "1" ]; then

  { red "\n$0 error:   No keys found\n"; } 2>&3

  exit 1
fi

ssh-add -D

while : ; do

  if [ "$1" = "" ]; then

    echo -e "\n\n   loaded keys:"

    ssh-add -l

    echo -e "\nto unregister keys run ssh-add -D"

    { green "\n   all good"; } 2>&3

    exit 0
  fi

  KEY="$1"

  shift;

  (

    cd "$DIR";

    if [ ! -e "$DIR/$KEY" ]; then

      { red "\n$0 error:   file '$DIR/$KEY' doesn't exist\n"; } 2>&3

      exit 1
    fi

    cp "$DIR/$KEY" ~/.ssh/

    chmod 600 ~/.ssh/$KEY

    echo -e "executing command:\n\n    ssh-add ~/.ssh/$KEY\n"

    ssh-add ~/.ssh/$KEY

    _CODE="$?"

    rm ~/.ssh/$KEY

    GITCONFIG="$DIR/$KEY.sh"

    if [ -f "$GITCONFIG" ]; then

      echo "Executing '$GITCONFIG'"

      /bin/bash "$GITCONFIG"

      git config --global -l | egrep "(user\.name|user\.email)"
    else

    { yellow "$(cat <<END

  WARNING:

  git config file '$GITCONFIG' not found

  check config:

    git config --global -l

END
    )"; } 2>&3

    fi

    if [ "$_CODE" != "0" ]; then

    { red "$0 error:$(cat <<END

$0 error:
command:

  $_CMD

has crushed with status code: >>$_CODE<<

END
)"; } 2>&3

      exit $_CODE;
    fi

  )
done

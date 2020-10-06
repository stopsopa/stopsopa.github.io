#!/bin/bash

# to use it , just add to ~/.bash_profile
#        /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh

# and then also use sshh script from:
# https://stopsopa.github.io/pages/ssh/index.html#ssh-key-tool

DEFKEY="first"


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



THISFILE=${BASH_SOURCE[0]}

DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

ssh-add -l

if [ "$?" = "0" ]; then

	echo "there is already key registered"

	exit 0
fi

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

_CMD="find \"$DIR\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

_LIST="$(eval "$_CMD")"

_CODE="$?"

_LIST="$(trim "$_LIST")"

if [ "$_CODE" != "0" ]; then

    echo ""
    echo "$0 error:"
    echo -e "command:\n    $_CMD"
    echo "has crushed with status code: >>$_CODE<<"
    echo ""

    exit $_CODE;
fi

_LINES="$(echo "$_LIST" | wc -l)"

_LINES="$(trim "$_LINES")"

if [ "$_LIST" = "" ] || [ "$_LINES" -lt "1" ]; then

    echo "No keys found"

    exit 1
fi

for name in $_LIST
do

    key="$(echo "$name" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

    ssh-add -D "$name"
done

key="$DEFKEY"

cp "$DIR/$DEFKEY" ~/.ssh/
chmod 600 ~/.ssh/$key
ssh-add ~/.ssh/$key

echo -e "executing command:\n\n    ssh-add ~/.ssh/$key\n"

ssh-add ~/.ssh/$key

_CODE="$?"

rm ~/.ssh/$key

GITCONFIG="$DIR/$key.sh"

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

{ red "$(cat <<END

$0 error:
command:

  $_CMD

has crushed with status code: >>$_CODE<<

END
)"; } 2>&3

    exit $_CODE;
fi

ssh-add -l

{ green "\n\n   all good\n\n"; } 2>&3




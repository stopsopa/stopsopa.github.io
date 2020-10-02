
__DIR="/Volumes/WINSCP/ssh/ssh"

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

ssh-add -l

if [ "$1" = "install" ]; then

  TEST="alias sshh=\"/bin/bash ~/sshh.sh\""

  CONTENT="$(cat ~/.bashrc)"

  if [[ $CONTENT =~ $TEST ]]; then

      echo "already installed just use"
  else

      echo 'alias sshh="/bin/bash ~/sshh.sh"' >> ~/.bashrc

      echo 'alias sshh="/bin/bash ~/sshh.sh"' >> ~/.bash_profile

      source ~/.bashrc

      echo "now just use"
  fi

  echo -e "\n    sshh\n\nto switch ssh key"

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

_CMD="find \"$__DIR\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

echo -e "executing command:\n\n    $_CMD\n"

_LIST="$(eval "$_CMD")"

_CODE="$?"

_LIST="$(trim "$_LIST")"

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

_LINES="$(echo "$_LIST" | wc -l)"

_LINES="$(trim "$_LINES")"

if [ "$_LIST" = "" ] || [ "$_LINES" -lt "1" ]; then

    { red "\n\n   No keys found\n\n"; } 2>&3

    exit 1
fi

echo "Choose key to add:"

SSHS=""

TEST="^[0-9]+$"

while : ; do

    i="1"
    for name in $_LIST
    do

        name="$(echo "$name" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

        echo "$i) ${name}"

        i=$(($i + 1))
    done

    printf ">"

    if [ "$_LINES" -lt "10" ]; then

      read -n1 i
    else

      read i
    fi

    echo ""

    if ! [[ $i =~ $TEST ]]; then

{ red "$(cat <<END

given value ($i) should be an integer

try again:

END
)"; } 2>&3

        continue;
    fi

    if [[ "$i" -lt "1" ]] || [ "$i" -gt "$_LINES" ]; then

{ red "$(cat <<END

given value ($i) should be an integer > 0 but <= than $_LINES

try again:

END
)"; } 2>&3

        continue;
    fi

    SSHS="$(echo "$_LIST" | sed -n "$i p")"

    break;
done

for name in $_LIST
do

    key="$(echo "$name" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

    echo "unregister) ${key}"

    ssh-add -D "$name"
done

key="$(echo "$SSHS" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

cp "$SSHS" ~/.ssh/
chmod 600 ~/.ssh/$key
ssh-add ~/.ssh/$key

echo -e "executing command:\n\n    ssh-add ~/.ssh/$key\n"

ssh-add ~/.ssh/$key

_CODE="$?"

rm ~/.ssh/$key

GITCONFIG="$__DIR/$key.sh"

if [ -f "$GITCONFIG" ]; then

  /bin/bash "$GITCONFIG"
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






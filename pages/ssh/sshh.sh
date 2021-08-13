
# This script is for manual change of keys
# There is another though to autmaticaly register key
# everytime you run terminal called add.sh
# To install visit link:
#     https://stopsopa.github.io/pages/ssh/index.html#sshh-manually-swap-ssh-key




# To clear all keys in ssh agent
# ssh-add -D
# to list added
# ssh-add -L

# DIR="/Volumes/WINSCP/ssh/ssh"

PARAMS=""
_EVAL=""
while (( "$#" )); do
  case "$1" in
    -d|--dir)
      DIR="$2";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "$#" )); do          # optional
        if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
          _EVAL="$_EVAL &&"
        else
          if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
            _EVAL="\"$1\""
          else
            PARAMS="$PARAMS \"$1\""
            _EVAL="$_EVAL \"$1\""
#          PARAMS="$(cat <<EOF
#$PARAMS
#- "$1"
#EOF
#)"
          fi
        fi
        echo "                PARAMS1>>$PARAMS<<"
        echo "                _EVAL 2>>$_EVAL<<"
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash $0 -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      echo "$0 error: Unsupported flag $1" >&2
      exit 1;
      ;;
    *) # preserve positional arguments
      if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
          _EVAL="$_EVAL &&"
      else
        if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
            _EVAL="\"$1\""
        else
          PARAMS="$PARAMS \"$1\""
            _EVAL="$_EVAL \"$1\""
#          PARAMS="$(cat <<EOF
#$PARAMS
#- "$1"
#EOF
#)"
        fi
      fi
      # echo "                PARAMS2>>$PARAMS<<"
      # echo "                _EVAL 1>>$_EVAL<<"
      shift;
      ;;
  esac
done

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

PARAMS="$(trim "$PARAMS")"
_EVAL="$(trim "$_EVAL")"

# set positional arguments in their proper place
eval set -- "$PARAMS"

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

if [ "$DIR" = "" ]; then


  { red "\n$0 error:   --dir is not specified\n"; } 2>&3


  _exit 2> /dev/null
fi

echo "currently loade files"
ssh-add -l

echo ""

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

  _exit 2> /dev/null || true
fi

_CMD="find \"$DIR\" -type f -maxdepth 1 | egrep -v '^.*?\.(7z|sh|pub)$' | sort"

echo -e "executing command:\n\n    $_CMD\n"

_LIST="$(eval "$_CMD")"

_CODE="$?"

_LIST="$(trim "$_LIST")"

if [ "$_CODE" != "0" ]; then

{ red "$0 error:$(cat <<END

$0 error:
command:

  $_CMD

has crushed with status code: >>$_CODE<<

END
)"; } 2>&3

    echo exit $_CODE;

    _exit 2> /dev/null || true
fi

_LINES="$(echo "$_LIST" | wc -l)"

_LINES="$(trim "$_LINES")"

if [ "$_LIST" = "" ] || [ "$_LINES" -lt "1" ]; then

  { red "\n$0 error:   No keys found\n"; } 2>&3

  _exit 2> /dev/null || true
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

{ red "$0 error: $(cat <<END

given value ($i) should be an integer

try again:

END
)"; } 2>&3

      _exit 2> /dev/null || true
    fi

    if [[ "$i" -lt "1" ]] || [ "$i" -gt "$_LINES" ]; then

{ red "$0 error: $(cat <<END

given value ($i) should be an integer > 0 but <= than $_LINES

try again:

END
)"; } 2>&3

      _exit 2> /dev/null || true
    fi

    SSHS="$(echo "$_LIST" | sed -n "$i p")"

    break;
done

ssh-add -D

#for name in $_LIST
#do
#
#    key="$(echo "$name" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"
#
#    ssh-add -D "$name"
#done

key="$(echo "$SSHS" | perl -pe 's#^.*?\/([^\/]*)$#\1#')"

cp "$SSHS" ~/.ssh/
chmod 600 ~/.ssh/$key

echo -e "executing command:\n\n    ssh-add ~/.ssh/$key\n"

ssh-add ~/.ssh/$key

_CODE="$?"

rm ~/.ssh/$key

GITCONFIG="$DIR/$key.sh"

if [ -f "$GITCONFIG" ]; then

  echo "Executing '$GITCONFIG'"

  /bin/bash "$GITCONFIG"

  echo ""
  git config --global -l | egrep "(user\.name|user\.email)"
  echo ""
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

{ red "$0 error: $(cat <<END

$0 error:
command:

  $_CMD

has crushed with status code: >>$_CODE<<

END
)"; } 2>&3

  _exit 2> /dev/null || true
fi

ssh-add -l

{ green "\n   all good\n"; } 2>&3

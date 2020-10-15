#!/bin/bash

GITSTORAGESOURCE="git@github.com:stopsopa/gitstorage.git"

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

set -e
#set -x

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

_CONFIG="$_DIR/gitstorage-config.sh";
_HELP="0"
_CREATE="0"
_FORCE="0"

PARAMS=""

while (( "$#" )); do
  case "$1" in
    --force)
      _FORCE="1";
      shift;
      ;;
    --create)
      _CREATE="1";
      shift;
      ;;
    -h|--help)
      _HELP="1";
      shift;
      ;;
    -c|--config)
      _CONFIG="$2";
      shift 2;
      ;;
    -*|--*=) # unsupported flags
      { red "$0 error: Unsupported flag $1"; } 2>&3
      exit 1;
      ;;
    *) # preserve positional arguments
      if [ "$PARAMS" = "" ]; then
          PARAMS="\"$1\""
      else
          PARAMS="$PARAMS \"$1\""
      fi
      shift;
      ;;
  esac
done

CONFIG=$(cat <<END
#!/bin/bash

GITSTORAGESOURCE="git@github.com:stopsopa/gitstorage.git"

GITSTORAGETARGETDIR="github-stopsopa.github.io"

GITSTORAGELIST=(
    ".env::\$GITSTORAGETARGETDIR/.env"
    "gitstorage-config.sh::\$GITSTORAGETARGETDIR/gitstorage-config.sh"
)
END
);

if [ "$_CREATE" = "1" ]; then

  if [ -f gitstorage-config.sh ]; then

    { red "\n    file gitstorage-config.sh already exist\n"; } 2>&3
  else

    echo "$CONFIG" > gitstorage-config.sh

    { green "\n    file gitstorage-config.sh created\n"; } 2>&3
  fi

  exit 0;
fi

if [ "$_HELP" = "1" ]; then

cat << EOF

Just create config file gitstorage-config.sh like:

  use command

    /bin/bash "$0" --create

  to create it

>>>>>>>
$CONFIG
<<<<<<<<


and use this script like:

/bin/bash $0 isinsync
/bin/bash $0 pull
/bin/bash $0 push

# you can specify different config
/bin/bash $0 -c "gitstorage-config.sh"

EOF


  exit 0
fi

if [ "$_CONFIG" = "" ]; then

  { red "$0 error: --config value can't be empty"; } 2>&3

  exit 1;
fi

if ! [ -f "$_CONFIG" ]; then

  { red "$0 error: --config file '$_CONFIG' doesn't exist"; } 2>&3

  exit 1;
fi

source "$_CONFIG";

# this will check if array exist and it will count it,
# if it doesn't exist and can't be counted then this will return 0
_COUNT="${#GITSTORAGELIST[@]}";

if [ $_COUNT -lt 1 ] ; then

  { red "$0 error: list GITSTORAGELIST in config '$_CONFIG' shouldn't be empty"; } 2>&3

  exit 1;
fi

# set positional arguments in their proper place
eval set -- "$PARAMS"

_CONFIGDIR="$(dirname "$_CONFIG")"

_TARGETGITDIR="";

while true
do

  _TARGETGITDIR="$_CONFIGDIR/$(openssl rand -hex 2)"

  if ! [ -d "$_TARGETGITDIR" ]; then

    break;
  fi
done

function cleanup {

  rm -rf "$_TARGETGITDIR" || true
}

trap cleanup EXIT

mkdir -p "$_TARGETGITDIR"

MODE="$1"

TEST="^(isinsync|pull|push)$"

if ! [[ $MODE =~ $TEST ]]; then

  { red "$0 error: mode $MODE don't match pattern $TEST"; } 2>&3

  exit 1;
fi




if [ $MODE = "isinsync" ]; then

  (cd "$_TARGETGITDIR" && git clone "$GITSTORAGESOURCE" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    _S="$_CONFIGDIR/$_S"

    if [ -f "$_S" ]; then

      _T="$_TARGETGITDIR/$_T"

      _TMPDIR="$(dirname "$_T")"

      mkdir -p "$_TMPDIR";

      cp "$_S" "$_T"

    else

      { red "$0 error: source file '$_S' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "$_TARGETGITDIR" && git status -s)"

  if [ "$DIFFSTATUS" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  { green "\n    files are not in sync\n"; } 2>&3

  (cd "$_TARGETGITDIR" && git status)

  exit 1;
fi




if [ $MODE = "push" ]; then

  if [ "$_FORCE" = "0" ]; then

    set +e

    /bin/bash "$0" -c "$_CONFIG" isinsync

    if [ "$?" = "0" ]; then

      exit 0;
    else

      { red "$0 error: files are not in sync, if you sure that you want to push them add --force param"; } 2>&3

      exit 1;
    fi

    set -e
  fi

  (cd "$_TARGETGITDIR" && git clone "$GITSTORAGESOURCE" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"


      # making sure that file will be copied in at least one directory
      _TMPDIR="$(dirname "$_T")"

      if [ "$_TMPDIR" = "." ]; then

        { red "$0 error: target file '$_T' should be in folder like 'xxx/$_T'"; } 2>&3

        exit 1

      fi


    _S="$_CONFIGDIR/$_S"

    if [ -f "$_S" ]; then

      _T="$_TARGETGITDIR/$_T"

      _TMPDIR="$(dirname "$_T")"

      mkdir -p "$_TMPDIR";

      cp "$_S" "$_T"

      { yellow "'$_S' -> '$_T'"; } 2>&3

    else

      { red "$0 error: source file '$_S' doesn't exist"; } 2>&3

    fi

  done

  DIFFSTATUS="$(cd "$_TARGETGITDIR" && git status -s)"

  if [ "$DIFFSTATUS" = "" ] ; then

      { green "\n    files are in sync\n"; } 2>&3

      exit 0;
  fi

  (cd "$_TARGETGITDIR" && git add .)

  (cd "$_TARGETGITDIR" && git commit -a --allow-empty-message -m '')

  (cd "$_TARGETGITDIR" && git push origin master)

  exit 0;
fi



if [ $MODE = "pull" ]; then

  if [ "$_FORCE" = "0" ]; then

    set +e

    /bin/bash "$0" -c "$_CONFIG" isinsync

    if [ "$?" = "0" ]; then

      exit 0;
    else

      { red "$0 error: files are not in sync, if you sure that you want to pull them add --force param"; } 2>&3

      exit 1;
    fi

    set -e
  fi

  (cd "$_TARGETGITDIR" && git clone "$GITSTORAGESOURCE" .)

  for index in "${GITSTORAGELIST[@]}"; do

    _S="${index%%::*}"

    _T="${index##*::}"

    _S="$_CONFIGDIR/$_S"

    _T="$_TARGETGITDIR/$_T"

    if [ -f "$_T" ]; then

      _TMPDIR="$(dirname "$_S")"

      mkdir -p "$_TMPDIR";

      cp "$_T" "$_S"

      { yellow "'$_T' -> '$_S'"; } 2>&3
    else

      { red "file '$_T' doesn't exist in repository, it might be worth to remove it from config file '$_CONFIG'"; } 2>&3
    fi

  done

  { green "\n    files copied\n"; } 2>&3

  exit 0;
fi

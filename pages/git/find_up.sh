
# add to ~/.bash_profile or ~/.zshrc
# 
# alias stree="/bin/bash \"${REPO_DIR}/pages/git/find_up.sh\" open -a SourceTree ."
#
# alias sm="/bin/bash \"${REPO_DIR}/pages/git/find_up.sh\" open -a \"/Applications/Sublime Merge.app\" \"\$(pwd)\""
# 

function quote {
  echo "$1" | sed -E 's/\"/\\"/g'
}

PARAMS=""
_EVAL=""
function collect {
  if [ "$1" = "&&" ]; then
    PARAMS="$PARAMS \&\&"
    _EVAL="$_EVAL &&"
  else
    if [ "$PARAMS" = "" ]; then
      PARAMS="\"$(quote "$1")\""
      _EVAL="\"$(quote "$1")\""
    else
      PARAMS="$PARAMS \"$(quote "$1")\""
      _EVAL="$_EVAL \"$(quote "$1")\""
      #PARAMS="$(cat <<EOF
      #$PARAMS
      #- "$1"
      #EOF
      #)"
    fi
  fi
  # echo "                PARAMS1>>$PARAMS<<"
  # echo "                _EVAL 2>>$_EVAL<<"
}
while (( "$#" )); do
  case "$1" in
    --) # end argument parsing
      shift;
      while (( "$#" )); do          # optional
        collect "${1}" "${2}";
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash $0 -f -c -- -f "multi string arg"
      break;
      ;;
    *) # preserve positional arguments
      collect "${1}" "${2}";
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

# cat <<EEE

# PARAMS>${PARAMS}<
# _EVAL>${_EVAL}<

# EEE


# exit 8






_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac


ORIGINAL_PWD="${_PWD}"

echo "SCRIPT: ${_SCRIPT}"

while : ;
do
    echo "searching for .git in >${_PWD}<"

    GIT="${_PWD}/.git/objects"

    # to check if .git is a file indicating 'worktree'
    # git worktree
    # see more: https://www.youtube.com/watch?v=ntM7utSjeVU
    GITFILE="$(cat .git 2> /dev/null | grep '^gitdir: ' | wc -l | awk '{$1=$1};1')"

    if [ -d "${GIT}" ] || [ "${GITFILE}" = "1" ]; then

        cat <<EEE

    found .git deep in >${ORIGINAL_PWD}<

    running: 
                    cd "${_PWD}"
                    eval ${_EVAL}

EEE

        (
            cd "${_PWD}"
            eval ${_EVAL}
            # open -a SourceTree .
        )
        
        exit 0
    fi

    if [ "${_PWD}" = "/" ]; then

        cat <<EEE
    
    .git directory in >${ORIGINAL_PWD}< NOT found

EEE
        exit 1
    fi

    _PWD="$(dirname "${_PWD}")"
done
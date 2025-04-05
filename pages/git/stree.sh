

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
                    open -a SourceTree .

EEE

        (
            cd "${_PWD}"
            open -a SourceTree .
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
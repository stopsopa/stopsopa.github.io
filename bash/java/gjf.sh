#!/usr/bin/env bash

google-java-format -version
if [ "${?}" != "0" ]; then
    cat <<EEE

    ${0} error: google-java-format not installed

    mac: 
        export HOMEBREW_NO_AUTO_UPDATE=1 && brew install google-java-format

EEE

    exit 1
fi

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="${_SHELL##*/}"
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

ROOT="${_PWD}"

MODE="help"
WRONGARG="0"
if [ "${1}" != "" ]; then
    if [ "${1}" = "--list" ] || [ "${1}" = "--format" ]; then
        MODE="${1}"
    else
        WRONGARG="1"
    fi
fi

if [ "${MODE}" = "help" ]; then

    cat <<EEE

This script is working in PWD    

 --list
   will list files to format
   also exit code will be 0 if nothing to format and 1 when at least one file not formatted

 --format
   format files - exit code always 0 if not irregular errors
   no matter if formatted anything or not

EEE
    if [ "${WRONGARG}" = "1" ]; then

        cat <<EEE

    ${0} error: wrong argument, should be --list or --format

EEE
        exit 50;
    fi  

    exit 0; 
fi

# WARNING: 
# IF YOU WOULD LIKE TO ADD ANOTHER DIRECTORY TO NOT ENTER BE CAREFUL WITH -o
# IT SHOULD AFTER ALL EXCEPT LAST ONE LINE IN FIRST \( ... \)
# WARNING: 
S="\\"
FIND="$(cat <<EOF
find . \( $S
    -type d -name node_modules -prune -o $S
    -type d -name .git -prune -o $S
    -type d -name .github -prune -o $S
    -type d -name dist -prune -o $S
    -type d -name docker -prune -o $S
    -type d -name bash -prune -o $S
    -type d -name coverage -prune -o $S
    -type d -name var -prune -o $S
    -type d -name target -prune $S
\) $S
-o $S
\( -type f \( -name "*.java" \) -print \)
EOF
)"

printf "\n$FIND\n\n"

FIND="${FIND//\\$'\n'/}"

# or capture result
LIST="$(eval "${FIND}")"

cat <<EEE

${0}: all java files found:

EEE

while read -r FILE
do
echo "${0}: found: ${FILE}"
done <<< "${LIST}"

MATCHING=()

while read -r FILE
do
    if ! google-java-format --set-exit-if-changed --dry-run "${FILE}" > /dev/null 2>&1; then 
        # add to the end of array
        MATCHING+=("${FILE}") 
    fi
done <<< "${LIST}"

# to new line separated list
MATCHING=$(printf "%s\n" "${MATCHING[@]}")

cat <<EEE

${0}: list of files to format:

EEE

STATUS="0"

set -e

while read -r FILE
do
  if [ "${FILE}" != "" ]; then

    if [ "${MODE}" = "--format" ]; then
        echo "${0}: formatting ${FILE}"  
        google-java-format -i "${FILE}"  
        google-java-format -i "${FILE}"  
    else
        echo "${0}: not formatted ${FILE}"  
        STATUS="1"  
    fi    
  fi       
done <<< "${MATCHING}"

if [ "${STATUS}" = "0" ]; then
    echo -e "${0}: all files formatted\n"
fi

exit ${STATUS}
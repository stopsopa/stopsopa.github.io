# Just place this script in source directory
# and setup TARGETDIR and EXCLUDE_LIST and optionally EXCLUDE_FILE_NAME env var
#
# Script this will make sure TARGETDIR exist and is directory then
# it will generate file with exclusions right next to THIS script - in the same directory based on EXCLUDE_LIST env var
# then it will execute rsync command:
#   rsync -azP --delete-after --exclude-from "exclude file" "sourcedir/" "targetdir/"

TARGETDIR="/Volumes/256gb vol2"

# use /bin/bash rsync.sh --dry
# to obtain list of thing which should be excluded
# just take paths from output as they are
# those links are always relative
EXCLUDE_LIST=$(cat <<EOF
# this file is generated
# if you want to modify it edit it in rsync.sh

System Volume Information
.Spotlight-V100
.Trashes
.fseventsd/
.fseventsd/fseventsd-uuid
book
record
EOF
);

EXCLUDE_FILE_NAME="__rsync_exclude.txt";

DOCKER_SYNC_IMAGE="instrumentisto/rsync-ssh"

# # for manpages
# cat <<EOF | docker build -t ubuntu:18.04-man -
# FROM ubuntu:18.04
# RUN apt-get update && yes | unminimize
# EOF
# # docker images | grep ubuntu | grep 18.04-man
# # docker run -it ubuntu:18.04-man bash

# current shell name reliably
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
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

EXCLUDE_FILE="${_DIR}/${EXCLUDE_FILE_NAME}"

echo "${EXCLUDE_LIST}" > "${EXCLUDE_FILE}"

# CMD="rsync -azP --delete-after --exclude-from \"${EXCLUDE_FILE}\" \"${_DIR}/\" \"${TARGETDIR}/\""

CMDi="rsync -rltzDPvi --delete-after --exclude-from \"/source/${EXCLUDE_FILE_NAME}\" /source/ /target/"
CMD="rsync  -rltzDPv  --delete-after --exclude-from \"/source/${EXCLUDE_FILE_NAME}\" /source/ /target/"

DOCKER="docker run -i -w \"/source\" -v \"${_DIR}:/source\" -v \"${TARGETDIR}:/target\" ${DOCKER_SYNC_IMAGE} /bin/sh"

if [ "${1}" = "" ]; then

RED=$(tput setaf 1)
RESET=$(tput sgr0)

EXIST=""
if [ ! -d "${TARGETDIR}" ]; then
EXIST=$(cat <<AAA

${RED} directory "${TARGETDIR}" doesnt exist - insert sd card${RESET} 


AAA
);
fi

cat <<EEE

Just place this script in source directory
and setup TARGETDIR and EXCLUDE_LIST and optionally EXCLUDE_FILE_NAME env var

Script this will make sure TARGETDIR exist and is directory then
it will generate file with exclusions right next to THIS script - in the same directory based on EXCLUDE_LIST env var
and depends on --dry or --run it will do rest:
${EXIST}

/bin/bash rsync.sh --dry
    # dry run
    # will execute
        echo '${CMDi} -n' | ${DOCKER}

        # version without docker
            /bin/bash rsync.sh --cover; rsync -rtlDzPvi --delete-after --exclude-from "${EXCLUDE_FILE}" "${_DIR}/" "${TARGETDIR}/" -n

/bin/bash rsync.sh --run
    # execute
    # will execute
        echo '${CMD}' | ${DOCKER}

        # version without docker
            /bin/bash rsync.sh --cover; rsync -rtlDzPv --delete-after --exclude-from "${EXCLUDE_FILE}" "${_DIR}/" "${TARGETDIR}/"

EEE

    exit 0
fi

set -e

if [ "${1}" = "--cover" ]; then 

    find . -name ".DS_Store" -type f -delete

    LIST="$(find . -type f -name "big.png" -o -name "artwork.png" -o -name "big.jpg")"

if [ "${LIST}" = "" ]; then

  cat <<EEE

  no covers found

EEE
else
  COUNT="$(echo "${LIST}" | wc -l)"
  I="0"
  while read -r xxx
  do
    PD="$(dirname "${xxx}")"
    PB="$(basename "${xxx}")"
    EXTENSION="${PB##*.}"
    FILENAME="${PB%.*}"
    if [ "${FILENAME}" = "" ]; then
        FILENAME="${PB}"
        EXTENSION=""
    fi
    if [ "${FILENAME}" = "${PB}" ]; then
        EXTENSION=""
    fi

    # echo "PD: ${PD}"
    # echo "PB: ${PB}"
    # echo "FILENAME: ${FILENAME}"
    # echo "EXTENSION: ${EXTENSION}"
    (
        cd "${PD}"
        if [ ! -f "cover.${EXTENSION}" ]; then
            echo CREATING "${PD}/cover.${EXTENSION}"
            cp "${PB}" "cover.${EXTENSION}"
            sips -z 170 170 "cover.${EXTENSION}"
        else
            echo already exist "${PD}/cover.${EXTENSION}"
        fi
    )
  done <<< "${LIST}"
fi

    exit 0
fi

if [ -d "${TARGETDIR}" ]; then

    echo "'${TARGETDIR}' exist"
else    

    echo "${0} error: '${TARGETDIR}' is not a directory"

    exit 1
fi

#find . -type f -name "big.png" -o -name "artwork.png" -o -name "big.jpg"

if [ "${1}" = "--run" ]; then

    EVAL="echo '${CMD}' | ${DOCKER}"

    cat <<EEE

docker:
    ${EVAL}    

host:
    (cd "${_DIR}"; /bin/bash rsync.sh --cover; rsync -rltzDPv --delete-after --exclude-from "${EXCLUDE_FILE}" "./" "${TARGETDIR}/")

EEE

    exit 0
fi

if [ "${1}" = "--dry" ]; then

    EVAL="echo '${CMDi} -n' | ${DOCKER}"

    cat <<EEE

docker:
    ${EVAL}    

host: (for mac run this version because it is uses default version of rsync which is doing better job on macs)
    (cd "${_DIR}"; /bin/bash rsync.sh --cover; rsync -rltzDPvin --delete-after --exclude-from "${EXCLUDE_FILE}" "./" "${TARGETDIR}/")

EEE

    exit 0
fi

echo "${0} error: param unknown, should be --run or --dry"

exit 1

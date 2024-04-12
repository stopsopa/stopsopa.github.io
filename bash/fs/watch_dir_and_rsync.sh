#!/bin/bash

#
# /bin/bash bash/fs/watch_dir_and_rsync.sh /path/to/source /path/to/target
#     just to creating and updating files
# /bin/bash bash/fs/watch_dir_and_rsync.sh /path/to/source /path/to/target DESTRUCTIVE
#     THIS WILL DELETE FILES IN TARGET - DESTRUCTIVE
#     program seems to successfully create also corresponding directories in target with no problems
#
# /bin/bash bash/fs/watch_dir_and_rsync.sh /path/to/source /path/to/target DESTRUCTIVE -E -e "(ttt|xxx)"
#    exclude all files or directories containg ANYWHERE in the path "ttt" or "xxx"
#
# /bin/bash bash/fs/watch_dir_and_rsync.sh /path/to/source /path/to/target -E -e "(ttt|xxx)"
#    as above but without DESTRUCTIVE mode
#
# summary:
#   generally everything after first two (source & target) and optional DESTRUCTIVE is passed to fswatch
#


fswatch --help 1> /dev/null 2> /dev/null
if [ "${?}" != "0" ]; then
    echo "${0} error: fswatch is not installed"

    exit 1
fi

realpath . 1> /dev/null 2> /dev/null
if [ "${?}" != "0" ]; then
    echo "${0} realpath not installed - on mac run : brew install coreutils";

    exit 1
fi

if [ "${1}" = "" ]; then

    echo "${0} error: source not provided - can be path to directory or a file"

    exit 1
fi

if [ "${2}" = "" ]; then

    echo "${0} error: target not provided - can be path to directory or a file"

    exit 1
fi

if [ -f "${1}" ] || [ -f "${2}" ]; then
    if [ ! -f "${1}" ] && [ ! -f "${2}" ]; then

        echo "${0} error: of target or source is a file then really both should be a files"

        exit 1
    fi
fi

if [ -d "${1}" ] || [ -d "${2}" ]; then
    if [ ! -d "${1}" ] && [ ! -d "${2}" ]; then

        echo "${0} error: of target or source is a directory then really both should be a directories"

        exit 1
    fi
fi

src="$(realpath "${1}")"
dst="$(realpath "${2}")"

DESTRUCTIVE=""

if [ "${3}" = "DESTRUCTIVE" ]; then

    DESTRUCTIVE="DESTRUCTIVE"

    shift;
fi

shift;
shift;

fswatch -0 -r "$src" ${@} | while read -d "" CHANGEDFILE; do

    TARGET="${dst}/${CHANGEDFILE#$src/}"  

    if [ -e "${CHANGEDFILE}" ]; then
        echo "updating >${TARGET}<"
        mkdir -p "$(dirname "${TARGET}")"

        # # this might cause copying premission failure
        # # cp: /Users/szdz/Desktop/IMG_4506.HEIC: could not copy extended attributes to /Volumes/samba_nuc_home_share/node/source/IMG_4506.HEIC: Operation not permitted
        # cp "${CHANGEDFILE}" "${TARGET}"

        # this one though copies just content - shouldn't care about permissions
        rsync -azP --no-o --no-g "${CHANGEDFILE}" "${TARGET}"
    else
        if [ "${DESTRUCTIVE}" = "DESTRUCTIVE" ]; then
            echo "deleting ${TARGET}"
            rm -rf "${TARGET}"
        else
            echo "deleting DESTRUCTIVE OFF ${TARGET}"
        fi
    fi
done
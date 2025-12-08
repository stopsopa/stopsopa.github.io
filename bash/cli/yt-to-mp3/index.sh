
# first argument is ID or youtube url, script will extract ID from it
# [OPTIONAL] second argument is current number of processed file
# [OPTIONAL] third argument is total number of files to process

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

if [ -z "${2}" ] && [ -z "${3}" ]; then
    /bin/bash "${_DIR}/test.sh"
    if [[ "${?}" != "0" ]]; then
        exit 1
    fi
fi

if [ ! -f "${_DIR}/.env" ]; then

    echo "${0} error: .env file not found"

    exit 1
fi

cd "${_DIR}"

source "${_DIR}/.env"

if [ "${ALBUM}" = "" ]; then

    echo "${0} error: ALBUM is not set, usually it should be set in .env file next to this script"

    exit 1
fi

if [ "${YT_TO_MP3_DIR}" = "" ]; then

    echo "${0} error: YT_TO_MP3_DIR is not set, usually it should be set in .env file next to this script"

    exit 1
fi

set -e

TARGETDIR="$(node -e 'process.stdout.write(require("path").resolve(process.argv[1]))' "${YT_TO_MP3_DIR}")"

echo "Target directory: ${TARGETDIR}"

cat <<EEE

TARGETDIR >${TARGETDIR}<

EEE

ID="$(node extract-id.js "${1}")"

if [ -n "${2}" ] && [ -n "${3}" ]; then
    echo "=================== ${2} / ${3} https://youtu.be/${ID}"
fi

if [ -f "${TARGETDIR}/${ID}.mp3" ]; then
    echo "File ${TARGETDIR}/${ID}.mp3 already exists. Skipping."
    
    exit 0
fi

cat <<EEE

ID >${ID}<

EEE

NUMBER="$(yt-dlp -F -- "${ID}" | grep -v remium | grep "audio only" | tail -n 1 | awk '{print $1}' |  tr -d '\n')"

# if statement with regex to check if NUMBER is a number
if [[ ! "${NUMBER}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: NUMBER is not a number"
    exit 1
fi

cat <<EEE

NUMBER >${NUMBER}<

EEE

# yt-dlp -f "${NUMBER}" -o "${TARGETDIR}/%(title)s.%(ext)s" -- "${ID}"

INFO="$(yt-dlp -f "${NUMBER}" -o "${TARGETDIR}/${ID}_tmp.%(ext)s" --print after_move:"%(filename)s||%(title)s||%(uploader)s" -- "${ID}")"

FILENAME="${INFO%%||*}"
REST="${INFO#*||}"

TITLE="${REST%%||*}"
ARTIST="${REST#*||}"

cat <<EEE

INFO >${INFO}<

FILENAME >${FILENAME}<

TITLE >${TITLE}<

ARTIST >${ARTIST}<

EEE

ls -la "${FILENAME}"

OUTPUT="${TARGETDIR}/${ID}.mp3"

ffmpeg -i "${FILENAME}" \
  -vn \
  -b:a 320k \
  -metadata album="${ALBUM}" \
  -metadata title="${TITLE}" \
  -metadata artist="${ARTIST}" \
  "${OUTPUT}"

rm -rf "${FILENAME}"









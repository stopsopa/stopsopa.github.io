
node -v 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "${0} error: node is not installed";

  exit 1
fi

yt-dlp --version 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "${0} error: yt-dlp is not installed";

  exit 1
fi

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

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

INFO="$(yt-dlp -f "${NUMBER}" -o "${TARGETDIR}/%(title)s.%(ext)s" --print after_move:"%(filename)s||%(title)s||%(uploader)s" -- "${ID}")"

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









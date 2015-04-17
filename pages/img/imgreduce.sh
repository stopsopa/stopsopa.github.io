
# in current form this script will reduce filesize by height when specified in the second argument
#

set -e
set -o pipefail

COMMENT="processed with SPECIAL_web/imgreduce.sh"

trap cleanup EXIT
function cleanup {
  echo "    get exiftool: https://exiftool.org/index.html";
}
exiftool -ver 2>&1
trap - EXIT

if [ "${1}" = "" ]; then

    cat <<EEE
File not specified.

Help page:

/bin/bash imgreduce.sh                      # for help
/bin/bash imgreduce.sh [filepath]           # get image info
/bin/bash imgreduce.sh [filepath] 400       # reduce size of an image by width to 400px (keep ratio)
/bin/bash imgreduce.sh [filepath] 400 lock  # will process only once (will create UserComment using exiftool)


find . -type f \( -iname \*.jpg -o -iname \*.png \) | xargs -I %% /bin/bash "${0}" "%%" 400 lock


EEE

    exit 1
fi

if [ ! -f "${1}" ]; then
    echo "File '${1}' not found"

    exit 1
fi

LOCK="0"
if [ "${3}" != "" ]; then
    LOCK="1"
fi

USERCOMMENT="$(exiftool -UserComment "${1}" | awk -F': ' '{print $2}' | awk '{$1=$1};1')"
WIDTH="$(sips -g pixelWidth "${1}" | awk -F: '/pixelWidth/ {print $2}' | awk '{$1=$1};1')"

if ! [[ ${2} =~ ^[0-9]+$ ]]; then

cat <<EEE

    Width should be a number but '${2}' was given
    
    WIDTH       : ${WIDTH}
    USERCOMMENT : ${USERCOMMENT}

    $(exiftool -s "${1}")

EEE

    exit 1;
fi

if [ "${WIDTH}" -gt ${2} ]; then
    echo "Resizing image '${1}' with width '${WIDTH}' to ${2}px"

    if [ "${LOCK}" = "1" ] && [ "${USERCOMMENT}" = "${COMMENT}" ]; then

        echo "Processing abandoned: lock parameter specified and file '${1}' was already processed"

        exit 2
    fi

    # sips -Z 1000 "${1}"
    sips --resampleWidth ${2} "${1}"
    exiftool -P -overwrite_original -UserComment="${COMMENT}" "${1}"
else
    echo "Image '${1}' with width '${WIDTH}' is already smaller than ${2}px"    
fi

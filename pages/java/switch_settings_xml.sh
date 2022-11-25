
TARGET="~/.m2"

eval TARGET="${TARGET}"

if [ "${TARGET}" = "" ]; then

  echo "${0} error: TARGET is empty string - not defined value"

  exit 1
fi

if [ ! -d "${TARGET}" ]; then

  echo "${0} error: TARGET (${TARGET}) is not a directory"

  exit 1
fi

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

LIST="$(ls -la "${TARGET}/" | awk '{ print $9 }' | grep -i -E '^settings_[a-z_\-]+\.xml$')"
# | sed -E 's/^settings_([a-z_-]+).xml$/\1/g')"

LINES="$(echo "${LIST}" | wc -l)"

LINES="$(trim "${LINES}")"

TEST="^[0-9]+$"

cat <<EEE

    current link:

EEE

ls -la "${TARGET}"

while : ; do

    i="1"
    for name in ${LIST}
    do
        name="$(echo "${name}" | sed -E 's/^settings_([a-z_-]+).xml$/\1/g')"

        echo "${i}) ${name}"

        i=$((${i} + 1))
    done

    printf ">"

    if [ "${LINES}" -lt "10" ]; then

      read -n1 i
    else

      read i
    fi

    echo ""

    if ! [[ ${i} =~ ${TEST} ]] || [[ "${i}" -lt "1" ]] || [ "${i}" -gt "${LINES}" ]; then

cat <<END

given value (${i}) should be an integer > 0 but <= than ${LINES}

try again:

END

      continue;
    fi

    break;
done

CHOSENFILE="$(echo "${LIST}" | sed -n "${i} p")"

if [ -e "${TARGET}/settings.xml" ]; then

  unlink "${TARGET}/settings.xml"
fi

(cd "${TARGET}" && ln -s "${CHOSENFILE}" settings.xml)

cat <<EEE

    final result:

EEE

ls -la "${TARGET}"

cat <<EEE

  or unlink it:

    unlink "${TARGET}/settings.xml"

EEE

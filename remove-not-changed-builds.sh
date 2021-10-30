
# internal
if [ "${1}" = "process_file" ]; then

  PD="$(dirname "${2}")"
  PB="$(basename "${2}")"
  EXTENSION="${PB##*.}"
  FILENAME="${PB%.*}"
  if [ "${FILENAME}" = "" ]; then
    FILENAME="${PB}"
    EXTENSION=""
  fi
  if [ "${FILENAME}" = "${PB}" ]; then
    EXTENSION=""
  fi

  SEGMENT="${FILENAME%.entry}"

  echo "${2}"
  echo "FILENAME  : ${FILENAME}"
  echo "EXTENSION : ${EXTENSION}"
  echo "SEGMENT   : ${SEGMENT}"

  DISTFILE="dist/${SEGMENT}.bundle.js";

  echo "DISTFILE  : ${DISTFILE}"

  if [ -f "${DISTFILE}" ]; then

    git diff --exit-code "${2}" 1>> /dev/null 2>> /dev/null

    if [ "${?}" = "0" ]; then

      echo "not changed - reverting";

      git checkout "${DISTFILE}"

    else

      echo "changed";
    fi
  else
    echo "not exist"
  fi

  echo ""
  exit;
fi


# start
find pages -type f | awk '{
    if ($0 ~ /\.entry\.jsx?$/ ) {
        print $0
    }
}' | xargs -I % -- /bin/bash "${0}" process_file "%"
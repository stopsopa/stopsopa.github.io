# WARNING: There is one caveat with this script, it is checking if *.entry.{js|jsx} is changed, then it resets *.bundle.js
#           but there might be situation that *.entry.{js|jsx} have not changed but it's dependency (import xxx.js) library have changed
#           then in that case if you changed xxx.js and you wan't to prevent discarding *.bundle.js by this script after webpack build
#           you will need to change "SOMETHING" in main *.entry.{js|jsx} with the change in xxx.js


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
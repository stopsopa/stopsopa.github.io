
# looks for
#   /// injector: dirctory_filename.js
# and will replace this entire line with content of that file
#
# it will look for all files *.inject.js
# and output processed files as *.injected.js - which are gitignored
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

ROOT="${_DIR}/.."

cd "${ROOT}"

ROOT="$(pwd)"

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
    -type d -name noprettier -prune $S
\) $S
-o $S
\( -type f \( -name "*.inject.js" \) -print \)
EOF
)"

printf "\n$FIND\n\n"

FIND="${FIND//\\$'\n'/}"

# or capture result
LIST="$(eval "${FIND}")" 

cat <<EEE

${0}: found for processing:

EEE

while read -r FILE
do
echo "${0}: found: ${FILE}"
done <<< "${LIST}"

MATCHING=()

MATCH="\/\/\/\s+injector:"

while read -r FILE
do
    if grep -Eq "${MATCH}" "$FILE"; then

        # add to the end of array
        MATCHING+=("${FILE}") 
    fi
done <<< "${LIST}"

# to new line separated list
MATCHING=$(printf "%s\n" "${MATCHING[@]}")

cat <<EEE

${0}: list of files where match >${MATCH}< was found FOUND:

EEE

STATUS="0"

while read -r FILE
do
  if [ "${FILE}" != "" ]; then
      echo "${0}: processing ${FILE}"   
      node .github/injector.js "${FILE}"

      TMPSTATUS="${?}"

      if [ "${TMPSTATUS}" != "0" ]; then
        STATUS="${TMPSTATUS}"
      fi
  fi       
done <<< "${MATCHING}"

if [ "${1}" != "watch" ]; then

    cat <<EEE

    ${0}: not launching watch mode, 'watch' argument not provided

EEE

    exit ${STATUS}
fi

node node_modules/.bin/chokidar '**/*.inject.js' \
  --ignore '**/node_modules/**/*' \
  -c 'node .github/injector.js {path}'
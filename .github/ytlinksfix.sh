# Looks for all possible youtube links and removes 'si' get parameter

set -e

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
grep '(?:https?:\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)(?:\/)[0-9a-zA-Z?=&_-]+' * -roE $S
  --exclude-dir={.git,.github,dist,docker,coverage,var,noprettier,node_modules} $S
  --include='*.html' $S
  --include='*.js' $S
  --include='*.ts' $S
  --include='*.jsx' $S
  --include='*.tsx' $S
  --include='*.css' $S
  --include='*.scss' $S
  --include='*.md' $S
  --include='*.txt' $S
  --include='*.sh' $S
  --include='*.env'
EOF
)"

# replace in FIND variable -roE TO -rLE
FIND_LIST="${FIND//-roE/-rlE}"

cat <<EEE
${0}: to test searching grep and see what it has found command run:

${FIND}

or to just list

${FIND_LIST}

EEE

FIND_LIST="${FIND_LIST//\\$'\n'/}"

eval "${FIND_LIST} | node .github/ytlinksfix.js"

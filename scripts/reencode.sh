#
# encrypt again all found secrets with new key
# it relays on AES256_KEY env var from .env as the target key
# previous key have to be specified using first argument
#
# /bin/bash scripts/reencode.sh "PREVIOUS_KEY"
# 
# For testing purposes just use the same key as AES256_KEY and PREVIOUS_KEY
# 

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

eval "$(/bin/bash bash/exportsource.sh ".env")"

if [ "${AES256_KEY}" = "" ]; then
  echo "reencode.sh error: AES256_KEY is not set"

  exit 1
fi

# WARNING: 
# IF YOU WOULD LIKE TO ADD ANOTHER DIRECTORY TO NOT ENTER BE CAREFUL WITH -o
# IT SHOULD AFTER ALL EXCEPT LAST ONE LINE IN FIRST \( ... \)
# WARNING: 
S="\\"

FIND="$(cat <<EOF
/bin/bash bash/grepP.sh -Pzor ":\[v1:[A-Za-z0-9]{5}::[A-Za-z0-9+\/=]+::(?:[\n\r\s\t]+[A-Za-z0-9+\/=]+)+:\]:" * $S
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
# and add final fillterring out
# "It seems that --exclude-dir is only compared against the basename of the path"
#    from: https://unix.stackexchange.com/a/226514
# that's why we will use additional grep at the end instead of --exclude-dir
# for filtering nested directoriess
FIND_LIST="${FIND//-Pzo/-Pzl} | grep -v \"^pages/encryptor/\""

cat <<EEE
${0}: to test searching grep and see what it has found command run:

${FIND}

or to just list

${FIND_LIST}

EEE

FIND_LIST="${FIND_LIST//\\$'\n'/}"

eval "${FIND_LIST} | node scripts/reencode.js" "${1}"

cat <<EEE

current key: 

AES256_KEY="${AES256_KEY}"

EEE
  

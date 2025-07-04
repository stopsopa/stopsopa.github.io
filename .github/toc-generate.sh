
# Usage:
#   /bin/bash .github/toc-generate.sh README.md
#
# Script is designed to copy the file, remove some unwanted characters from the headers,
# and then generate a Table of Contents (TOC) for the copied file. (in place using markdown-toc node module)
#
# Then script will run the `toc-generate.mjs` script to transfer the TOC content to the original file.
# The TOC will be generated in the original file, replacing the existing TOC if already exists.
#
# as a last thep script will remove the copied file.
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
cd "${ROOT}"

if [ ! -f "${1}" ]; then
  echo "${0} error: File '${1}' does not exist."
fi

CP="${1}.md";

rm -rf "${CP}"

cp "${1}" "${CP}"

# remove <> characters from headers lines
perl -pi -e 's#^(\#+.*?)<([^>]+)>#\1 \2#g' "${CP}"

# multiple white spaces to single space
perl -pi -e 's#^(\#+.*?)\s{2,}#\1 #g' "${CP}"

node node_modules/.bin/markdown-toc -i "${CP}"

node "${ROOT}/.github/toc-generate.mjs" "${CP}" "${1}"

rm -rf "${CP}"

cat <<EEE

tog-generate.sh: TOC content updated in "${1}".

EEE



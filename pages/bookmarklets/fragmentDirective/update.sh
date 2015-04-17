
_SHELL="${_SHELL##*/}"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

cd "$_DIR"

set -e

TEMPORARY="tmp"
CLONETARGET="src"

rm -rf "$TEMPORARY" 
rm -rf "$CLONETARGET" 

mkdir -p "$TEMPORARY"
 
(
    cd "$TEMPORARY"
    git clone git@github.com:GoogleChromeLabs/text-fragments-polyfill.git .
)

ls -la "$TEMPORARY"

mv "$TEMPORARY/src" "$CLONETARGET"
mv "$TEMPORARY/demo/index.html" "$CLONETARGET/index.html"

rm -rf "$TEMPORARY" 
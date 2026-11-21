
# Tells a script where it lives - no matter if it is executed or sourced, from bash, zsh or sh.
# Replacement for the block which used to be copy-pasted into every script.
#
# USAGE (bash & zsh) - one line at the top of the script, adjust the relative path to this file:
#
#   source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/bash/self.sh"
#
# USAGE (strict posix sh/dash - there only executed scripts can be supported, see LIMITATIONS):
#
#   . "$(dirname "${0}")/bash/self.sh"
#
# After that line these variables describe THE SCRIPT WHICH SOURCED THIS FILE (not this file):
#
#   _DIR     absolute, physical directory of the script             /abs/path/to
#   _0       file name of the script                                script.sh
#   _SCRIPT  path to the script the way it was called               ./to/script.sh
#   _SHELL   bash | zsh | sh
#   _BINARY  /bin/bash | /bin/zsh | /bin/sh
#   _PWD     working directory at the moment of sourcing this file
#
# SCRIPTS SOURCING EACH OTHER
#
#   The variables are plain globals. When a.sh sources b.sh and b.sh also sources this file,
#   then after returning to a.sh the variables still describe b.sh.
#   Call the function
#
#     _self
#
#   to point them back to the file in which the call is written (it leaves _PWD untouched).
#   So the rules are:
#     - call _self after sourcing any other script which might use this library
#     - call _self in the first line of every function which uses _DIR & co.
#       (it will always resolve to the file where the function is DEFINED, even if it is called from other script)
#
#   Scripts EXECUTING each other (/bin/bash other.sh, ./other.sh) run in separate processes,
#   nothing is exported from here, so they can't affect each other. Each just sources this file on its own.
#
# LIMITATIONS
#   - source this file / call _self before any "cd" if the script was called using relative path
#   - _DIR is the directory of the path which was used to call the script. If that path is a symlink
#     to the script then it is the directory of the symlink, not of the target file
#   - strict posix shells (dash) have no way to tell which file is being sourced, only ${0} is available.
#     So there it works for executed scripts only. (/bin/sh on mac is bash, so there sourcing works too)
#   - with no script at all (sourced straight from the terminal, script piped to stdin)
#     _SCRIPT and _0 are empty and _DIR is the current directory
#
# tests: /bin/bash bash/tests/self/test.sh

# not using "ps -p $$ -o comm=" to detect the shell, because:
#   - it reports "-zsh"/"-bash" for login shells (every terminal tab on mac)
#   - it reports "sh" when bash runs as /bin/sh, where BASH_SOURCE still works and ${0} is wrong when sourced
#   - it spawns a process
__self_set() {
  _SCRIPT="${1}"

  if [ -n "${ZSH_VERSION:-}" ]; then
    _SHELL="zsh"
    # called from terminal: funcfiletrace points to "zsh:1" which is not a file
    [ -f "${_SCRIPT}" ] || _SCRIPT=""
  elif [ -n "${BASH_VERSION:-}" ] && [ "${BASH##*/}" != "sh" ]; then
    _SHELL="bash"
  else
    _SHELL="sh"
  fi

  _BINARY="/bin/${_SHELL}"

  if [ -n "${_SCRIPT}" ]; then
    _DIR="$(cd "$(dirname "${_SCRIPT}")" && pwd -P)"
    _0="$(basename "${_SCRIPT}")"
  else
    _DIR="$(pwd -P)"
    _0=""
  fi
}

# index [1] in both cases means: the file from which the code of this file was called
if [ -n "${ZSH_VERSION:-}" ]; then
  _self() { __self_set "${funcfiletrace[1]%:*}"; }
  __self_set "${funcfiletrace[1]%:*}"
elif [ -n "${BASH_VERSION:-}" ]; then
  _self() { __self_set "${BASH_SOURCE[1]}"; }
  __self_set "${BASH_SOURCE[1]}"
else
  _self() { __self_set "${0}"; }
  __self_set "${0}"
fi

_PWD="$(pwd)"

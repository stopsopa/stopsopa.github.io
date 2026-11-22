
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
# CHOOSING AND RENAMING VARIABLES (bash & zsh)
#
#   --map followed by a list of pairs: <variable> <new name>
#
#     source ".../self.sh" --map _DIR __DIR                       # creates only __DIR
#     source ".../self.sh" --map _DIR __DIR _BINARY B__BINARY     # creates only __DIR and B__BINARY
#     source ".../self.sh" --map _DIR _DIR                        # creates only _DIR
#
#   - only listed variables are created, nothing else is touched
#   - <variable> has to be one of: _DIR _0 _SCRIPT _SHELL _BINARY _PWD
#   - <new name> has to be a valid name of shell variable
#   - at least one pair is required and number of arguments after --map has to be even
#   on any error message is printed to stderr, nothing is created and "source" returns 1
#
#   WHY --map: script sourced without arguments sees arguments of the script which is sourcing it
#   (that's how "source" works in every shell) and there is no way to tell these two cases apart.
#   That's why arguments are taken into account ONLY if the first one is --map.
#   Everything else is ignored and all variables are created. So:
#     - don't forget --map: source ".../self.sh" _DIR __DIR  will create all default variables and no __DIR
#     - the only case left: script.sh which is sourcing this file without arguments and which itself
#       was called like "script.sh --map ..." will pass its own arguments here
#   In strict posix shells (dash) arguments of "." are ignored by the shell itself - all variables are created.
#
# SCRIPTS SOURCING EACH OTHER
#
#   The variables are plain globals. When a.sh sources b.sh and b.sh also sources this file,
#   then after returning to a.sh the variables still describe b.sh.
#   There are two ways to deal with it:
#
#   1) give the variables different names in each script (see above):
#
#        a.sh:  source ".../self.sh" --map _DIR A_DIR
#        b.sh:  source ".../self.sh" --map _DIR B_DIR
#
#   2) call the function
#
#        _self
#
#      to point the variables back to the file in which the call is written (it leaves _PWD untouched).
#      So the rules are:
#        - call _self after sourcing any other script which might use this library
#        - call _self in the first line of every function which uses _DIR & co.
#          (it will always resolve to the file where the function is DEFINED, even if it is called from other script)
#
#      _self accepts the same arguments:   _self --map _DIR __DIR
#      (these are arguments of a function, so there is no doubt whose they are:
#      anything else than --map as the first argument is an error. It works in dash too)
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
# OLD VERSION (just for the record)
#
#   this is the block which used to be copy-pasted to the top of every script, before this file was created:
#
#     # detect current shell
#     _SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
#     _SHELL="$(basename ${_SHELL//-/})"
#     case ${_SHELL} in
#       zsh)
#         _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
#         _0="$( basename "${(%):-%N}" )"
#         _SCRIPT="${(%):-%N}"
#         _BINARY="/bin/zsh"
#         ;;
#       sh)
#         # be carefull this will not work when sourcing this file in sh shell
#         # will though work when called /bin/sh my_script.sh from any shell
#         _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
#         _0="$( basename "${0}" )"
#         _SCRIPT="${0}"
#         _BINARY="/bin/sh"
#         ;;
#       *)
#         _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
#         _0="$( basename "${BASH_SOURCE[0]}" )"
#         _SCRIPT="${BASH_SOURCE[0]}"
#         _BINARY="/bin/bash"
#         ;;
#     esac
#     _PWD="$(pwd)"
#     ROOT="$(cd "${_DIR}/../.." && pwd)"
#     cd "${ROOT}"
#
# tests: /bin/bash bash/tests/self/test.sh

# ${1}    - path to the script which is going to be described
# ${2}    - --map
# ${3}... - list of pairs: <variable> <new name>
__self_run() {
  __self__SCRIPT="${1}"

  if [ "${2:-}" != "--map" ]; then
    echo "self.sh error: first argument has to be --map, but it is >${2:-}<" >&2
    return 1
  fi

  shift 2

  if [ "$#" = "0" ]; then
    echo "self.sh error: --map requires at least one pair '<variable> <new name>'" >&2
    return 1
  fi

  if [ "$(($# % 2))" != "0" ]; then
    echo "self.sh error: arguments have to be given in pairs '<variable> <new name>', but $# arguments given: $*" >&2
    return 1
  fi

  # validate everything first, to not create anything if there is an error
  __self_i="0"
  for __self_a in "$@"; do
    if [ "${__self_i}" = "0" ]; then
      case "${__self_a}" in
        _DIR | _0 | _SCRIPT | _SHELL | _BINARY | _PWD) ;;
        *)
          echo "self.sh error: unknown variable >${__self_a}<, allowed: _DIR _0 _SCRIPT _SHELL _BINARY _PWD" >&2
          return 1
          ;;
      esac
      __self_i="1"
    else
      case "${__self_a}" in
        "" | [!a-zA-Z_]* | *[!a-zA-Z0-9_]*)
          echo "self.sh error: >${__self_a}< is not a valid name of variable" >&2
          return 1
          ;;
      esac
      __self_i="0"
    fi
  done

  # not using "ps -p $$ -o comm=" to detect the shell, because:
  #   - it reports "-zsh"/"-bash" for login shells (every terminal tab on mac)
  #   - it reports "sh" when bash runs as /bin/sh, where BASH_SOURCE still works and ${0} is wrong when sourced
  #   - it spawns a process
  if [ -n "${ZSH_VERSION:-}" ]; then
    __self__SHELL="zsh"
    # called from terminal: funcfiletrace points to "zsh:1" which is not a file
    [ -f "${__self__SCRIPT}" ] || __self__SCRIPT=""
  elif [ -n "${BASH_VERSION:-}" ] && [ "${BASH##*/}" != "sh" ]; then
    __self__SHELL="bash"
  else
    __self__SHELL="sh"
  fi

  __self__BINARY="/bin/${__self__SHELL}"

  if [ -n "${__self__SCRIPT}" ]; then
    __self__DIR="$(cd "$(dirname "${__self__SCRIPT}")" && pwd -P)"
    __self__0="$(basename "${__self__SCRIPT}")"
  else
    __self__DIR="$(pwd -P)"
    __self__0=""
  fi

  __self__PWD="$(pwd)"

  while [ "$#" -gt "0" ]; do
    # example: __DIR="${__self__DIR}"
    eval "${2}=\"\${__self_${1}}\""
    shift 2
  done
}

# wrapper which just cleans up internal variables
__self_set() {
  __self_run "$@"
  __self_code="$?"
  unset __self_i __self_a __self__SCRIPT __self__SHELL __self__BINARY __self__DIR __self__0 __self__PWD
  return "${__self_code}"
}

# without arguments: all variables except _PWD
# with arguments:    --map and list of pairs <variable> <new name>
# index [1] in both shells means: the file in which the call of this function is written
if [ -n "${ZSH_VERSION:-}" ]; then
  _self() {
    if [ "$#" = "0" ]; then set -- --map _DIR _DIR _0 _0 _SCRIPT _SCRIPT _SHELL _SHELL _BINARY _BINARY; fi
    __self_set "${funcfiletrace[1]%:*}" "$@"
  }
elif [ -n "${BASH_VERSION:-}" ]; then
  _self() {
    if [ "$#" = "0" ]; then set -- --map _DIR _DIR _0 _0 _SCRIPT _SCRIPT _SHELL _SHELL _BINARY _BINARY; fi
    __self_set "${BASH_SOURCE[1]}" "$@"
  }
else
  _self() {
    if [ "$#" = "0" ]; then set -- --map _DIR _DIR _0 _0 _SCRIPT _SCRIPT _SHELL _SHELL _BINARY _BINARY; fi
    __self_set "${0}" "$@"
  }
fi

# index [1] in both shells means: the file from which this file was sourced
if [ -n "${ZSH_VERSION:-}" ]; then
  __self_caller="${funcfiletrace[1]%:*}"
elif [ -n "${BASH_VERSION:-}" ]; then
  __self_caller="${BASH_SOURCE[1]}"
else
  __self_caller="${0}"
fi

# see "WHY --map" in the header: without --map arguments are not ours
if [ "${1:-}" = "--map" ]; then
  __self_set "${__self_caller}" "$@"
else
  __self_set "${__self_caller}" --map _DIR _DIR _0 _0 _SCRIPT _SCRIPT _SHELL _SHELL _BINARY _BINARY _PWD _PWD
fi
__self_code="$?"
unset __self_caller
# return code of the last command is the return code of "source"
[ "${__self_code}" = "0" ]

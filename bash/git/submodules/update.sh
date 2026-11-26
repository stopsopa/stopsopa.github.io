
#
# Moves every submodule of the repository it is called in to the newest commit of its tracked
# branch (the branch is in .gitmodules), then lists the commits which came in.
# Run it whenever you want newer code of the submodules.
#
#   /bin/bash bash/git/submodules/update.sh
#
# Can be called from any directory of the parent repository.
#
# It only moves the submodules. The new pins have to be committed in the parent afterwards,
# without that commit nobody else sees the bump (the instruction is printed at the end).
#
# It fails when a submodule has local changes in files which the update would overwrite:
# commit them inside of the submodule or discard them with reset.sh.
#

set -e

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    ;;
  sh)
    # be carefull this will not work when sourcing this file in sh shell
    # will though work when called /bin/sh my_script.sh from any shell
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

git submodule update --init --remote || {
  cat <<EEE

If it is "Your local changes to the following files would be overwritten by checkout":
files inside of that submodule were edited and not committed there. Either commit them
inside of the submodule, or discard them (it lists what will be lost and asks first):

    /bin/bash "${_DIR}/reset.sh"

EEE
  echo "${0} error: git submodule update --init --remote failed"
  exit 1
}

echo ""
git submodule status
echo ""
git --no-pager diff --submodule=log

cat <<EEE

If commits are listed above, the pins moved. Record that in this repository:

    git add <paths of the submodules>
    git commit -m "bump submodules"
    git push

EEE


#
# Downloads all submodules of the repository it is called in, at the commits pinned by that repository.
# Run it once per clone (git clone --recurse-submodules does the same in one go).
#
#   /bin/bash bash/git/submodules/install.sh
#
# Can be called from any directory of the parent repository.
#
# It also sets "git config submodule.recurse true" in the parent: from then on a plain
# git pull / checkout / switch in the parent moves the submodules to the pinned commits too.
#
# Also the way back to the pins when a submodule is on a different commit (but without local
# changes in files, for those see reset.sh).
#

set -e

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

git config submodule.recurse true

git submodule update --init --recursive

echo ""
git submodule status

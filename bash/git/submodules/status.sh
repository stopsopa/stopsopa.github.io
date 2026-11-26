
#
# Shows where every submodule of the repository it is called in is: the pinned commit, and per
# submodule its branch, current commit, newest commit of the tracked branch (the branch is in
# .gitmodules), how far behind it is and how many files have uncommitted changes.
# Changes nothing, but it fetches the tracked branch of every submodule.
#
#   /bin/bash bash/git/submodules/status.sh
#
# Can be called from any directory of the parent repository.
#
# Prefix of a line of "git submodule status" (first part of the output):
#   " " on the pinned commit    "+" on a different commit than pinned    "-" not downloaded yet
#

set -e

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

git submodule status
echo ""

# the part in single quotes is executed by git with sh, inside of every submodule.
# name and toplevel are provided by git
# shellcheck disable=SC2016
git submodule foreach --quiet '
branch="$(git config -f "${toplevel}/.gitmodules" --get "submodule.${name}.branch" || true)"
echo "${name}"
echo "  branch      : $(git symbolic-ref --short -q HEAD || echo "detached HEAD")"
echo "  here        : $(git log -1 --format="%h %cs %s" HEAD)"
if [ -z "${branch}" ]; then
  echo "  newest      : unknown, no branch for this submodule in .gitmodules"
else
  git fetch --quiet origin "${branch}"
  echo "  newest      : $(git log -1 --format="%h %cs %s" "origin/${branch}")  (origin/${branch})"
  echo "  behind by   : $(git rev-list --count "HEAD..origin/${branch}") commit(s)"
fi
echo "  uncommitted : $(git status --porcelain | wc -l | tr -d " ") file(s)"
echo ""
'

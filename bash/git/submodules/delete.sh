
#
# Removes one submodule completely from the repository it is called in. Then commit the result.
# There is no single git command for it, three places have to be cleaned:
#   1. .git/config entry + content of the directory    git submodule deinit -f <path>
#   2. the directory, the pin and entry in .gitmodules  git rm -f <path>
#   3. the local clone kept in .git/modules/<name>      rm -rf
#
#   /bin/bash bash/git/submodules/delete.sh submodules/encrypt
#   /bin/bash bash/git/submodules/delete.sh                       lists registered submodules
#
# Can be called from any directory of the parent repository, the path is relative to its root.
#
# The local clone of the submodule is deleted too, so it refuses when the submodule has
# uncommitted changes or commits which were never pushed.
#
# Moving a submodule to another directory is not delete + add: git mv old/path new/path and commit.
#

set -e

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

P="${1%/}"

ALL=""
if [[ -f .gitmodules ]]; then
  ALL="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$')"
fi

if [[ -z "${P}" ]]; then
  cat <<EEE

usage: /bin/bash ${0} <path of the submodule>

registered submodules:
$(echo "${ALL}" | awk '{print "    " $2}')

EEE
  echo "${0} error: path of the submodule not given"
  exit 1
fi

NAME="$(echo "${ALL}" | awk -v p="${P}" '$2 == p { sub(/^submodule\./, "", $1); sub(/\.path$/, "", $1); print $1 }')"

if [[ -z "${NAME}" ]]; then
  echo "${0} error: >${P}< is not a path of a submodule registered in .gitmodules"
  exit 1
fi

# the local clone of the submodule is deleted too, so refuse to lose work which exists only here
if [[ -e "${P}/.git" ]]; then
  if [[ -n "$(git -C "${P}" status --porcelain)" ]]; then
    echo "${0} error: >${P}< has uncommitted changes, commit or discard them first"
    exit 1
  fi
  if [[ -n "$(git -C "${P}" log --oneline HEAD --branches --not --remotes)" ]]; then
    git -C "${P}" --no-pager log --oneline HEAD --branches --not --remotes
    echo "${0} error: >${P}< has commits (listed above) which were never pushed, push them first"
    exit 1
  fi
fi

# 1. .git/config entry + content of the directory
git submodule deinit -f "${P}"

# 2. the directory, the pinned commit and the entry in .gitmodules (staged)
git rm -f "${P}"

# 3. the local clone kept in .git/modules
rm -rf "$(git rev-parse --git-dir)/modules/${NAME:?}"

echo ""
git status --short

cat <<EEE

Submodule ${P} is removed and the removal is staged. To finish, commit it:

    git commit -m "remove submodule ${P}"
    git push

EEE

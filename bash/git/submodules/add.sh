
#
# Registers git submodules in the repository it is called in (the parent repository).
# Run it once, ever, by the person who introduces the submodules. Then commit the result.
#
# Arguments go in groups of three, one group per submodule:
#   <path> <url> <branch>
#
#   /bin/bash bash/git/submodules/add.sh submodules/encrypt git@github.com:stopsopa/encrypt.git main
#
#   /bin/bash bash/git/submodules/add.sh \
#     submodules/encrypt git@github.com:stopsopa/encrypt.git main \
#     submodules/xx      git@github.com:stopsopa/xx.git      main
#
# Can be called from any directory of the parent repository, paths are relative to its root.
#
# Safe to run again: a path which already is in .gitmodules is skipped.
# The name of the submodule (the key in .gitmodules) is the last part of the path.
# <branch> is only where update.sh looks for the newest commit, the parent always pins a commit.
#
# It only stages .gitmodules and the pinned commits, the commit is up to you.
#

set -e

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

if [[ "${#}" -eq 0 || "$((${#} % 3))" -ne 0 ]]; then
  cat <<EEE

usage: /bin/bash ${0} <path> <url> <branch> [<path> <url> <branch> ...]

EEE
  echo "${0} error: arguments have to go in groups of three, number of arguments given >${#}<"
  exit 1
fi

while [[ "${#}" -gt 0 ]]; do
  P="${1%/}"
  URL="${2}"
  BRANCH="${3}"
  shift 3

  if [[ -z "${P}" || -z "${URL}" || -z "${BRANCH}" ]]; then
    echo "${0} error: empty argument in the group path=>${P}< url=>${URL}< branch=>${BRANCH}<"
    exit 1
  fi

  REGISTERED=""
  if [[ -f .gitmodules ]]; then
    REGISTERED="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk -v p="${P}" '$2 == p { print $2 }')"
  fi

  if [[ -n "${REGISTERED}" ]]; then
    echo "${P}: already registered in .gitmodules, skipping"
  else
    git submodule add -b "${BRANCH}" --name "$(basename "${P}")" "${URL}" "${P}"
  fi
done

echo ""
git submodule status

cat <<EEE

.gitmodules and the pinned commits are staged. To finish, commit them:

    git commit -m "add submodules"
    git push

EEE

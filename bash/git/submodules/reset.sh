
#
# Discards local changes in the submodules of the repository it is called in and puts them
# back on the commits pinned by that repository.
# For the state where git status in the parent says:
#     modified:   submodules/xx (modified content)
# (files inside of the submodule edited and not committed there), which also blocks update.sh.
#
#   /bin/bash bash/git/submodules/reset.sh                    all submodules
#   /bin/bash bash/git/submodules/reset.sh submodules/xx      only this one
#
# Can be called from any directory of the parent repository, the path is relative to its root.
#
# Before touching anything it lists what will be lost and waits for Enter (any other key aborts):
#   - uncommitted changes in tracked files
#   - a submodule being on a different commit than the pinned one (it goes back to the pinned;
#     it warns when no branch or tag leads to the commit it is on now)
# Untracked files are left alone.
#
# It needs a terminal to confirm on. Without one it stops and changes nothing.
#

set -e

RED=$'\033[31m'
YELLOW=$'\033[33m'
BOLD=$'\033[1m'
REVERSE=$'\033[7m'
RESET=$'\033[0m'

TOP="$(git rev-parse --show-toplevel 2> /dev/null || true)"

if [[ -z "${TOP}" ]]; then
  echo "${0} error: not inside of a git repository, pwd=>$(pwd)<"
  exit 1
fi

cd "${TOP}"

P="${1%/}"

ALL=""
if [[ -f .gitmodules ]]; then
  ALL="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $2}')"
fi

if [[ -z "${ALL}" ]]; then
  echo "${0} error: no submodules registered in >${TOP}/.gitmodules<"
  exit 1
fi

if [[ -n "${P}" ]]; then
  if ! echo "${ALL}" | grep -qxF "${P}"; then
    cat <<EEE

registered submodules:
$(echo "${ALL}" | sed 's/^/    /')

EEE
    echo "${0} error: >${P}< is not a path of a submodule registered in .gitmodules"
    exit 1
  fi
  ALL="${P}"
fi

# show what is going to be lost, before anything is touched
FOUND="0"
while IFS= read -r SUB; do
  # not downloaded yet: nothing to lose there
  if [[ ! -e "${SUB}/.git" ]]; then
    continue
  fi

  PIN="$(git rev-parse ":${SUB}")"
  HERE="$(git -C "${SUB}" rev-parse HEAD)"
  DIRTY="$(git -C "${SUB}" status --porcelain --untracked-files=no)"

  if [[ -z "${DIRTY}" && "${PIN}" == "${HERE}" ]]; then
    continue
  fi

  FOUND="1"

  cat <<EEE

${BOLD}${SUB}${RESET}
EEE

  if [[ -n "${DIRTY}" ]]; then
    cat <<EEE
  uncommitted changes, they will be lost:
$(echo "${DIRTY}" | sed 's/^/      /')
EEE
  fi

  if [[ "${PIN}" != "${HERE}" ]]; then
    cat <<EEE
  is on a different commit than the pinned one, it will go back to the pinned:
      here   : $(git -C "${SUB}" log -1 --format='%h %cs %s' HEAD)
      pinned : $(git -C "${SUB}" log -1 --format='%h %cs %s' "${PIN}" 2> /dev/null || echo "${PIN}")
EEE
    # commit made on detached HEAD and never pushed: after the reset no branch or tag leads to it
    if [[ -z "$(git -C "${SUB}" for-each-ref --contains HEAD refs/heads refs/remotes refs/tags)" ]]; then
      echo "  ${RED}no branch or tag contains the commit it is on now, after the reset only 'git reflog' will find it${RESET}"
    fi
  fi
done <<< "${ALL}"

if [[ "${FOUND}" == "0" ]]; then
  cat <<EEE

nothing to reset: no uncommitted changes, every submodule is on its pinned commit

EEE
  exit 0
fi

cat <<EEE
${YELLOW}
Everything listed above will be discarded. Untracked files are left alone.
${RESET}
EEE

# end of input must not be treated as Enter, so without a terminal nothing is discarded
if [[ ! -t 0 ]]; then
  echo "${0} error: no terminal to confirm on (stdin is not a terminal), nothing was changed"
  exit 1
fi

printf '%s' "${REVERSE}${YELLOW}${BOLD} WAITING ${RESET} ${YELLOW}press ${BOLD}Enter${RESET}${YELLOW} to discard, any other key to abort:${RESET} "

# one key, without waiting for Enter. Enter itself arrives as an empty value
IFS= read -r -s -n 1 KEY || {
  echo ""
  echo "${0} error: aborted, nothing was changed"
  exit 1
}

echo ""

if [[ -n "${KEY}" ]]; then
  echo "${0} error: aborted, nothing was changed"
  exit 1
fi

# --force: checkout also when the submodule already is on the pinned commit, throwing away local changes
if [[ -n "${P}" ]]; then
  git submodule update --init --recursive --force -- "${P}"
else
  git submodule update --init --recursive --force
fi

echo ""
git submodule status
echo ""
git status --short

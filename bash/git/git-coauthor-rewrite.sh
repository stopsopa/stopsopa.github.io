
#
# Appends string given on stdin at the end of commit messages of current branch (git filter-branch).
# Works on the repository in current working directory, script itself can live anywhere.
#
# WARNING: it rewrites history - all rewritten commits get new hashes.
#   Force pushing it overrides history on the remote: other clones and open PRs based on old commits
#   will diverge, everybody has to re-clone or hard reset. Make sure nobody works on that branch.
#
# Usage (more: --help):
#
#   # entire history, skip commits which message matches regex 'Claude'
#   cat <<EEE | /bin/bash bash/git/git-coauthor-rewrite.sh --nmatch 'Claude'
#   npm ci fails on CI with npm 11.7+: @emnapi/core and @emnapi/runtime
#   2.0.0-beta.2 are required by an optional peer but missing from the lock.
#   Regenerated with npm 11.9.0; package.json unchanged.
#
#   Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
#   EEE
#
#   # one hash: from that commit (inclusive) to HEAD
#   cat <<EEE | /bin/bash bash/git/git-coauthor-rewrite.sh --nmatch '^Co-[Aa]uthored-[Bb]y:' a374d0e3
#   Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
#   EEE
#
#   # two hashes: from older to newer (both inclusive), commits after f116f56c keep their messages
#   cat <<EEE | /bin/bash bash/git/git-coauthor-rewrite.sh --nmatch '^Co-[Aa]uthored-[Bb]y: (Claude|Copilot)' a374d0e3 f116f56c
#   Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
#   EEE
#
# What happens:
#   1. validation: hashes exist, first older than second, both in history of HEAD, no uncommitted changes
#   2. preview of few changed messages, then: continue / edit the string in ${EDITOR} / quit
#   3. rewrite. Skipped (message untouched): commits already containing the string
#      and commits where any line matches --nmatch (grep -E, case sensitive)
#   4. tags: every tag pointing to rewritten commit is moved to its new counterpart (the same place in history)
#      - locally automatically, for the remote only command is printed (force push of tags existing there)
#   Script never pushes anything, it only prints commands to run.
#
# New lines: string is separated from the message with one empty line, unless message already ends with
#   trailers block and the string is a trailer too - then it is added directly under, to keep one block.
#
# After it finishes (the same commands are printed at the end):
#   git log                                              # check the result
#   git diff refs/original/refs/heads/<branch> HEAD      # should print nothing, files are not changed
#   git push --force-with-lease <remote> <branch>        # DANGER: overrides history on the remote
#   git push --force <remote> refs/tags/<tag> ...        # DANGER: moves tags on the remote
#   git reset --hard refs/original/refs/heads/<branch>   # undo (local branch only, before cleanup)
#   git for-each-ref --format='%(refname)' refs/original | xargs -n 1 git update-ref -d   # cleanup of backup
#
# Other: signatures of rewritten commits and annotated tags are lost.
#   --msg-filter as first argument is internal mode used by git filter-branch.
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    # be carefull this will not work when sourcing this file in sh shell
    # will though work when called /bin/sh my_script.sh from any shell
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac
_PWD="$(pwd)"

# absolute path to this script - git filter-branch calls it back from its own temp directory
_SELF="${_DIR}/${_0}"

GRAY=$'\033[38;5;244m'
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

PREVIEW_COUNT="3"

# Reads the string to append from file given in first argument into APPEND,
# removes leading and trailing empty lines and detects if the string is git trailer (APPEND_IS_TRAILER).
function load_append {
  # command substitution removes trailing new lines
  APPEND="$(cat "${1}")"

  while [[ "${APPEND}" == $'\n'* ]]; do
    APPEND="${APPEND#$'\n'}"
  done

  APPEND_IS_TRAILER=""
  if [[ -n "$(printf 'subject\n\n%s\n' "${APPEND}" | git interpret-trailers --parse 2>/dev/null)" ]]; then
    APPEND_IS_TRAILER="true"
  fi
}

# Prints commit message given in first argument extended with APPEND.
# Takes care about new lines between the message and the string (see "New lines" in the top comment).
function transform {
  local MSG="${1}"
  local SEP=$'\n\n'

  while [[ "${MSG}" == $'\n'* ]]; do
    MSG="${MSG#$'\n'}"
  done

  if [[ "${MSG}" == *"${APPEND}"* ]]; then
    printf '%s\n' "${MSG}"
    return 0
  fi

  # --nmatch: message matching the regex is left untouched
  if [[ -n "${NMATCH}" ]] && printf '%s\n' "${MSG}" | grep -qE -- "${NMATCH}"; then
    printf '%s\n' "${MSG}"
    return 0
  fi

  if [[ -n "${APPEND_IS_TRAILER}" && -n "$(printf '%s\n' "${MSG}" | git interpret-trailers --parse 2>/dev/null)" ]]; then
    SEP=$'\n'
  fi

  printf '%s%s%s\n' "${MSG}" "${SEP}" "${APPEND}"
}

# Internal mode: called by git filter-branch for every rewritten commit.
# Only commits listed in COAUTHOR_TARGETS_FILE get the string, the rest keeps the message as is.
if [[ "${1}" == "--msg-filter" ]]; then
  NMATCH="${COAUTHOR_NMATCH}"
  if grep -qx "${GIT_COMMIT}" "${COAUTHOR_TARGETS_FILE}"; then
    load_append "${COAUTHOR_APPEND_FILE}"
    transform "$(cat)"
  else
    cat
  fi
  exit 0
fi

# ---------------------------------------------------------------------------------------------
# arguments
# ---------------------------------------------------------------------------------------------

NMATCH=""
POSITIONAL=()
while [[ "${#}" -gt 0 ]]; do
  case "${1}" in
    --help|-h)
      cat <<EEE

Appends string given on stdin at the end of the message of each commit in given range
of current branch (rewrites history) and moves tags to the rewritten commits
(locally only - nothing is pushed, commands to push branch and tags are printed at the end).
Works on the git repository in current working directory.

Usage:

  echo "string to append" | /bin/bash ${0} [--nmatch 'regex'] [<from_hash> [<to_hash>]]

Arguments:

  (no hashes)        entire history of current branch
  <from_hash>        oldest commit to change (inclusive)
  <to_hash>          newest commit to change (inclusive), default HEAD
                     <from_hash> has to be older than <to_hash>, both in history of current branch
  --nmatch 'regex'   append only to commits which message does NOT match the regex
                     extended regex (grep -E), case sensitive, tested line by line
                     (^ and $ mean beginning and end of a line)
  --help, -h         this page

Examples:

  # entire history, skip commits mentioning Claude
  echo "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>" | /bin/bash ${0} --nmatch 'Claude'

  # from given commit to HEAD
  echo "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>" | /bin/bash ${0} a374d0e3

  # from older commit to newer commit
  echo "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>" | /bin/bash ${0} a374d0e3 f116f56c

  # skip commits which have any co-author already
  echo "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>" | /bin/bash ${0} --nmatch '^Co-[Aa]uthored-[Bb]y:' a374d0e3

  # skip commits co-authored by Claude or Copilot
  echo "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>" | /bin/bash ${0} --nmatch '^Co-[Aa]uthored-[Bb]y: (Claude|Copilot)' a374d0e3

Notes:

  - before any change preview is shown with question: continue / edit string / quit
  - commits already containing the string are left untouched
  - string is separated from the message with one empty line, unless message already
    ends with trailers block and the string is a trailer too - then it joins that block
  - branch is not pushed, command to do it is printed at the end
  - previous state is kept in refs/original/

EEE
      exit 0
      ;;
    --nmatch)
      if [[ -z "${2}" ]]; then
        echo "${0} error: --nmatch requires not empty regex as next argument"
        exit 1
      fi
      NMATCH="${2}"
      shift 2
      ;;
    *)
      POSITIONAL+=("${1}")
      shift
      ;;
  esac
done
set -- "${POSITIONAL[@]}"

if [[ -n "${NMATCH}" ]]; then
  # grep exit code: 0 match, 1 no match, 2+ error (invalid regex)
  echo "" | grep -qE -- "${NMATCH}" 2>/dev/null
  if [[ "${?}" -ge 2 ]]; then
    echo "${0} error: --nmatch is not valid extended regex >${NMATCH}<"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------------------------
# validation
# ---------------------------------------------------------------------------------------------

if [[ "${#}" -gt 2 ]]; then
  cat <<EEE
${RED}
${0} error: expected zero, one or two commit hashes, given >${#}< arguments

  echo "Co-Authored-By: Name <email>" | /bin/bash ${0}
  echo "Co-Authored-By: Name <email>" | /bin/bash ${0} <from_hash>
  echo "Co-Authored-By: Name <email>" | /bin/bash ${0} <older_hash> <newer_hash>
  echo "Co-Authored-By: Name <email>" | /bin/bash ${0} --nmatch 'regex' <older_hash> [<newer_hash>]
${RESET}
EEE
  exit 1
fi

if [[ -t 0 ]]; then
  cat <<EEE
${RED}
${0} error: string to append is expected on stdin

  echo "Co-Authored-By: Name <email>" | /bin/bash ${0} ${*}
${RESET}
EEE
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "${0} error: current directory is not inside of git working tree, pwd >${_PWD}<"
  exit 1
fi

# empty FROM means: no hashes given, entire history of current branch
FROM=""
if [[ -n "${1}" ]]; then
  FROM="$(git rev-parse --verify --quiet "${1}^{commit}")"
  if [[ -z "${FROM}" ]]; then
    echo "${0} error: first argument is not existing commit >${1}<"
    exit 1
  fi
fi

if [[ -n "${2}" ]]; then
  TO="$(git rev-parse --verify --quiet "${2}^{commit}")"
  if [[ -z "${TO}" ]]; then
    echo "${0} error: second argument is not existing commit >${2}<"
    exit 1
  fi
else
  TO="$(git rev-parse --verify --quiet "HEAD^{commit}")"
fi

BRANCH="$(git symbolic-ref --quiet --short HEAD)"
if [[ -z "${BRANCH}" ]]; then
  echo "${0} error: HEAD is detached, checkout a branch first"
  exit 1
fi

if [[ -n "${FROM}" ]] && ! git merge-base --is-ancestor "${FROM}" "${TO}"; then
  if git merge-base --is-ancestor "${TO}" "${FROM}"; then
    echo "${0} error: first commit >${1}< is newer than the second >${2}<, swap them (older first)"
  else
    echo "${0} error: first commit >${1}< is not an ancestor of >${2:-HEAD}<, they are on different lines of history"
  fi
  exit 1
fi

if ! git merge-base --is-ancestor "${TO}" HEAD; then
  echo "${0} error: commit >${2}< is not in the history of current branch >${BRANCH}<"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "${0} error: there are uncommitted changes, commit or stash them first"
  exit 1
fi

# git filter-branch has to be executed from the root of the working tree
_TOP="$(git rev-parse --show-toplevel)"
cd "${_TOP}" || {
  echo "${0} error: can't cd to >${_TOP}<"
  exit 1
}

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

cat > "${TMP}/append.txt"
load_append "${TMP}/append.txt"

if [[ -z "${APPEND}" ]]; then
  echo "${0} error: string to append given on stdin is empty"
  exit 1
fi

# ---------------------------------------------------------------------------------------------
# what will be touched
# ---------------------------------------------------------------------------------------------

# everything reachable from parents of FROM stays untouched (no FROM: nothing excluded - entire history)
NEG=()
RANGE="entire history .. ${TO} (inclusive)"
if [[ -n "${FROM}" ]]; then
  RANGE="${FROM} .. ${TO} (inclusive)"
  for PARENT in $(git rev-list --parents -n 1 "${FROM}" | cut -d' ' -f2- -s); do
    NEG+=("^${PARENT}")
  done
fi

# commits which will get the string (newest first)
git rev-list "${TO}" "${NEG[@]}" > "${TMP}/targets.txt"
TARGETS_COUNT="$(wc -l < "${TMP}/targets.txt" | tr -d ' ')"

# tags pointing to commits which will be rewritten
TAG_REFS=()
while IFS= read -r LINE; do
  if [[ -n "${LINE}" ]]; then
    TAG_REFS+=("refs/tags/${LINE}")
  fi
done <<< "$(if [[ -n "${FROM}" ]]; then git tag --contains "${FROM}"; else git tag; fi)"

# ---------------------------------------------------------------------------------------------
# preview, then: continue / edit / quit
# ---------------------------------------------------------------------------------------------

while true; do
  cat <<EEE

${BOLD}String to append:${RESET}
${GRAY}--------------------------------------------------${RESET}
${YELLOW}${APPEND}${RESET}
${GRAY}--------------------------------------------------${RESET}

${BOLD}Preview (up to ${PREVIEW_COUNT} newest commits which will really change, of ${TARGETS_COUNT} in range):${RESET}
EEE

  # show only commits which message will really change (skipped ones are not interesting)
  SHOWN="0"
  while IFS= read -r LINE; do
    ORIGINAL="$(git log -1 --format=%B "${LINE}")"
    CHANGED="$(transform "${ORIGINAL}")"
    if [[ "${CHANGED}" != "${ORIGINAL}" ]]; then
      SHOWN="$((SHOWN + 1))"
      cat <<EEE

${GREEN}commit ${LINE}${RESET}
${GRAY}--------------------------------------------------${RESET}
${CHANGED}
${GRAY}--------------------------------------------------${RESET}
EEE
    fi
    if [[ "${SHOWN}" -ge "${PREVIEW_COUNT}" ]]; then
      break
    fi
  done < "${TMP}/targets.txt"

  if [[ "${SHOWN}" -eq 0 ]]; then
    echo "${YELLOW}no commit in range would change (all contain the string already or match --nmatch)${RESET}"
  fi

  cat <<EEE

branch:           ${BRANCH}
range:            ${RANGE}
commits in range: ${TARGETS_COUNT} (those already containing the string or matching --nmatch are skipped)
nmatch:           >${NMATCH}<
tags to move:     ${#TAG_REFS[@]} ${GRAY}${TAG_REFS[*]#refs/tags/}${RESET}

EEE

  read -r -p "[c]ontinue / [e]dit string to append / [q]uit: " ANSWER < /dev/tty

  case "${ANSWER}" in
    c|C)
      break
      ;;
    e|E)
      printf '%s\n' "${APPEND}" > "${TMP}/append.txt"
      "${EDITOR:-vi}" "${TMP}/append.txt" < /dev/tty > /dev/tty
      load_append "${TMP}/append.txt"
      if [[ -z "${APPEND}" ]]; then
        echo "${0} error: string to append is empty after edit"
        exit 1
      fi
      ;;
    q|Q)
      echo "stopped, nothing changed"
      exit 0
      ;;
    *)
      echo "unknown answer >${ANSWER}<"
      ;;
  esac
done

printf '%s\n' "${APPEND}" > "${TMP}/append.txt"

# ---------------------------------------------------------------------------------------------
# rewrite
# ---------------------------------------------------------------------------------------------

git for-each-ref --format='%(refname) %(objectname)' refs/tags > "${TMP}/tags_before.txt"

export FILTER_BRANCH_SQUELCH_WARNING="1"
export COAUTHOR_APPEND_FILE="${TMP}/append.txt"
export COAUTHOR_TARGETS_FILE="${TMP}/targets.txt"
export COAUTHOR_NMATCH="${NMATCH}"

if ! git filter-branch -f \
  --msg-filter "/bin/bash '${_SELF}' --msg-filter" \
  --tag-name-filter cat \
  -- "${NEG[@]}" HEAD "${TAG_REFS[@]}"; then
  echo "${0} error: git filter-branch failed"
  exit 1
fi

git for-each-ref --format='%(refname) %(objectname)' refs/tags > "${TMP}/tags_after.txt"

# tags which point to different object than before
MOVED=()
while IFS= read -r LINE; do
  if [[ -n "${LINE}" ]] && ! grep -qxF "${LINE}" "${TMP}/tags_before.txt"; then
    MOVED+=("${LINE%% *}")
  fi
done <<< "$(cat "${TMP}/tags_after.txt")"

REMOTE="$(git config "branch.${BRANCH}.remote")"
REMOTE="${REMOTE:-origin}"

# Command moving tags on the remote - only printed, never executed by this script.
# Limited to moved tags which exist on the remote (read only git ls-remote),
# if the remote can't be listed then all moved tags are proposed.
TO_PUSH=("${MOVED[@]}")
if git ls-remote --tags "${REMOTE}" > "${TMP}/tags_remote.txt" 2>/dev/null; then
  TO_PUSH=()
  for TAG_REF in "${MOVED[@]}"; do
    if grep -qE "[[:space:]]${TAG_REF}\$" "${TMP}/tags_remote.txt"; then
      TO_PUSH+=("${TAG_REF}")
    fi
  done
fi

TAGS_COMMAND="# no moved tags exist on the remote, nothing to push"
if [[ "${#TO_PUSH[@]}" -gt 0 ]]; then
  TAGS_COMMAND="git push --force ${REMOTE} ${TO_PUSH[*]}"
fi

cat <<EEE

${GREEN}history rewritten${RESET}

tags moved locally: ${#MOVED[@]} ${GRAY}${MOVED[*]#refs/tags/}${RESET}

What next:

  # check the result
  git log

  # should print nothing, files are not changed
  git diff refs/original/refs/heads/${BRANCH} HEAD

  # undo (local branch only, works until cleanup below)
  git reset --hard refs/original/refs/heads/${BRANCH}
${RED}${BOLD}
  WARNING: two commands below override history (branch >${BRANCH}< and tags) on remote >${REMOTE}<.
  All rewritten commits have new hashes. Other clones and open PRs based on old commits
  will diverge - everybody has to re-clone or hard reset. It can't be undone on the remote
  once old commits are garbage collected there. Make sure nobody else works on that branch.
${RESET}
  # push the branch
  git push --force-with-lease ${REMOTE} ${BRANCH}

  # move tags on the remote to the same places in the new history
  ${TAGS_COMMAND}

  # cleanup of backup refs, when sure all is fine
  git for-each-ref --format='%(refname)' refs/original | xargs -n 1 git update-ref -d

EEE

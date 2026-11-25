#
# Report + validator of AI agents setup (skills and instruction files).
# Designed to be executed from any directory - "local" means current working directory.
#
# Steps:
#   1. print one table of all skills: global (~/.agents/skills) and local (.agents/skills and .claude/skills in cwd)
#      one row per skill name, if skill exist in both places then both columns in that row are filled
#      (skill = directory with SKILL.md in it)
#   2. validate presence of instruction files, each missing one is reported in red:
#        ~/.agents/AGENTS.md
#        ~/.claude/CLAUDE.md
#        ./AGENTS.md
#        ./CLAUDE.md
#
#   3. print help (list of all commands)
#
# Usage:
#   cd /any/project/directory
#   /bin/bash /path/to/pages/ai/ai_report.sh
#
#   alias ai='/bin/bash "/path/to/pages/ai/ai_report.sh"'
#   ai            # report (steps above)
#   ai help       # only help
#   ai linkrepo   # pick directories from WORKSPACE_DIR and link them in ./__linked
#
# ai linkrepo:
#   1. requires env var WORKSPACE_DIR (e.g. WORKSPACE_DIR=/Users/szdz/Workspace), exit 1 if missing
#   2. list of directories to choose from is produced by script executed with cwd = WORKSPACE_DIR:
#        env var WORKSPACE_DIR_LIST (path to custom script) if defined
#        otherwise ai_report_find.sh next to this script (all direct subdirectories)
#      the script have to print absolute paths, one per line
#   3. paths are shortened (bash/file/progressivePaths.ts) and shown in multi select picker
#      (bash/file/fuzzyMultiple.ts), esc in the picker = exit 1 and nothing is linked
#   4. for each selected: ln -s [absolute path] ./__linked/[shortened path]
#      shortened path abc/cde -> directory ./__linked/abc is created and link cde in it
#      already existing links/files are skipped
#   5. print the selection as json array (ready to paste: cat <<'EEE' > __linked.json ...)
#      and (interactive mode only) ask if to save it to ./__linked.json
#
# ai linkrepo restore                         # no picker, selection from ./__linked.json
# ai linkrepo restore path/to/__linked.json   # no picker, selection from given file
# ai linkrepo < path/to/__linked.json         # no picker, selection from stdin
#   the rest (steps 1, 2, 4, 5 without the question) is the same.
#   __linked.json is snapshot of what was linked: json array of shortened paths
#   so the same set of links can be recreated later / elsewhere.
#   WARNING: shortened paths depend on the whole list of directories - when new directory
#   with the same name shows up in WORKSPACE_DIR then old name (e.g. "api") becomes "a/api"
#   and restore reports it as not found.
#
# Exit code:
#   0 - all four instruction files exist
#   1 - at least one instruction file is missing (table is printed anyway)
#   linkrepo: 0 - done, 1 - missing WORKSPACE_DIR, empty list, nothing selected or some link not created
#
# Requires: node
#
export NODE_OPTIONS=

GRAY="$(printf '\033[38;5;244m')"
BLACK="$(printf '\033[30m')"
RED="$(printf '\033[31m')"
GREEN="$(printf '\033[32m')"
YELLOW="$(printf '\033[33m')"
BLUE="$(printf '\033[34m')"
MAGENTA="$(printf '\033[35m')"
CYAN="$(printf '\033[36m')"
WHITE="$(printf '\033[37m')"
BOLD="$(printf '\033[1m')"
REVERSE="$(printf '\033[7m')"
RESET="$(printf '\033[0m')"

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

_ROOT="$(cd "${_DIR}/../.." && pwd)"

if ! command -v node >/dev/null 2>&1; then

  echo "${0} error: node is not installed"

  exit 1
fi

# help page: list of all commands of this tool
function help {

  cat <<EEE

${BOLD}ai${RESET} - report + tools for AI agents setup

  ${GREEN}ai${RESET}            report: table of skills (global and local), validation of instruction files
                (AGENTS.md, CLAUDE.md in home and in current directory), then this help
  ${GREEN}ai help${RESET}       this help only
  ${GREEN}ai linkrepo${RESET}   pick one or more directories from WORKSPACE_DIR
                and link them in ./__linked (in current directory)

                env vars:
                  WORKSPACE_DIR      (required) directory with repositories
                                     e.g. export WORKSPACE_DIR="/Users/szdz/Workspace"
                  WORKSPACE_DIR_LIST (optional) script executed in WORKSPACE_DIR, prints absolute
                                     paths of directories to choose from, one per line
                                     default: ${_DIR}/ai_report_find.sh

                picker: type to filter, Tab toggle, Ctrl+A all, Ctrl+X none, Ctrl+T invert,
                        Enter confirm, Esc cancel

                at the end the selection is printed as json array (content of __linked.json)
                and you are asked if to save it to ./__linked.json (snapshot of what was linked)

  ${GREEN}ai linkrepo restore${RESET}
                no picker: link again everything listed in ./__linked.json
  ${GREEN}ai linkrepo restore path/to/__linked.json${RESET}
                the same but from given file (links are still created in ./__linked)
  ${GREEN}ai linkrepo < path/to/__linked.json${RESET}
  ${GREEN}cat path/to/__linked.json | ai linkrepo${RESET}
                the same but content of the file is given on stdin

                __linked.json is json array of shortened paths (as shown in the picker), e.g.
                  ["SPECIAL_web/SPECIAL_web", "tabs"]
                names not found on the current list of directories are reported and exit code is 1

EEE
}

#
# Reads content of __linked.json from stdin (json array of strings)
# and prints its elements one per line. Exit 1 with message when the content is not valid.
#
#   linked_json_to_lines < __linked.json
#
function linked_json_to_lines {

  node -e '
const fs = require("fs");

let data;

try {
  data = JSON.parse(fs.readFileSync(0, "utf8"));
} catch (e) {
  console.error("ai_report.sh error: __linked.json: invalid json: " + e.message);

  process.exit(1);
}

if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
  process.stdout.write(data.join("\n"));
} else {
  console.error("ai_report.sh error: __linked.json: expected json array of strings");

  process.exit(1);
}
'
}

#
# ai linkrepo
# ai linkrepo restore [path/to/__linked.json]
# ai linkrepo < __linked.json
# Lists directories from WORKSPACE_DIR, lets user pick one or more of them
# and creates symlinks to them in __linked directory in current working directory.
# Details in the comment at the top of this file.
#
function linkrepo {

  if [[ -z "${WORKSPACE_DIR}" ]]; then

    cat <<EEE
${RED}
${0} error: env var WORKSPACE_DIR is not defined, WORKSPACE_DIR=>${WORKSPACE_DIR}<

It should point to the directory with repositories, for example:

  export WORKSPACE_DIR="/Users/szdz/Workspace"
${RESET}
EEE

    return 1
  fi

  if [[ ! -d "${WORKSPACE_DIR}" ]]; then

    echo "${0} error: WORKSPACE_DIR is not a directory, WORKSPACE_DIR=>${WORKSPACE_DIR}<"

    return 1
  fi

  local LIST_SCRIPT="${_DIR}/ai_report_find.sh"

  if [[ -n "${WORKSPACE_DIR_LIST}" ]]; then

    LIST_SCRIPT="${WORKSPACE_DIR_LIST}"
  fi

  if [[ ! -f "${LIST_SCRIPT}" ]]; then

    echo "${0} error: script listing directories doesn't exist, WORKSPACE_DIR_LIST=>${WORKSPACE_DIR_LIST}< LIST_SCRIPT=>${LIST_SCRIPT}<"

    return 1
  fi

  local LIST

  LIST="$(cd "${WORKSPACE_DIR}" && /bin/bash "${LIST_SCRIPT}")"

  if [[ -z "${LIST}" ]]; then

    echo "${0} error: list of directories is empty, WORKSPACE_DIR=>${WORKSPACE_DIR}< LIST_SCRIPT=>${LIST_SCRIPT}<"

    return 1
  fi

  # two columns separated by tab: [original absolute path][TAB][shortened path]
  local PAIRS

  PAIRS="$(printf '%s\n' "${LIST}" | node "${_ROOT}/bash/file/progressivePaths.ts")"

  if [[ -z "${PAIRS}" ]]; then

    echo "${0} error: progressivePaths.ts returned nothing"

    return 1
  fi

  # shortened paths are presented in the picker, original paths are found later in PAIRS
  local SELECTED

  # where the selection comes from: interactive (picker) | file (restore) | stdin
  local MODE="interactive"
  local FILE=""

  if [[ "${1}" == "restore" ]]; then

    MODE="file"

    FILE="${_PWD}/__linked.json"

    if [[ -n "${2}" ]]; then

      FILE="${2}"
    fi

    if [[ ! -f "${FILE}" ]]; then

      echo "${0} error: file to restore from doesn't exist, FILE=>${FILE}<"

      return 1
    fi
  elif [[ -n "${1}" ]]; then

    echo "${0} error: unknown argument of linkrepo >${1}<, the only allowed is: restore"

    return 1
  elif [[ ! -t 0 ]]; then

    MODE="stdin"
  fi

  case "${MODE}" in
    file)
      SELECTED="$(linked_json_to_lines < "${FILE}")"
      ;;
    stdin)
      SELECTED="$(linked_json_to_lines)"
      ;;
    *)
      SELECTED="$(printf '%s\n' "${PAIRS}" | cut -f2 | node "${_ROOT}/bash/file/fuzzyMultiple.ts")"
      ;;
  esac

  if [[ "${?}" != "0" || -z "${SELECTED}" ]]; then

    echo "${0} error: nothing selected"

    return 1
  fi

  local LINKED="${_PWD}/__linked"

  if ! mkdir -p "${LINKED}"; then

    echo "${0} error: can't create directory LINKED=>${LINKED}<"

    return 1
  fi

  local STATUS="0"
  local ORIGINAL
  local SHORT
  local TARGET
  local PARENT
  local CONFLICT

  # IFS is tab here (not "\n"): we need to split line into two columns
  while IFS=$'\t' read -r ORIGINAL SHORT; do

    if ! printf '%s\n' "${SELECTED}" | grep -Fxq -- "${SHORT}"; then

      continue
    fi

    TARGET="${LINKED}/${SHORT}"

    if [[ -e "${TARGET}" || -L "${TARGET}" ]]; then

      echo "${YELLOW}exists:  __linked/${SHORT} - skipping${RESET}"

      continue
    fi

    # parent directory of the link can't be a symlink itself (link from previous run),
    # otherwise we would create things inside linked repository
    CONFLICT=""
    PARENT="${SHORT}"

    while [[ "${PARENT}" == */* ]]; do

      PARENT="${PARENT%/*}"

      if [[ -L "${LINKED}/${PARENT}" ]]; then

        CONFLICT="${PARENT}"
      fi
    done

    if [[ -n "${CONFLICT}" ]]; then

      echo "${RED}${0} error: can't create __linked/${SHORT}, __linked/${CONFLICT} is a link already${RESET}"

      STATUS="1"

      continue
    fi

    if mkdir -p "$(dirname "${TARGET}")" && ln -s "${ORIGINAL}" "${TARGET}"; then

      echo "${GREEN}linked:  __linked/${SHORT} -> ${ORIGINAL}${RESET}"
    else

      echo "${RED}${0} error: can't create link TARGET=>${TARGET}< ORIGINAL=>${ORIGINAL}<${RESET}"

      STATUS="1"
    fi
  done <<< "${PAIRS}"

  # names from the selection (__linked.json) which are not on the current list of directories
  local SHORTS

  SHORTS="$(printf '%s\n' "${PAIRS}" | cut -f2)"

  while IFS= read -r SHORT; do

    if ! printf '%s\n' "${SHORTS}" | grep -Fxq -- "${SHORT}"; then

      echo "${RED}${0} error: >${SHORT}< not found on the list of directories of WORKSPACE_DIR=>${WORKSPACE_DIR}<${RESET}"

      STATUS="1"
    fi
  done <<< "${SELECTED}"

  # snapshot of the selection: json array of shortened paths, can be used later with: ai linkrepo restore
  local JSON

  JSON="$(printf '%s\n' "${SELECTED}" | node -e '
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.length > 0);

process.stdout.write(JSON.stringify(lines, null, 2));
')"

  # printed always, so the file can be created by hand even if the question below is rejected
  # outer delimiter is not EEE on purpose: EEE is part of the printed text
  cat <<OUTER

cat <<'EEE' > __linked.json
${JSON}
EEE

OUTER

  # only in interactive mode: in other modes the snapshot exists already (and stdin might be taken)
  if [[ "${MODE}" == "interactive" ]]; then

    local QUESTION="save the selection above to ${_PWD}/__linked.json ?"

    if [[ -f "${_PWD}/__linked.json" ]]; then

      QUESTION="${_PWD}/__linked.json exists, ${RED}overwrite${RESET} it with the selection above ?"
    fi

    local ANSWER

    printf '%s' "${QUESTION} [y/N] "

    read -r ANSWER

    if [[ "${ANSWER}" == "y" || "${ANSWER}" == "Y" ]]; then

      if printf '%s\n' "${JSON}" > "${_PWD}/__linked.json"; then

        echo "${GREEN}saved:   ${_PWD}/__linked.json${RESET}"
      else

        echo "${RED}${0} error: can't write file >${_PWD}/__linked.json<${RESET}"

        STATUS="1"
      fi
    else

      echo "not saved"
    fi
  fi

  return "${STATUS}"
}

case "${1}" in
  "")
    # no command: report below
    ;;
  linkrepo)
    linkrepo "${2}" "${3}"

    exit "${?}"
    ;;
  help|--help|-h)
    help

    exit 0
    ;;
  *)
    help

    echo "${0} error: unknown command >${1}<"

    exit 1
    ;;
esac

# prints the table of skills, global and local merged by skill name
node - <<'EEE'
const fs = require("fs");
const path = require("path");
const os = require("os");

const home = os.homedir();

const globalDir = path.join(home, ".agents", "skills");

// local skills might live in both directories, the first one where given skill is found wins
const localDirs = [".agents/skills", ".claude/skills"];

/**
 * Returns names of directories with SKILL.md inside given directory.
 * Missing directory just gives empty list.
 */
function listSkills(dir) {
  if (fs.existsSync(dir)) {
    return fs.readdirSync(dir).filter((name) => fs.existsSync(path.join(dir, name, "SKILL.md")));
  }

  return [];
}

const rows = {};

function row(name) {
  if (!rows[name]) {
    rows[name] = { global: "", global_link: "", local: "" };
  }

  return rows[name];
}

for (const name of listSkills(globalDir)) {
  const r = row(name);

  r.global = name;

  r.global_link = `~/.agents/skills/${name}/SKILL.md`;
}

for (const dir of localDirs) {
  for (const name of listSkills(path.resolve(dir))) {
    const r = row(name);

    if (r.local === "") {
      r.local = `${dir}/${name}/SKILL.md`;
    }
  }
}

const sorted = Object.keys(rows)
  .sort()
  .map((name) => {
    const r = rows[name];

    // mark skills existing in both scopes: global and local
    return { ...r, duplicated: r.global !== "" && r.local !== "" ? "[duplicated]" : "" };
  });

console.log(`\nskills (global: ~/.agents/skills, local: ${process.cwd()})\n`);

if (sorted.length > 0) {
  console.table(sorted);
} else {
  console.log("no skills found");
}
EEE

cat <<EEE

    For duplicated run: ${REVERSE}https://stopsopa.github.io/pages/ai/index.html#skills-reconcile-skill-sh${RESET}

EEE

# validation of instruction files
MISSING=""

while IFS="\n" read -r FILE; do
  if [[ -f "${FILE}" ]]; then
    echo "${GREEN}found:   ${FILE}${RESET}"
  else
    MISSING="${MISSING}missing: ${FILE}"$'\n'
  fi
done <<< "${HOME}/.agents/AGENTS.md
${HOME}/.claude/CLAUDE.md
${_PWD}/AGENTS.md
${_PWD}/CLAUDE.md"

if [[ -n "${MISSING}" ]]; then

  cat <<EEE
${RED}
${MISSING}
${0} error: some instruction files are missing (listed above)
${RESET}
EEE

  help

  exit 1
fi

help

#
# Pick directories (repositories) from WORKSPACE_DIR and link them in ./__linked of current directory.
# Created to give AI agent working in one repository access to other repositories,
# with snapshot of what was linked (__linked.json) to recreate the same links later.
# Designed to be executed from any directory - links are created in current working directory.
#
# Registered in pages/ai/xx.ts as command "linkrepo" (menu behind alias "ai"),
# alias ai='xx --config ".../pages/ai/xx.ts"' - executed in the directory where "ai" was called.
#
# Steps:
#   1. requires env var WORKSPACE_DIR (e.g. WORKSPACE_DIR=/Users/szdz/Workspace), exit 1 if missing
#   2. list of directories to choose from is produced by script executed with cwd = WORKSPACE_DIR:
#        env var WORKSPACE_DIR_LIST (path to custom script) if defined
#        otherwise pages/ai/ai_report_find.sh (all direct subdirectories)
#      the script prints paths, one per line: absolute or relative to WORKSPACE_DIR
#   3. paths are shortened (bash/file/progressivePaths.ts) and shown in multi select picker
#      (bash/file/fuzzyMultiple.ts), esc in the picker = exit 1 and nothing is linked.
#      Ticked in the picker already (--preselect): union of elements of ./__linked.json
#      and symlinks found in ./__linked pointing to a directory from the list.
#      Links are recognised by their target, not by name: also those created by hand
#      or named differently (xx -> ../../../STOPSOPA__xx/STOPSOPA__xx ticks STOPSOPA__xx)
#   3a. (picker only) links of unticked elements are removed after confirmation [y/N],
#      with parent directories left empty. Only symlinks pointing to directories from the list are removed
#      (also those not created by this tool), broken links and links to anything else stay.
#      Everything unticked: also ./__linked (if empty) and ./__linked.json are removed, exit 0
#   4. for each selected: ln -s [relative path to the directory] ./__linked/[shortened path]
#      shortened path abc/cde -> directory ./__linked/abc is created and link cde in it.
#      Target of the link is relative path from directory of the link to the selected directory.
#      Already existing links/files are skipped
#   5. print the selection as json array (ready to paste: cat <<'EEE' > __linked.json ...)
#      and (interactive mode only) ask if to save it to ./__linked.json
#
# Usage:
#   cd /any/project/directory
#   /bin/bash /path/to/pages/ai/xx/linkrepo.sh                                 # picker
#   /bin/bash /path/to/pages/ai/xx/linkrepo.sh restore                         # no picker, selection from ./__linked.json
#   /bin/bash /path/to/pages/ai/xx/linkrepo.sh restore path/to/__linked.json   # no picker, selection from given file
#   /bin/bash /path/to/pages/ai/xx/linkrepo.sh < path/to/__linked.json         # no picker, selection from stdin
#   /bin/bash /path/to/pages/ai/xx/linkrepo.sh --help
#
#   ai linkrepo
#   ai linkrepo restore
#
#   In modes without picker the rest (steps 1, 2, 4, 5 without the question) is the same.
#   __linked.json is snapshot of what was linked: json array of shortened paths
#   (whole lines starting with // are comments).
#   WARNING: shortened paths depend on the whole list of directories - when new directory
#   with the same name shows up in WORKSPACE_DIR then old name (e.g. "api") becomes "a/api"
#   and restore reports it as not found.
#
# Exit code:
#   0 - done
#   1 - missing WORKSPACE_DIR, empty list, nothing selected, name not found or some link not created
#
# Requires: node
#
export NODE_OPTIONS=

GRAY=$'\033[38;5;244m'
BLACK=$'\033[30m'
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BLUE=$'\033[34m'
MAGENTA=$'\033[35m'
CYAN=$'\033[36m'
WHITE=$'\033[37m'
BOLD=$'\033[1m'
REVERSE=$'\033[7m'
RESET=$'\033[0m'

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

_ROOT="$(cd "${_DIR}/../../.." && pwd)"

if ! command -v node >/dev/null 2>&1; then

  echo "${0} error: node is not installed"

  exit 1
fi

if [[ "${1}" == "--help" || "${1}" == "-h" || "${1}" == "help" ]]; then

  cat <<EEE

${BOLD}ai linkrepo${RESET} - link directories from WORKSPACE_DIR in ./__linked (in current directory)

  ${GREEN}ai linkrepo${RESET}
                pick one or more directories from WORKSPACE_DIR and link them in ./__linked
                (links with relative paths)

                env vars:
                  WORKSPACE_DIR      (required) directory with repositories
                                     e.g. export WORKSPACE_DIR="/Users/szdz/Workspace"
                  WORKSPACE_DIR_LIST (optional) script executed in WORKSPACE_DIR, prints paths
                                     of directories to choose from, one per line
                                     (absolute or relative to WORKSPACE_DIR)
                                     default: ${_ROOT}/pages/ai/ai_report_find.sh

                picker: type to filter, Tab toggle, Ctrl+A all, Ctrl+X none, Ctrl+T invert,
                        Enter confirm, Esc cancel
                        elements of ./__linked.json and existing links are ticked already

                unticking: link of unticked element is removed (you are asked to confirm first)
                           everything unticked = ./__linked and ./__linked.json are removed too
                           just pressing Enter changes nothing: existing links stay ticked

                at the end the selection is printed as json array (content of __linked.json)
                and you are asked if to save it to ./__linked.json (snapshot of what was linked)

  ${GREEN}ai linkrepo restore${RESET}
                no picker: link again everything listed in ./__linked.json
  ${GREEN}ai linkrepo restore path/to/__linked.json${RESET}
                the same but from given file (links are still created in ./__linked)
  ${GREEN}/bin/bash ${_DIR}/linkrepo.sh < path/to/__linked.json${RESET}
                the same but content of the file is given on stdin

                __linked.json is json array of shortened paths (as shown in the picker), e.g.
                  ["SPECIAL_web/SPECIAL_web", "tabs"]
                names not found on the current list of directories are reported and exit code is 1
                comments are allowed in that file: whole lines starting with //

  ${GREEN}ai linkrepo --help${RESET}
                this help

EEE

  exit 0
fi

#
# Reads content of __linked.json from stdin (json array of strings)
# and prints its elements one per line. Exit 1 with message when the content is not valid.
# Comments are allowed in the file: only whole lines starting with // (not at the end of a line with data).
#
#   linked_json_to_lines < __linked.json
#
function linked_json_to_lines {

  node -e '
const fs = require("fs");

let data;

// json with comments: lines starting with // (after optional whitespace) are removed before parsing
const content = fs
  .readFileSync(0, "utf8")
  .split("\n")
  .filter((line) => !/^\s*\/\//.test(line))
  .join("\n");

try {
  data = JSON.parse(content);
} catch (e) {
  console.error("linkrepo.sh error: __linked.json: invalid json: " + e.message);

  process.exit(1);
}

if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
  process.stdout.write(data.join("\n"));
} else {
  console.error("linkrepo.sh error: __linked.json: expected json array of strings");

  process.exit(1);
}
'
}

if [[ -z "${WORKSPACE_DIR}" ]]; then

  cat <<EEE
${RED}
${0} error: env var WORKSPACE_DIR is not defined, WORKSPACE_DIR=>${WORKSPACE_DIR}<

It should point to the directory with repositories, for example:

  export WORKSPACE_DIR="/Users/szdz/Workspace"
${RESET}
EEE

  exit 1
fi

if [[ ! -d "${WORKSPACE_DIR}" ]]; then

  echo "${0} error: WORKSPACE_DIR is not a directory, WORKSPACE_DIR=>${WORKSPACE_DIR}<"

  exit 1
fi

LIST_SCRIPT="${_ROOT}/pages/ai/ai_report_find.sh"

if [[ -n "${WORKSPACE_DIR_LIST}" ]]; then

  LIST_SCRIPT="${WORKSPACE_DIR_LIST}"
fi

if [[ ! -f "${LIST_SCRIPT}" ]]; then

  echo "${0} error: script listing directories doesn't exist, WORKSPACE_DIR_LIST=>${WORKSPACE_DIR_LIST}< LIST_SCRIPT=>${LIST_SCRIPT}<"

  exit 1
fi

LIST="$(cd "${WORKSPACE_DIR}" && /bin/bash "${LIST_SCRIPT}")"

if [[ -z "${LIST}" ]]; then

  echo "${0} error: list of directories is empty, WORKSPACE_DIR=>${WORKSPACE_DIR}< LIST_SCRIPT=>${LIST_SCRIPT}<"

  exit 1
fi

# two columns separated by tab: [original path][TAB][shortened path]
PAIRS="$(printf '%s\n' "${LIST}" | node "${_ROOT}/bash/file/progressivePaths.ts")"

if [[ -z "${PAIRS}" ]]; then

  echo "${0} error: progressivePaths.ts returned nothing"

  exit 1
fi

#
# Finds symlinks already existing in ./__linked (any depth) which point to a directory from the list.
# Matched by the real path of the target, not by the name of the link: so links created by hand
# or with different name (xx -> ../../../STOPSOPA__xx/STOPSOPA__xx) are recognised too.
# Broken links and links to something not on the list are ignored.
#
# stdin:  PAIRS ([original path][TAB][shortened path])
# stdout: [path of the link relative to __linked][TAB][shortened path]
#
#   EXISTING="$(printf '%s\n' "${PAIRS}" | existing_links)"
#
function existing_links {

  node -e '
const fs = require("fs");
const path = require("path");

const [linked, workspace] = process.argv.slice(1);

// real path (all symlinks resolved), empty string when it does not exist
function real(p) {
  try {
    return fs.realpathSync(p);
  } catch (e) {
    return "";
  }
}

const byReal = new Map();

for (const line of fs.readFileSync(0, "utf8").split("\n")) {
  const [original, short] = line.split("\t");

  if (original && short) {
    const r = real(path.resolve(workspace, original));

    if (r) {
      byReal.set(r, short);
    }
  }
}

// symlinks are never followed here, only inspected
function walk(dir, rel) {
  let entries;

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }

  for (const entry of entries) {
    const r = rel ? rel + "/" + entry.name : entry.name;

    if (entry.isSymbolicLink()) {
      const short = byReal.get(real(path.join(dir, entry.name)));

      if (short) {
        console.log(r + "\t" + short);
      }
    } else if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), r);
    }
  }
}

walk(linked, "");
' "${_PWD}/__linked" "${WORKSPACE_DIR}"
}

# links which are already in ./__linked: [path of the link relative to __linked][TAB][shortened path]
EXISTING="$(printf '%s\n' "${PAIRS}" | existing_links)"

# where the selection comes from: interactive (picker) | file (restore) | stdin
MODE="interactive"
FILE=""

if [[ "${1}" == "restore" ]]; then

  MODE="file"

  FILE="${_PWD}/__linked.json"

  if [[ -n "${2}" ]]; then

    FILE="${2}"
  fi

  if [[ ! -f "${FILE}" ]]; then

    echo "${0} error: file to restore from doesn't exist, FILE=>${FILE}<"

    exit 1
  fi
elif [[ -n "${1}" ]]; then

  echo "${0} error: unknown argument >${1}<, allowed: restore, --help"

  exit 1
elif [[ ! -t 0 ]]; then

  MODE="stdin"
fi

# shortened paths are presented in the picker, original paths are found later in PAIRS
case "${MODE}" in
  file)
    SELECTED="$(linked_json_to_lines < "${FILE}")"
    ;;
  stdin)
    SELECTED="$(linked_json_to_lines)"
    ;;
  *)
    # elements of existing ./__linked.json are ticked in the picker already
    PRESELECT=""

    if [[ -f "${_PWD}/__linked.json" ]]; then

      PRESELECT="$(linked_json_to_lines < "${_PWD}/__linked.json")"

      if [[ "${?}" != "0" ]]; then

        echo "${YELLOW}${_PWD}/__linked.json is not valid - nothing will be preselected${RESET}"

        PRESELECT=""
      fi
    fi

    # existing links are ticked too (also when they are not in __linked.json),
    # otherwise confirming the picker would remove them
    # so ticked = union of __linked.json and links found in ./__linked (found by target, see existing_links)
    PRESELECT="${PRESELECT}"$'\n'"$(printf '%s\n' "${EXISTING}" | cut -f2)"

    # <(...) instead of temporary file: stdin of the picker is taken by the list
    # --allow-empty: unticking everything is valid answer here (= remove all links), esc is still exit 1
    SELECTED="$(printf '%s\n' "${PAIRS}" | cut -f2 | node "${_ROOT}/bash/file/fuzzyMultiple.ts" --allow-empty --preselect <(printf '%s\n' "${PRESELECT}"))"
    ;;
esac

CODE="${?}"

if [[ "${CODE}" != "0" ]]; then

  echo "${0} error: selection cancelled or not valid - nothing changed"

  exit 1
fi

if [[ -z "${SELECTED}" && "${MODE}" != "interactive" ]]; then

  echo "${0} error: nothing selected"

  exit 1
fi

# interactive mode only: links of elements unticked in the picker are removed (after confirmation).
# Only symlinks of directories from the list are touched, anything else in __linked stays.
if [[ "${MODE}" == "interactive" ]]; then

  TO_REMOVE=""

  # TO_REMOVE: paths of links relative to __linked (name of the link might differ from shortened path)
  while IFS=$'\t' read -r LINK SHORT; do

    if [[ -n "${LINK}" ]] && ! printf '%s\n' "${SELECTED}" | grep -Fxq -- "${SHORT}"; then

      TO_REMOVE="${TO_REMOVE}${LINK}"$'\n'
    fi
  done <<< "${EXISTING}"

  if [[ -n "${TO_REMOVE}" ]]; then

    cat <<EEE
${YELLOW}
links to remove (unticked) from ${_PWD}/__linked:

${TO_REMOVE}${RESET}
EEE

    printf '%s' "remove them? [y/N] "

    read -r ANSWER

    if [[ "${ANSWER}" != "y" && "${ANSWER}" != "Y" ]]; then

      echo "${0} error: rejected - nothing changed"

      exit 1
    fi

    while IFS= read -r SHORT; do

      if [[ -z "${SHORT}" ]]; then

        continue
      fi

      if rm "${_PWD}/__linked/${SHORT}"; then

        echo "${YELLOW}removed: __linked/${SHORT}${RESET}"
      else

        echo "${0} error: can't remove link >${_PWD}/__linked/${SHORT}<"

        exit 1
      fi

      # remove parent directories left empty (abc/cde -> abc), rmdir refuses not empty ones
      PARENT="${SHORT}"

      while [[ "${PARENT}" == */* ]]; do

        PARENT="${PARENT%/*}"

        if ! rmdir "${_PWD}/__linked/${PARENT}" 2>/dev/null; then

          break
        fi
      done
    done <<< "${TO_REMOVE}"
  fi

  # nothing left selected: no links, so no __linked directory and no snapshot
  if [[ -z "${SELECTED}" ]]; then

    if [[ -d "${_PWD}/__linked" ]] && ! rmdir "${_PWD}/__linked" 2>/dev/null; then

      echo "${YELLOW}${_PWD}/__linked is not empty (something not from the list is in it) - left in place${RESET}"
    fi

    if [[ -f "${_PWD}/__linked.json" ]]; then

      if rm "${_PWD}/__linked.json"; then

        echo "${YELLOW}removed: __linked.json${RESET}"
      else

        echo "${0} error: can't remove file >${_PWD}/__linked.json<"

        exit 1
      fi
    fi

    echo "nothing selected - nothing is linked"

    exit 0
  fi
fi

if ! mkdir -p "${_PWD}/__linked"; then

  echo "${0} error: can't create directory >${_PWD}/__linked<"

  exit 1
fi

# physical path (no symlinks in it): needed to calculate correct relative paths of links
LINKED="$(cd "${_PWD}/__linked" && pwd -P)"

STATUS="0"

# IFS is tab here (not "\n"): we need to split line into two columns
while IFS=$'\t' read -r ORIGINAL SHORT; do

  if ! printf '%s\n' "${SELECTED}" | grep -Fxq -- "${SHORT}"; then

    continue
  fi

  # directory is linked already, maybe under different name: no second link to the same directory
  FOUND="$(printf '%s\n' "${EXISTING}" | awk -F'\t' -v s="${SHORT}" '$2 == s { print $1; exit }')"

  if [[ -n "${FOUND}" ]]; then

    echo "${YELLOW}exists:  __linked/${FOUND} (${SHORT}) - skipping${RESET}"

    continue
  fi

  TARGET="${LINKED}/${SHORT}"

  if [[ -e "${TARGET}" || -L "${TARGET}" ]]; then

    echo "${YELLOW}exists:  __linked/${SHORT} - skipping${RESET}"

    continue
  fi

  # list script might return paths relative to WORKSPACE_DIR (like ./abc/cde)
  ABSOLUTE="${ORIGINAL}"

  if [[ "${ORIGINAL}" != /* ]]; then

    ABSOLUTE="${WORKSPACE_DIR}/${ORIGINAL}"
  fi

  if [[ ! -d "${ABSOLUTE}" ]]; then

    echo "${RED}${0} error: not a directory ABSOLUTE=>${ABSOLUTE}< (ORIGINAL=>${ORIGINAL}<)${RESET}"

    STATUS="1"

    continue
  fi

  ABSOLUTE="$(cd "${ABSOLUTE}" && pwd -P)"

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

  TARGET_DIR="$(dirname "${TARGET}")"

  # relative link is resolved from the directory where the link lives, not from cwd
  RELATIVE="$(node -e 'process.stdout.write(require("path").relative(process.argv[1], process.argv[2]))' "${TARGET_DIR}" "${ABSOLUTE}")"

  if [[ -n "${RELATIVE}" ]] && mkdir -p "${TARGET_DIR}" && ln -s "${RELATIVE}" "${TARGET}"; then

    echo "${GREEN}linked:  __linked/${SHORT} -> ${RELATIVE}${RESET}"
  else

    echo "${RED}${0} error: can't create link TARGET=>${TARGET}< RELATIVE=>${RELATIVE}< ABSOLUTE=>${ABSOLUTE}<${RESET}"

    STATUS="1"
  fi
done <<< "${PAIRS}"

# names from the selection (__linked.json) which are not on the current list of directories
SHORTS="$(printf '%s\n' "${PAIRS}" | cut -f2)"

while IFS= read -r SHORT; do

  if ! printf '%s\n' "${SHORTS}" | grep -Fxq -- "${SHORT}"; then

    echo "${RED}${0} error: >${SHORT}< not found on the list of directories of WORKSPACE_DIR=>${WORKSPACE_DIR}<${RESET}"

    STATUS="1"
  fi
done <<< "${SELECTED}"

# snapshot of the selection: json array of shortened paths, can be used later with: ai linkrepo restore
JSON="$(printf '%s\n' "${SELECTED}" | node -e '
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.length > 0);

// comment at the top of the file: how to use it, linked_json_to_lines() strips it when reading
const header = [
  "// call it:",
  "// ai linkrepo restore __linked.json",
  "// to restore",
  "// see more: https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fai%2Fxx%2Flinkrepo.sh",
].join("\n");

process.stdout.write(header + "\n" + JSON.stringify(lines, null, 2));
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

  QUESTION="save the selection above to ${_PWD}/__linked.json ?"

  if [[ -f "${_PWD}/__linked.json" ]]; then

    QUESTION="${_PWD}/__linked.json exists, ${RED}overwrite${RESET} it with the selection above ?"
  fi

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

exit "${STATUS}"

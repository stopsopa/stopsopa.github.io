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
# Usage:
#   cd /any/project/directory
#   /bin/bash /path/to/pages/ai/ai_report.sh
#
# Exit code:
#   0 - all four instruction files exist
#   1 - at least one instruction file is missing (table is printed anyway)
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

_PWD="$(pwd)"

if ! command -v node >/dev/null 2>&1; then

  echo "${0} error: node is not installed"

  exit 1
fi

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
  .map((name) => rows[name]);

console.log(`\nskills (global: ~/.agents/skills, local: ${process.cwd()})\n`);

if (sorted.length > 0) {
  console.table(sorted);
} else {
  console.log("no skills found");
}
EEE

cat <<EEE

    Run: reconcile_skill.sh ${REVERSE}https://stopsopa.github.io/pages/ai/index.html#skills-reconcile-skill-sh${RESET}

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

  exit 1
fi

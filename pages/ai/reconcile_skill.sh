#!/bin/bash
#
# Removes from the current project every skill that is also installed globally,
# then prints the commands needed to reinstall all global skills.
#
# Usage:
#   /bin/bash reconcile_skill.sh
#   /bin/bash reconcile_skill.sh --dry-run
#   curl -fsSL https://stopsopa.github.io/pages/ai/reconcile_skill.sh | bash
#   curl -fsSL https://stopsopa.github.io/pages/ai/reconcile_skill.sh | bash -s -- --dry-run
#
# Agents used in the printed "skills add" commands can be overridden:
#   SKILLS_AGENTS="claude-code cursor" /bin/bash reconcile_skill.sh
#
# NOTE: every npx call has stdin redirected from /dev/null and node receives its
# data through env vars - that way nothing can swallow the script itself when
# it is piped into bash.

set -e
set -o pipefail

DRY_RUN="0"
if [ "${1}" = "--dry-run" ]; then
  DRY_RUN="1"
fi

SKILLS_AGENTS="${SKILLS_AGENTS:-claude-code universal}"

for BIN in node npx; do
  if ! command -v "${BIN}" >/dev/null 2>&1; then
    echo "${0} error: ${BIN} is not installed" >&2
    exit 1
  fi
done

LOCAL_JSON="$(npx --yes skills ls --json </dev/null)"
GLOBAL_JSON="$(npx --yes skills ls -g --json </dev/null)"

export LOCAL_JSON GLOBAL_JSON SKILLS_AGENTS

# names of skills installed locally which also exist globally, one per line
TO_REMOVE="$(
  cat <<'EEE' | node
const parse = (name) => {
  try {
    const list = JSON.parse(process.env[name]);
    if (!Array.isArray(list)) {
      throw new Error("not an array");
    }
    return list.map((s) => s.name);
  } catch (e) {
    console.error(`reconcile_skill.sh error: can't parse ${name}: ${e.message}`);
    process.exit(1);
  }
};
const globalNames = new Set(parse("GLOBAL_JSON"));
const duplicated = parse("LOCAL_JSON").filter((name) => globalNames.has(name));
if (duplicated.length > 0) {
  console.log(duplicated.join("\n"));
}
EEE
)"

echo ""
if [ -z "${TO_REMOVE}" ]; then
  echo "Nothing to remove: no local skill is installed globally"
else
  echo "Local skills which are also installed globally:"
  while IFS= read -r SKILL; do
    if [ "${DRY_RUN}" = "1" ]; then
      echo "    [dry-run] npx skills remove ${SKILL} -y"
    else
      echo "    npx skills remove ${SKILL} -y"
      npx --yes skills remove "${SKILL}" -y </dev/null
    fi
  done <<<"${TO_REMOVE}"
fi

echo ""
echo "Globally installed skills:"
echo ""

cat <<'EEE' | node
const fs = require("fs");
const os = require("os");
const path = require("path");

// "skills ls --json" doesn't expose where a skill came from, the global lock file does
const lockFile = process.env.XDG_STATE_HOME
  ? path.join(process.env.XDG_STATE_HOME, "skills", ".skill-lock.json")
  : path.join(os.homedir(), ".agents", ".skill-lock.json");

let lock = {};
try {
  lock = JSON.parse(fs.readFileSync(lockFile, "utf8")).skills || {};
} catch (e) {
  console.error(`reconcile_skill.sh warning: can't read ${lockFile}: ${e.message}`);
}

const agents = process.env.SKILLS_AGENTS;
const names = JSON.parse(process.env.GLOBAL_JSON)
  .map((s) => s.name)
  .sort();

console.log("    npm install -g skills");
for (const name of names) {
  const source = lock[name] && lock[name].source;
  if (source) {
    console.log(`    npx skills add ${source} --skill ${name} -g -a ${agents} -y`);
  } else {
    console.log(`    # ${name} - unknown source (not found in ${lockFile})`);
  }
}
if (names.length === 0) {
  console.log("    # no skills installed globally");
}
EEE

echo ""

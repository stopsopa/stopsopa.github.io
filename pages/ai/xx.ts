// github edit  : https://github.com/stopsopa/xx/edit/main/templates/xx.ts

// in order to run any xx command with custom export env var:
// (shopt -s expand_aliases; export ENVFILE=.env.ci; xx "docker up")

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>
const S = "\\";
const GRAY = "\x1b[38;5;244m",
  BLACK = "\x1b[30m",
  RED = "\x1b[31m",
  GREEN = "\x1b[32m",
  YELLOW = "\x1b[33m",
  BLUE = "\x1b[34m",
  MAGENTA = "\x1b[35m",
  CYAN = "\x1b[36m",
  WHITE = "\x1b[37m",
  BOLD = "\x1b[1m",
  REVERSE = "\x1b[7m",
  RESET = "\x1b[0m";

const enter = `printf '\n${GREEN}Press Enter to continue (any other key exits)...${RESET}\n';old=$(stty -g);stty -icanon -echo
IFS= read -r -n1 k 2>/dev/null||IFS= read -r k;stty "$old"
[ -n "$k" ]&&exit 0;`;

const esc = `printf '\n${GREEN}Press any key to continue (Esc to exit)...${RESET}\n';old=$(stty -g);stty -icanon -echo
IFS= read -r -n1 k 2>/dev/null||IFS= read -r k;stty "$old"
[ "$k" = "$(printf '\\033')" ]&&exit 0;`;

type Command = {
  // required. Shell script, written to xx_generated.sh and executed with /bin/bash
  command: string;
  // default: name of the command. Shown under the menu for the selected row
  description?: string;
  // default: false = run straight away
  // true = ask "Run command?" first (XX_CONFIRM=false skips the question)
  confirm?: boolean;
  // default: false = executed with /bin/bash as a separate process
  // true = sourced in the current shell (cd, export, source venv/bin/activate stay after it ends)
  source?: boolean;
  // default: 0. Lower goes first: negative = top, positive = bottom
  // commands with the same order stay in the order of this file
  order?: number;
};

type Commands = Record<string, Command>;

type Ctx = {
  // arguments given after the name of the command: xx <name> [args]
  args: string[];
  // directory xx was called in
  cwd: string;
  // path of this file
  configPath: string;
};

/**
 * Menu of AI related tools available from ANY directory under alias "ai".
 *
 * This config is not used the normal way (by calling "xx" in this directory).
 * It is pointed to with "xx --config", so the menu comes from here
 * but the commands are executed in the directory where "ai" was typed
 * (report is about that directory, links are created in that directory).
 *
 * Setup - add to ~/.bashrc or ~/.zshrc (after the line which defines alias xx):
 *
 *   alias ai='xx --config "/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/ai/xx.ts"'
 *
 *   # required by: ai linkrepo. Directory with repositories
 *   export WORKSPACE_DIR="/Users/szdz/Workspace"
 *
 *   # optional, used by: ai linkrepo. Script executed in WORKSPACE_DIR, it prints directories
 *   # to choose from, one per line (absolute, or relative to WORKSPACE_DIR but without ./ at the beginning).
 *   # Not defined = pages/ai/xx/linkrepo_find.sh (direct subdirectories of WORKSPACE_DIR).
 *   # Own script is needed e.g. for layout WORKSPACE_DIR/[group]/[repository]:
 *   #     find "$(pwd)" -mindepth 2 -maxdepth 2 -type d | sort
 *   export WORKSPACE_DIR_LIST="/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/ai/xx/linkrepo_find.sh"
 *
 * Usage:
 *   cd /any/project/directory
 *   ai                      # menu
 *   ai report               # pages/ai/xx/report.sh
 *   ai linkrepo             # pages/ai/xx/linkrepo.sh
 *   ai linkrepo restore
 *   ai linkrepo --help
 *
 * New tool: create script in pages/ai/xx/ and register it below as next command.
 * Scripts are found through ctx.configPath (path of this file), never through the current directory.
 */
export default (setup: Commands, ctx: Ctx): Commands => {
  // directory of this file: pages/ai
  const dir = ctx.configPath.replace(/\/[^/]*$/, "");

  return {
    [`skills`]: {
      command: `
set -e
/bin/bash "${dir}/xx/skills.sh" "\${@}"
`,
      description: `table of skills (global and local) + validation of AGENTS.md / CLAUDE.md in home and in current directory`,
    },
    [`linkrepo`]: {
      command: `
set -e
/bin/bash "${dir}/xx/linkrepo.sh" "\${@}"
`,
      description: `pick directories from WORKSPACE_DIR and link them in ./__linked. Arguments: restore [path/to/__linked.json] | --help`,
    },
    ...setup,
  };
};

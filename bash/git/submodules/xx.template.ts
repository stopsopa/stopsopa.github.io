// Template: how to mount the scripts from bash/git/submodules/*.sh in the xx menu of a project.
//
// It is a complete, working config. For a project without xx.ts:
//
//     cp bash/git/submodules/xx.template.ts xx.ts
//
// For a project which already has xx.ts copy two things into it:
//   - the constant SUBMODULES (put it right above "export default")
//   - the commands "submodule ..." (and the lines about them from "help")
//
// Then, in both cases:
//   1. SUBMODULES: path of the directory with the scripts, relative to the root of the project
//      (xx runs the commands in the directory where xx.ts is). Change it when the scripts
//      live somewhere else than bash/git/submodules.
//   2. "submodule add": replace the list with the submodules of your project,
//      one per line: <path> <url> <branch>. Update the "description" of that command
//      and the table in "help" to match.
//   3. xx "submodule add", then commit .gitmodules, the pins and xx.ts.
//
// Every script can also be called directly, without xx, each has the instruction at its top:
//     /bin/bash bash/git/submodules/status.sh
//
// --- below this line it is a regular xx.ts ---

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

// directory with add.sh, install.sh, update.sh, reset.sh, delete.sh and status.sh,
// relative to the root of the project
const SUBMODULES = `bash/git/submodules`;

export default (setup: Commands, ctx: Ctx): Commands => {
  return {
    help: {
      command: `
set -e

cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  Other repositories are mounted here as git submodules:

    directory                       repository                                        tracked branch
    submodules/encrypt              git@github.com:stopsopa/encrypt.git               main
    submodules/stopsopa.github.io   git@github.com:stopsopa/stopsopa.github.io.git    master
    submodules/xx                   git@github.com:stopsopa/xx.git                    main

  This repository does not store the files of the submodules, only (in .gitmodules)
  their url + branch and (in the commit) the exact commit each of them is pinned to.

  xx "submodule add"       once, ever        register the submodules and commit the result
  xx "submodule install"   once per clone    download the submodules at the pinned commits
  xx "submodule update"    when you want     move the pins to the newest commit of the tracked branches
  xx "submodule reset"     when dirty        discard local changes in the submodules and go back to the pinned commits
                                             (one only: xx "submodule reset" submodules/encrypt)
  xx "submodule delete"    rarely            remove one submodule completely: xx "submodule delete" submodules/encrypt
  xx "submodule status"    anytime           where the pins are and how far behind the branches

  The scripts behind them: ${SUBMODULES}/*.sh, each has the instruction at its top.

EEE
`,
      description: `what is this repository and how to work with its submodules`,
    },
    /*
    ## The commands

    | Command | When | What it runs |
    |---|---|---|
    | `xx "submodule add"` | once, ever | `git submodule add -b main … submodules/encrypt` `-b master … submodules/stopsopa.github.io` and `-b main … submodules/xx`; skips any already in `.gitmodules` |
    | `xx "submodule install"` | once per clone | `git submodule update --init --recursive`, plus `git config submodule.recurse true` |
    | `xx "submodule update"` | when you want newer code | `git submodule update --init --remote`, then lists the commits that came in |
    | `xx "submodule reset" [path]` | when a submodule is dirty | lists what would be lost, waits for Enter, then `git submodule update --init --recursive --force`; untracked files are left alone |
    | `xx "submodule delete" <path>` | rarely | `git submodule deinit -f <path>`, `git rm -f <path>`, `rm -rf .git/modules/<name>`; refuses when the submodule has uncommitted changes or unpushed commits |
    | `xx "submodule status"` | anytime | per submodule: branch, current commit, newest remote commit, how far behind, uncommitted files |

    To get going: run `xx "submodule add"`, then `git add xx.ts && git commit && git push`.

    ## How submodules work

    The parent repo never stores the submodule's files. It stores two things:

    - **`.gitmodules`**: path, URL and branch of each submodule.
    - **A pinned commit**: the exact SHA of each submodule, recorded in the parent's commit.

    The parent always pins a commit; it never follows a branch. The branch in `.gitmodules` is only a hint telling `update --remote` where to look for the newest commit.

    ## How many operations

    Three, plus delete and status:

    1. **Add** (once ever): register the URL and branch, then commit `.gitmodules` and the pin.
    2. **Install** (once per clone): download each submodule at its pinned commit. `git clone --recurse-submodules` does the same in one go.
    3. **Update** (whenever you choose): move the pins to the tip of the tracked branches, then `git add submodules && git commit` in the parent. Without that commit, nobody else sees the bump.

    4. **Delete** (rarely): three places have to be cleaned, there is no single git command for it: `.git/config` + the directory (`git submodule deinit`), the pin + `.gitmodules` (`git rm`) and the local clone in `.git/modules/<name>` (`rm -rf`). Then commit in the parent.

    Moving a submodule to another directory is not delete + add, it is just `git mv old/path new/path` and a commit.

    Staying on track day to day needs no extra command: with `submodule.recurse true`, a plain `git pull` or `git switch` in the parent also moves the submodules to whatever is pinned.

    ## Things that catch people out

    - **Detached HEAD**: after install or update, a submodule sits on a commit, not a branch. To work inside one, run `git switch main` (or `master`) there first, commit and push there, then commit the new pin in the parent.
    - **Push order**: push the submodule before the parent, otherwise the parent pins a commit nobody else can fetch.
    - **Dirty parent**: `git status` in the parent showing `modified: submodules/encrypt (new commits)` just means the submodule is on a different commit than the pin. Either commit it (a bump) or run `xx "submodule install"` to go back to the pin.
    - **Dirty submodule**: `modified: submodules/xx (modified content)` means files inside the submodule were edited and not committed there. The parent can't commit that, and `xx "submodule update"` fails on it ("local changes would be overwritten by checkout"). Either commit inside the submodule, or throw the edits away with `xx "submodule reset"`.
    */
    [`submodule add`]: {
      command: `
set -e

# list of the submodules of this project, one per line: <path> <url> <branch>
/bin/bash ${SUBMODULES}/add.sh ${S}
  submodules/encrypt            git@github.com:stopsopa/encrypt.git            main ${S}
  submodules/stopsopa.github.io git@github.com:stopsopa/stopsopa.github.io.git master ${S}
  submodules/xx                 git@github.com:stopsopa/xx.git                 main
`,
      description: `one time: register encrypt (main), stopsopa.github.io (master) and xx (main) as submodules in ./submodules. Safe to run again`,
    },
    [`submodule install`]: {
      command: `
set -e

/bin/bash ${SUBMODULES}/install.sh
`,
      description: `after a fresh clone: download all submodules at the commits pinned by this repository`,
    },
    [`submodule update`]: {
      command: `
set -e

/bin/bash ${SUBMODULES}/update.sh
`,
      description: `move every submodule to the newest commit of its tracked branch (branch is in .gitmodules). Commit afterwards`,
    },
    [`submodule reset`]: {
      command: `
set -e

/bin/bash ${SUBMODULES}/reset.sh "\$@"
`,
      description: `discard uncommitted changes in the submodules and put them back on the pinned commits (lists what will be lost and waits for Enter). Optional argument: path of one submodule, e.g. xx "submodule reset" submodules/xx`,
    },
    [`submodule delete`]: {
      command: `
set -e

/bin/bash ${SUBMODULES}/delete.sh "\$@"
`,
      description: `remove one submodule completely. Argument: its path, e.g. xx "submodule delete" submodules/encrypt. Commit afterwards`,
    },
    [`submodule status`]: {
      command: `
set -e

/bin/bash ${SUBMODULES}/status.sh
`,
      description: `pinned commit of every submodule and how far it is behind its tracked branch (fetches)`,
    },
    ...setup,
  };
};

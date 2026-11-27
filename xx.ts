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
  // directory xx was called in. The script of the command is executed there,
  // also when this file lives somewhere else (xx --config <path>, XX_CONFIG)
  cwd: string;
  // absolute path of this file
  configPath: string;
  // absolute path of the directory of this file, to reach files living next to it:
  //   command: `/bin/bash "${ctx.configDir}/xx/tool.sh" "\${@}"`
  configDir: string;
};

export default (setup: Commands, ctx: Ctx): Commands => {
  return {
    help: {
      command: `
set -e
# git config core.excludesFile .git/.gitignore_local

source .env
# source .env.sh

cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  server:
    http://\${LOCAL_HOSTS}:\${NODE_API_PORT}

  Warning:
      Generally this project uses pnpm

EEE

      `,
      description: "Status of all things and help page",
      source: false,
      confirm: false,
    },
    [`dev`]: {
      command: `
set -e
export NODE_OPTIONS=""
cat <<EEE

/bin/bash dev.sh
/bin/bash dev.sh browser

EEE

${enter}

/bin/bash dev.sh
`,
      description: `launch esbuild - will NOT launch browser nor IDE`,
      confirm: false,
      source: false,
    },
    [`cert`]: {
      command: `
cat <<EEE

/bin/bash cert/cert-info.sh
/bin/bash cert/refresh.sh

EEE
`,
      description: `check or regenerate https cert`,
      confirm: false,
      source: false,
    },
    [`type`]: {
      command: `
set -e
export NODE_OPTIONS=
cat <<EEE

$ /bin/bash tsc.sh

EEE
NODE_OPTIONS= /bin/bash tsc.sh
`,
      description: `launch esbuild - will NOT launch browser nor IDE`,
      confirm: false,
      source: false,
    },
    [`server_with_lodash_template`]: {
      command: `
set -e
export NODE_OPTIONS=""
node --env-file .env  server-template.ts
`,
      description: `launch esbuild and browser tab`,
      confirm: false,
      source: false,
    },
    [`build`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash build.sh 2>&1 | tee var/build.log

cat <<EEE

   check: var/build.log

EEE
`,
      description: `build is build`,
      confirm: false,
      source: false,
    },
    [`test server`]: {
      command: `
COMMANDS="$(cat <<-EOF

TEST_ONE="one" TEST_TWO="two" node src/cli.js --mask '^TEST_' examples/preprocessed.js --debug
HOST="0.0.0.0" PORT="8433" node server.js

EOF
)"
echo "\$COMMANDS"

${enter}

set -e
eval "\$COMMANDS"

`,
      confirm: false,
    },
    [`test`]: {
      command: `
set -e
export NODE_OPTIONS=""
cat <<EEE

/bin/bash test.sh --help

EEE
`,
      description: `helper script running all unit jest tests`,
      confirm: false,
    },
    [`jasmine`]: {
      command: `
set -e
export NODE_OPTIONS=""
cat <<EEE

/bin/bash jasmine/test.sh --env .env

NODE_API_PORT=4273 /bin/bash jasmine/test.sh --env .env -- --target docker
NODE_API_PORT=4273 /bin/bash jasmine/test.sh --env .env -- -- --debug

NODE_API_PORT=4273 /bin/bash jasmine/test.sh ${S}
      --env .env ${S}
      --filter "grep template.jasmine.unit.js" ${S}
      -- --target docker

NODE_API_PORT=4273 /bin/bash jasmine/test.sh ${S}
      --stay ${S}
      --env .env ${S}
      --test jasmine/lib/template.jasmine.unit.js ${S}
      --  ${S}
      -- --debug

NODE_API_PORT=4273 /bin/bash jasmine/test.sh ${S}
      --stay ${S}
      --env .env ${S}
      --filter "grep template.jasmine.unit.js" ${S}
      --  ${S}
      -- --debug

EEE
`,
      description: `examples of running jasmine tests`,
      confirm: false,
    },
    [`testall`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash testall.sh
`,
      description: `it's doing few things: it tries to stop server (if it's running already), then builds, launches server, runs jest and the playwright`,
      confirm: false,
    },
    [`uglify`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash scripts/uglify.sh
`,
      description: `
Usually it's good idea to execute it before /bin/bash scripts/template.sh

Finds all *.uglify.js files in this directory
and then pass this file through babel and then through uglifyjs
then generates from each *.uglify.js corresponding *.uglify.min.js in the same location
`,
      confirm: false,
    },
    [`coverage server`]: {
      command: `
JEST_COVERAGE_PORT="4286"
export NODE_OPTIONS=""
cat <<EEE

    http://localhost:\${JEST_COVERAGE_PORT}

EEE

${enter}

python -m http.server \${JEST_COVERAGE_PORT} --directory pages/coverage
`,
      confirm: false,
    },
    [`coverage`]: {
      command: `
set -e
source .env
cat <<EEE

    open "file://$(realpath "coverage/index.html")"

EEE

${enter}

open "file://$(realpath "coverage/index.html")"
`,
      confirm: false,
    },
    [`server`]: {
      command: `
COMMAND="PORT=8080 HOST=0.0.0.0 /bin/bash node_modules/.bin/nodemon -e js,html -x \\"node --experimental-strip-types\\" server/index.ts"

cat <<EEE

\${COMMAND}

EEE

${enter}

# heredoc inline
cat <<EEE | bash
\${COMMAND}
EEE

`,
      description: `build is build`,
      confirm: false,
    },
    [`template watch`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash scripts/template.sh
/bin/bash node_modules/.bin/chokidar '**/*.template.html' --initial --ignore '**/node_modules/**/*' -c '/bin/bash template.sh'
`,
      description: `
Usually it's good idea to execute it after /bin/bash scripts/uglify.sh

Finds all *.template.html and process them to *.rendered.html in the same location
<%url lib/jira-create.uglify.min.js %>
<%inject /pages/bookmarklets/periscope.uglify.js %>
`,
      confirm: false,
    },
    [`preprocessor`]: {
      command: `
set -e
eval "$(node bash/exportsource.ts .env)"
export NODE_OPTIONS=""
node node_modules/envprocessor/dist/esm/cli.js --maskEnv EXPOSE_EXTRA_ENV_VARIABLES --verbose --debug build/preprocessed.js public/preprocessed.js
`,
      description: ``,
      confirm: false,
      source: false,
    },
    [`esbuild-entries`]: {
      command: `
set -e
export NODE_OPTIONS=""
node esbuild-entries.js
`,
      description: `
Finds all /**/*.entry.{js,jsx} and process them to /dist/[name].bundle.js
see more esbuild-entries.js
`,
      confirm: false,
    },
    [`urlwizzard`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash .github/urlwizzard.sh
`,
      description: `
all all "*.html" or "*.js" or "*.css" or "*.scss" or "*.sh"
urlwizzard.hostname         stopsopa.github.io
urlwizzard.schema           https
urlwizzard.hostnegotiated   stopsopa.github.io
urlwizzard.portnegotiated   ''
urlwizzard.port             443
GITHUB_SOURCES_PREFIX       https://github.com/stopsopa/stopsopa.github.io

more about: https://github.com/stopsopa/stopsopa.github.io#there-is-feature-i-call-urlwizzard
`,
      confirm: false,
    },
    [`sha384`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash .github/sha384.sh
`,
      description: `
all "*.html"
sha384.sh::pages/vault/vault.sh
to
sha384-OdBGfw1BV7BWBiuVl5BDC5KREOG6aHeoK9kCLSvM7rczqmRDoc/u2ViiBp6LmeDy
`,
      confirm: false,
    },
    [`style_fix`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash node_modules/.bin/prettier --config prettier.config.cjs --write .
`,
      description: ``,
      confirm: false,
    },
    [`clicksecure`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash .github/clicksecure.sh
`,
      description: `
adds special script to each *.html pages
more https://stopsopa.github.io/pages/js/clicksecure.html
`,
      confirm: false,
    },
    [`injector`]: {
      command: `
set -e
export NODE_OPTIONS=""
/bin/bash .github/injector.sh
`,
      description: `
finds all *.inject.js, produces next them *.injected.js
in search for  injector: path/to_file.(js|txt|any...)
`,
      confirm: false,
    },
    [`reencode`]: {
      command: `
set -e
cat <<EEE

# generate new key:
https://stopsopa.github.io/pages/services/encryptor/index.rendered.html

# controlled via .env

AES256_KEY="xxx"

NODE_OPTIONS="" /bin/bash scripts/reencode.sh "PREVIOUS_KEY"
  # dry run/check mode

RUN=true NODE_OPTIONS="" /bin/bash scripts/reencode.sh "PREVIOUS_KEY"
  # run for reach

NOTE: use the same key just for test, you don't have to use new key for PREVIOUS_KEY, especially in dry mode

EEE

`,
      description: `
AES256 encryption - encrypt again or check
`,
      confirm: false,
    },
    ...setup,
  };
};

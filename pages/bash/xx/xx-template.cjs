// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fbash%2Fxx%2Fxx-template.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/xx/xx-template.cjs

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local
# read -p "       Press enter to continue\\n\\n"
# source .env
# source .env.sh
export NODE_OPTIONS=""
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  arango admin:
    http://localhost:\${DYNAMO_ADMIN_PORT}

-- DEV NOTES --

EEE

      `,
      description: "Status of all things",
      source: true,
      confirm: false,
    },
    [`yarn`]: {
      command: `
cat <<EEE

/bin/bash bash/swap-files-v2.sh package.json package.dev.json -- yarn   

EEE
read -p "       Press enter to continue\n\n"
/bin/bash bash/swap-files-v2.sh package.json package.dev.json -- yarn   
`,
      description: `swap and yarn`,
      confirm: false,
    },
    [`~/help`]: {
      command: `
set -e
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

EEE
`,
      description: `help from ~/xx.cjs`,
      confirm: false,
    },
    [`coverage`]: {
      command: `
set -e
source .env
cat <<EEE

    open "file://$(realpath "coverage/index.html")"
    open -a "Google Chrome" "file://$(realpath "coverage/index.html")"

EEE
read -p "\n      Press enter to continue\n"
open "file://$(realpath "coverage/index.html")"
`,
      confirm: false,
    },
    [`xx`]: {
      command: `
shopt -s expand_aliases && source ~/.bashrc
function cleanup {
  xx --unlock
}
trap cleanup EXIT;
xx --lock    
echo do something after lock           
`,
      description: `run catalog-ui-service`,
      confirm: false,
    },
    [`echo`]: {
      command: `echo global test - \${1} - \${2} -- \${@} -end; exit 54`,
      description: `run catalog-ui-service`,
      // order: 1001,
    },

    [`coverage server`]: {
      command: `
JEST_COVERAGE_PORT="4286"
cat <<EEE
    http://localhost:\${JEST_COVERAGE_PORT}
EEE
read -p "\n      Press enter to continue\n"
python -m http.server \${JEST_COVERAGE_PORT} --directory ./coverage

# for python version 2.7

# cd ./coverage
# python -m SimpleHTTPServer \${PORT}
`,
      confirm: false,
    },
    [`sonar`]: {
      command: `
set -e
USER="sdzialowski"
BRANCH="\$(git rev-parse --abbrev-ref HEAD | sed -E 's/\\/+/--/g')"
PROJECT_NAME="\${USER}_\${BRANCH}"
echo "USER>\${USER}<"
echo "BRANCH>\${BRANCH}<"
echo "PROJECT_NAME>\${PROJECT_NAME}<"
echo "http://p3dw-sonar.cloud.phx3.gdg:9000/dashboard?id=\${PROJECT_NAME}"
# look for link above in ~/.m2/settings.xml
read -p "\n       Press enter to continue\n"
mvn clean test -DskipITs -B sonar:sonar -Dsonar.projectKey="\${PROJECT_NAME}" -Dsonar.projectName="\${PROJECT_NAME}"
`,
      confirm: false,
    },
    [`google-java-format list`]: {
      command: `
set -e
google-java-format -version 1> /dev/null 2> /dev/null
if [ "\${?}" != "0" ]; then
    cat <<EEE
google-java-format not installed
    mac: 
        export HOMEBREW_NO_AUTO_UPDATE=1 && brew install google-java-format
EEE
    exit 1
fi
gjf --list
`,
      description: `gjf --list`,
      confirm: false,
    },
    [`google-java-format format`]: {
      command: `
set -e
google-java-format -version 1> /dev/null 2> /dev/null
if [ "\${?}" != "0" ]; then
    cat <<EEE
google-java-format not installed
    mac: 
        export HOMEBREW_NO_AUTO_UPDATE=1 && brew install google-java-format
EEE
    exit 1
fi
gjf --format
`,
      description: `gjf --format`,
      confirm: false,
    },
    [`style_list`]: {
      command: `
set -e
# make style_list
node node_modules/.bin/prettier --config prettier.config.cjs --list-different .
`,
      description: `style_list`,
      confirm: false,
    },
    [`style_fix`]: {
      command: `
set -e
# make style_fix
node node_modules/.bin/prettier --config prettier.config.cjs --write .
`,
      description: `style_fix`,
      confirm: false,
    },
    dependencies: {
      command: `
set -e
mvn dependency:list | perl -pe "system 'sleep .03'" | sed -r "s/[[:cntrl:]]\\[[0-9]{1,3}m//g" | grep -i -E '^\\[INFO\\]' | tee dependencies_list.txt
mvn dependency:tree | perl -pe "system 'sleep .03'" | sed -r "s/[[:cntrl:]]\\[[0-9]{1,3}m//g" | grep -i -E '^\\[INFO\\]' | tee dependencies_tree.txt
echo all good
      `,
      description: "Status of all things",
      confirm: false,
    },

    ...setup,
  };
};

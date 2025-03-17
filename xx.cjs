// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=xx.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/xx.cjs
// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>
// to override confirm: true
//   XXCONFIRM=false xx <command_name>

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local
# read -p "       Press enter to continue\\n\\n"
source .env
# source .env.sh
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  server:
    http://\${LOCAL_HOSTS}:\${NODE_API_PORT}

EEE

      `,
      description: "Status of all things and help page",
      source: true,
      confirm: false,
    },
    [`build`]: {
      command: `
set -e        
export NODE_OPTIONS=""
/bin/bash build.sh        
`,
      description: `build is build`,
      confirm: false,
    },
    [`start`]: {
      command: `
set -e        
export NODE_OPTIONS=""        
/bin/bash dev.sh         
`,
      description: `launch esbuild - will NOT launch browser nor IDE`,
      confirm: false,
    },
    [`start + browser`]: {
      command: `
set -e         
export NODE_OPTIONS=""       
/bin/bash dev.sh browser        
`,
      description: `launch esbuild and browser tab`,
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
/bin/bash uglify.sh      
`,
      description: `
Usually it's good idea to execute it before /bin/bash template.sh

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
read -p "\n      Press enter to continue\n"
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
read -p "\n      Press enter to continue\n"
open "file://$(realpath "coverage/index.html")"
`,
      confirm: false,
    },
    [`template watch`]: {
      command: `
set -e        
export NODE_OPTIONS=""
/bin/bash template.sh    
node node_modules/.bin/chokidar '**/*.template.html' --initial --ignore '**/node_modules/**/*' -c '/bin/bash template.sh'
`,
      description: `
Usually it's good idea to execute it after /bin/bash uglify.sh

Finds all *.template.html and process them to *.rendered.html in the same location
<%url lib/jira-create.uglify.min.js %>
<%inject /pages/bookmarklets/periscope.uglify.js %>  
`,
      confirm: false,
    },
    [`preprocessor`]: {
      command: `
set -e    
export NODE_OPTIONS=""     
node libs/preprocessor.js   
`,
      description: ``,
      confirm: false,
    },
    [`esbuild`]: {
      command: `
set -e    
export NODE_OPTIONS=""     
node esbuild.config.js
`,
      description: `
Finds all /**/*.entry.{js,jsx} and process them to /dist/[name].bundle.js
see more esbuild.config.js
`,
      confirm: false,
    },
    [`esbuild`]: {
      command: `
set -e      
export NODE_OPTIONS=""  
/bin/bash esbuild.sh 
`,
      description: `
  bundles all files "*.node.js" or "*.node.cjs" or "*.node.mjs"
  and processes it to xx.node.bundled.gitignored.js
  and then it copies each of xx.node.bundled.gitignored.js to xx.node.bundled.gitignored.cjs right next to it
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
node node_modules/.bin/prettier --config prettier.config.cjs --write .        
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
    ...setup,
  };
};

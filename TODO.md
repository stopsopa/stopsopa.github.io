https://firebase.google.com/docs/auth/web/auth-state-persistence#web-version-8


- [ ] esbuild-node.js
esbuild-node.js: >./pages/bash/xx/xx.lock.gits-update-config.node.cjs
./pages/bash/xx/xx.node.cjs<
esbuild-node.js: entryPoints [
  '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.lock.gits-update-config.node.cjs',
  '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.node.cjs'
]
esbuild-node.js: renameFiles [
  {
    source: '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.lock.gits-update-config.node.bundled.gitignored.js',
    target: '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.lock.gits-update-config.node.bundled.gitignored.cjs'
  },
  {
    source: '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.node.bundled.gitignored.js',
    target: '/Users/szdz/Workspace/SPECIAL_web/SPECIAL_web/pages/bash/xx/xx.node.bundled.gitignored.cjs'
  }
]


maybe I could replace this script esbuild-node.js with es.ts?  https://stopsopa.github.io.local:4339/pages/typescript/index.rendered.html#strip-types-from-cli-es-ts


- [ ]  from xx build output log: I wonder if I could avoid multiple -prune for find like here https://stopsopa.github.io.local:4339/pages/typescript/index.rendered.html#strip-types-from-cli-es-ts
with multiple -name/-path separated with -o in the brackets:
find . \( \
    -type d -name node_modules -prune -o \
    -type d -name .git -prune -o \
    -type d -name .github -prune -o \
    -type d -name dist -prune -o \
    -type d -name docker -prune -o \
    -type d -name bash -prune -o \
    -type d -name coverage -prune -o \
    -type d -name var -prune -o \
    -type d -name noprettier -prune \
\) \
-o \
\( -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.scss" -o -name "*.sh" \) -print \) | sort
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
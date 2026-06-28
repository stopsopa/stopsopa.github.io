# 
# time /bin/bash .github/injectServiceWorker.sh
# 

grep -Z '<script type="module" src="/js/github.js"></script>' -rl \
  --exclude-dir={node_modules,.git,noprettier,dist,playwright-report,jasmine} \
  --include '*.html' |
node .github/injectServiceWorker.ts
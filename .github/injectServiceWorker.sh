# Purpose:
#   Injects a Service Worker registration script into HTML files and updates
#   the cache version (CACHE_NAME) in sw.js based on the execution or server start time.
#
# Usage:
#   1. Build/CLI: Used via .github/injectServiceWorker.sh to inject the service
#      worker registration script into HTML files in-place on disk, and updates
#      sw.js on disk with the build timestamp.
#   2. Express: Used dynamically via .github/injectServiceWorker_middleware.ts in server.js
#      to inject the registration script into HTML files in-flight (on the fly, without modifying
#      files on disk) and rewrite the CACHE_NAME in sw.js on the fly with the server start time.
#
# Note:
#   This explanation also exists in .github/injectServiceWorker.ts.
#
# Execution:
#   time /bin/bash .github/injectServiceWorker.sh
#
grep -Z '<script type="module" src="/js/github.js"></script>' -rl \
  --exclude-dir={node_modules,.git,noprettier,dist,playwright-report,jasmine} \
  --include '*.html' |
node .github/injectServiceWorker.ts
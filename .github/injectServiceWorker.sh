grep -Z '<script type="module" src="/js/github.js"></script>' -rl \
  --exclude-dir={node_modules,.git,noprettier,dist,playwright-report,jasmine} \
  --include '*.html' |
xargs -0 sed -i '0,/<head>/{
/<head>/i\
<script>\
  if ("serviceWorker" in navigator) {\
    navigator.serviceWorker.register("/sw.js");\
  }\
</script>
}'
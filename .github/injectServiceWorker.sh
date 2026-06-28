grep -Z '<script type="module" src="/js/github.js"></script>' -rl \
  --exclude-dir={node_modules,.git,noprettier,dist,playwright-report,jasmine} \
  --include '*.html' |
while IFS= read -r -d '' file; do
  perl -0777 -i -pe '
    s{<head>}{
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
</script>
<head>
}s if $. == 1
  ' "$file"
done
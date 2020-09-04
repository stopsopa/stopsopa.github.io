
node node_modules/.bin/webpack

node node_modules/.bin/onchange \
  'pages/**/*.entry.jsx' \
  --exclude-path .prettierignore \
  -- \
  node node_modules/.bin/webpack






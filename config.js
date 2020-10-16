
require('./roderic/restrict-to-node')(__filename);

const path              = require("path");

const root              = path.resolve(__dirname);

const webpack           = root;

const vardir            = path.resolve(root, 'var');

// relative path to public server directory
const output            = path.resolve(root, 'public', 'dist');

const node_modules      = path.join(root, 'node_modules');

const app               = path.resolve(root, 'pages');

const override          = path.resolve(root, 'override');

require('dotenv-up')({
  override    : false,
  deep        : 3,
}, false, 'config.js');

const env               = require('./roderic/dotenv');

module.exports = mode => ({
  // just name for this project, it's gonna show up in some places
  name: env('PROJECT_NAME'),
  root,
  app,
  webpack,
  node_modules,
  vardir,
  output,
  resolve: [ // where to search by require and files to watch

    app,

    override,

    'node_modules', // https://github.com/ReactTraining/react-router/issues/6201#issuecomment-403291934
  ],
  js: {
    entries: [ // looks for *.entry.{js|jsx} - watch only on files *.entry.{js|jsx}
      app,
      // ...
    ],
  },
});


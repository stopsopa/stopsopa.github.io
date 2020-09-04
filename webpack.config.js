'use strict';

const path                  = require('path');

const utils                 = require('./roderic/utils');

const config                = require(path.resolve('config.js'))(process.env.NODE_ENV);

require('colors');

utils.setup(config);

module.exports = {
  mode: 'production',
  entry: utils.entries(),
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
            ],
          }
        }
      },
    ]
  },
  optimization: {
    minimize: false,
  },
  plugins: [
  ]
};

console.log( ("\nbuild "+ (new Date()).toISOString().substring(0, 19).replace('T', ' ') + "\n").green );
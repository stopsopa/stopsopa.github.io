"use strict";

const path = require("path");

const utils = require("./libs/utils");

const webpack = require("webpack");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const log = require("inspc");

const config = require("./config")(process.env.NODE_ENV);

require("colors");

utils.setup(config);

const isProd = process.env.NODE_ENV === "production";

const after = (mode) => {
  // https://i.imgur.com/mWzuQWP.png
  const color = (function (c) {
    return (...args) => c[args.pop()] + args.join("") + c.reset;
  })({
    BgBlue: "\x1b[44m",
    reset: "\x1b[0m",
  });

  const c = (...args) => color(...args);

  let port = process.env.NODE_PORT;
  port = port == 80 ? "" : `:${port}`;
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this,
        args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }
  const d = debounce((e) => {
    let host = "0.0.0.0";

    if (process.env.LOCAL_HOSTS) {
      host = process.env.LOCAL_HOSTS;
    }

    console.log(c(`\n http://${host}${port}/index.html`, `BgBlue`));
  }, 2000);
  return {
    apply: (compiler) => {
      compiler.hooks.done.tap("done", () => {
        d("done");
        return true;
      });
    },
  };
};

module.exports = {
  mode: "production",
  entry: utils.entries(),
  output: {
    // https://webpack.js.org/configuration/output/#outputpath
    // path: config.output,
    filename: "[name].bundle.js",
  },
  node: {
    // https://github.com/webpack/webpack/issues/1599
    __dirname: true,
    __filename: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: config.node_modules,
        use: [
          {
            // https://webpack.js.org/guides/build-performance/#persistent-cache
            loader: "cache-loader",
            options: {
              cacheDirectory: path.resolve(config.vardir, "cache-loader"),
            },
          },
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        // include: [
        //   config.node_modules,
        //   // path.resolve(__dirname, 'path/to/imported/file/dir'),
        // ],
        use: [
          // // Creates `style` nodes from JS strings
          // 'style-loader', i will relay on MiniCssExtractPlugin
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          "css-loader", // https://webpack.js.org/loaders/css-loader/
          // Compiles Sass to CSS
          "sass-loader", // https://webpack.js.org/loaders/sass-loader/#root
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  plugins: [
    // https://webpack.js.org/guides/production/
    // https://webpack.js.org/guides/output-management/#cleaning-up-the-dist-folder
    new CleanWebpackPlugin(),

    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: `[name].bundle.css`,
      // chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }), // https://webpack.js.org/plugins/mini-css-extract-plugin/#root
    new webpack.DefinePlugin({
      // https://webpack.js.org/plugins/define-plugin/
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    after(process.env.NODE_ENV),
  ],
  performance: {
    hints: false,
  },
  //...
  stats: {
    colors: {
      green: "\u001b[32m",
    },
  },
};

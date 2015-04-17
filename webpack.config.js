/**
 * Good sources:
 *    https://www.robinwieruch.de/minimal-react-webpack-babel-setup/
 */
import utils from "./libs/utils.js";

import webpack from "webpack";

import MiniCssExtractPlugin from "mini-css-extract-plugin";

import configLib from "./config.js";

import "colors";

import path from "path";

const config = configLib(process.env.NODE_ENV);

utils.setup(config);

process.env.NODE_ENV = "production";

const isProd = process.env.NODE_ENV === "production";

const after = (NODE_ENV) => {
  // https://i.imgur.com/mWzuQWP.png
  const color = (function (c) {
    return (...args) => c[args.pop()] + args.join("") + c.reset;
  })({
    BgBlue: "\x1b[44m",
    reset: "\x1b[0m",
  });

  const c = (...args) => color(...args);

  let port = process.env.NODE_API_PORT;
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

    console.log(c(`\n ${NODE_ENV}: http://${host}${port}/index.html`, `BgBlue`));
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

export default {
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
            loader: "babel-loader",
            // options: { // no need for all of that, just create babel.config.cjs and control babel from there
            // babel.config.cjs is better than .babelrc because you can comment in it
            //   // babelrc: false,
            //   presets: ["@babel/preset-env", "@babel/preset-react"],
            // },
          },
        ],
      },
      {
        test: /\.s?[ac]ss$/i,
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
          // "postcss-loader", // look into postcss.config.js file
          {
            loader: "postcss-loader",
            // options: {
            //   postcssOptions: {
            //     plugins: [
            //       [
            //         "postcss-preset-env",
            //         {
            //           // Options
            //         },
            //       ],
            //     ],
            //   },
            // },
          },
          // "sass-loader", // https://webpack.js.org/loaders/sass-loader/#root

          {
            loader: "sass-loader",
            // options: {
            //   // Prefer `dart-sass`
            //   implementation: sass,
            // },
          },
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
    new MiniCssExtractPlugin({
      // based on: https://www.youtube.com/watch?v=kcQAxsl9N-o&ab_channel=HowToCode
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
  stats: {
    colors: false,
  },
  target: "browserslist", // https://webpack.js.org/configuration/target/#browserslist
  // basically once target=browserslist webpack will look for file .browserslistrc
};

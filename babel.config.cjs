module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        exclude: ["transform-regenerator", "transform-async-to-generator"], // https://github.com/scalableminds/webknossos/issues/2737
      },
    ],
    "@babel/preset-react",
  ],
};

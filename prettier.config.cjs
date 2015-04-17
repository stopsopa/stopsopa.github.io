module.exports = {
  printWidth: 120,
  overrides: [
    {
      files: "*.svg", // https://stopsopa.github.io/pages/node/index.html#prettier-setup
      options: {
        parser: "html",
      },
    },
  ],
};

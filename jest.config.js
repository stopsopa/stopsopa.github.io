// export default {
//   verbose: true,
//   bail: true,
//   collectCoverage: true,
//   coverageDirectory: "public/coverage",
//   moduleFileExtensions: ["ts", "js", "jsx"],
//   testPathIgnorePatterns: ["./node_modules/"],
//   coverageDirectory: "coverage",
//   coverageReporters: ["html"],
//   testMatch: ["pages/**/*.test.js"],
//   // "coverageReporters": [
//   //   "html",
//   //   "lcov",
//   //   "text"
//   // ],
//   collectCoverageFrom: ["pages/**/*.{js,jsx,tsx}"],
// };

export default {
  verbose: true,
  bail: true,
  collectCoverage: true,
  // Specify the directory where Jest should look for test files.
  testMatch: ["<rootDir>/pages/**/*.test.js"],

  // Specify the directory from which Jest should collect coverage.
  collectCoverageFrom: ["<rootDir>/pages/**/*.js"],

  // Specify the directories to ignore during coverage collection.
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/pages/portsregistry/lists/stoutZero_commonly-used-ports/",
    "pages/bookmarklets",
    "/pages/portsregistry/",
  ],

  // Specify the directory where Jest should output coverage reports in 'html' mode.
  coverageDirectory: "<rootDir>/pages/coverage",

  // Specify the coverage report format as 'html'.
  coverageReporters: ["html"],

  // Other Jest configuration options can go here.
};

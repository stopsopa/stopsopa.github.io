/**
 * from: https://gist.github.com/stoutZero/15d334dea71a604cade777dee2f7a9e5
 */

const list = require("./commonly-used-ports.json");

const uniq = require("lodash/uniq");

module.exports = () => {
  return uniq(list.map((o) => o.port));
};

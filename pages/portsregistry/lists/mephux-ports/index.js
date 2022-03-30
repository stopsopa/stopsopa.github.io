/**
 * from: https://github.com/mephux/ports.json/blob/master/ports.lists.json
 */

const list = require("./ports.lists.json");

const uniq = require("lodash/uniq");

module.exports = () => {
  return uniq(Object.keys(list));
};

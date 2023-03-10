/**
 * from: https://github.com/mephux/ports.json/blob/master/ports.lists.json
 */

import list from "./ports.lists.json" assert { type: "json" };

import uniq from "lodash/uniq.js";

export default () => {
  return uniq(Object.keys(list));
};

/**
 * from: https://gist.github.com/stoutZero/15d334dea71a604cade777dee2f7a9e5
 */

import list from "./commonly-used-ports.json" assert { type: "json" };

import uniq from "lodash/uniq.js";

export default () => {
  return uniq(list.map((o) => o.port));
};

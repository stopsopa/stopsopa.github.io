/**
 * from: https://github.com/mephux/ports.json/blob/master/ports.lists.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const list = JSON.parse(fs.readFileSync(path.resolve(__dirname, "ports.lists.json"), "utf-8"));

import uniq from "lodash/uniq.js";

export default () => {
  return uniq(Object.keys(list));
};

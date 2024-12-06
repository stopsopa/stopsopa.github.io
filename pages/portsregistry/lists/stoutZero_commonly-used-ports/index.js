/**
 * from: https://gist.github.com/stoutZero/15d334dea71a604cade777dee2f7a9e5
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const list = JSON.parse(fs.readFileSync(path.resolve(__dirname, "commonly-used-ports.json"), "utf-8"));

import uniq from "lodash/uniq.js";

export default () => {
  return uniq(list.map((o) => o.port));
};

import fs from "fs";

import path from "path";

import gg from "../generatePort.js";

import mephux from "./mephux-ports/index.js";

import stoutZero from "./stoutZero_commonly-used-ports/index.js";

import web_mit_edu from "./web_mit_edu/index.js";

import www_iana_org from "./www_iana_org/index.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const g = gg();

g.addList(mephux());
g.addList(stoutZero());
g.addList(web_mit_edu());
g.addList(www_iana_org());

const file = path.resolve(__dirname, "ports-generated.json");

fs.writeFileSync(file, JSON.stringify(g.getList(), null, 4));

console.log(`file: ${file} genereated with ${g.getList().length} unique ports`);

const path = require("path");

const fs = require("fs");

const gg = require("../generatePort");

const g = gg();

g.addList(require("./mephux-ports")());
g.addList(require("./stoutZero_commonly-used-ports")());
g.addList(require("./web_mit_edu")());
g.addList(require("./www_iana_org")());

const file = path.resolve(__dirname, "ports-generated.json");

fs.writeFileSync(file, JSON.stringify(g.getList(), null, 4));

console.log(`file: ${file} genereated with ${g.getList().length} unique ports`);

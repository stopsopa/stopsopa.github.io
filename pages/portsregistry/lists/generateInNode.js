
const path = require('path')

const fs = require('fs');

const gg = require('../generatePort');

const g = gg();

g.addList(require('./mephux-ports')());
g.addList(require('./stoutZero_commonly-used-ports')());

const file = path.resolve(__dirname, 'ports-generated.json');

fs.writeFileSync(file, JSON.stringify(g.getList()));

console.log(`file: ${file} genereated with ${g.getList().length} unique ports`);



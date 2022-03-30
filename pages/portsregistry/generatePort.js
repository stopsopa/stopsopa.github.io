const uniq = require("lodash/uniq");

const reg = /^\d+$/;

module.exports = () => {
  let list = [0];

  const tool = (port) => {
    if (!reg.test(port)) {
      port = 3000;
    }

    while (!tool.isFree(port)) {
      port += 1;
    }

    return port;
  };

  tool.getList = () => list;

  tool.addList = (nlist) => {
    if (!Array.isArray(nlist)) {
      throw new Error(`generatePort->addList() error: Provided list is not an array`);
    }

    list = uniq(list.concat(nlist.map((d) => parseInt(d, 10)).filter(Boolean)));

    list.sort((a, b) => {
      if (a === b) {
        return 0;
      }

      return a > b ? 1 : -1;
    });
  };

  tool.isFree = (port) => {
    port = parseInt(port, 10);

    if (port < 0) {
      throw new Error(`generatePort->isFree() error: port < 0, port '${port}'`);
    }

    return !list.includes(port);
  };

  return tool;
};

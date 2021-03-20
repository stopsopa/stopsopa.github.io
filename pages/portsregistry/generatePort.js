
const uniq = require('lodash/uniq');

module.exports = () => {

  let list = [
    0
  ];

  const tool = () => {



  }

  tool.getList = () => list;

  tool.addList = nlist => {

    if ( ! Array.isArray(nlist) ) {

      throw new Error(`generatePort->addList() error: Provided list is not an array`)
    }

    list = uniq(list.concat(nlist.map(d => parseInt(d, 10)).filter(Boolean)));
  }

  tool.isFree = port => {

    port = parseInt(port, 10);

    if ( port < 0 ) {

      throw new Error(`generatePort->isFree() error: port < 0, port '${port}'`)
    }

    return ! list.includes(port);
  }

  return tool;
}
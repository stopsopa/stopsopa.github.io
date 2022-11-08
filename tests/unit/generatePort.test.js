const generatePort = require("../../pages/portsregistry/generatePort");

const json = require("./generatePort.json");

const log = require("inspc");

describe("generatePort", () => {
  it("list", (done) => {
    const generate = generatePort();

    generate.addList([6, 7, 8]);
    generate.addList([7, "8", 9]);
    generate.addList([9, 10, "11"]);

    // console.log(JSON.stringify(generate.getList(), null, 4))

    expect(generate.getList()).toEqual([0, 6, 7, 8, 9, 10, 11]);

    done();
  });

  it("json", (done) => {
    const generate = generatePort();

    generate.addList([6, 7, 8]);
    generate.addList([7, "8", 9]);
    generate.addList([9, 10, "11"]);
    generate.addList(Object.keys(json));

    // console.log(JSON.stringify(generate.getList(), null, 4));

    expect(generate.getList()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

    done();
  });

  it("count", (done) => {
    const generate = generatePort();

    generate.addList(require("../../pages/portsregistry/lists/ports-generated.json"));

    // console.log(JSON.stringify(generate.getList().length, null, 4));

    expect(generate.getList().length).toEqual(10216);

    done();
  });

  it("generate", (done) => {
    const generate = generatePort();

    generate.addList(require("../../pages/portsregistry/lists/ports-generated.json"));

    generate.addList([3000, 3004]);

    const list = (function () {
      const list = [];

      for (let i = 0, t; i < 8; i += 1) {
        t = generate();

        generate.addList([t]);

        list.push(t);
      }

      return list;
    })();

    // console.log(JSON.stringify(list, null, 4));

    expect(list).toEqual([3324, 3325, 3368, 3369, 3370, 3371, 4202, 4203]);

    done();
  });
});

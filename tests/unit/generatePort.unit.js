import generatePort from "../../pages/portsregistry/generatePort.js";

import json from "./generatePort.json";

import ports from "../../pages/portsregistry/lists/ports-generated.json";

describe("generatePort", () => {
  it("list", async () => {
    const generate = generatePort();

    generate.addList([6, 7, 8]);
    generate.addList([7, "8", 9]);
    generate.addList([9, 10, "11"]);

    // console.log(JSON.stringify(generate.getList(), null, 4))

    expect(generate.getList()).toEqual([0, 6, 7, 8, 9, 10, 11]);
  });

  it("json", async () => {
    const generate = generatePort();

    generate.addList([6, 7, 8]);
    generate.addList([7, "8", 9]);
    generate.addList([9, 10, "11"]);
    generate.addList(Object.keys(json));

    // console.log(JSON.stringify(generate.getList(), null, 4));

    expect(generate.getList()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it("count", async () => {
    const generate = generatePort();

    generate.addList(structuredClone(ports));

    // console.log(JSON.stringify(generate.getList().length, null, 4));

    expect(generate.getList().length).toEqual(10216);
  });

  it("generate", async () => {
    const generate = generatePort();

    generate.addList(structuredClone(ports));

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
  });
});

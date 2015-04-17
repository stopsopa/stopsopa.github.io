import range from "./range";

import log from "inspc";

describe("range", () => {
  it("not processed", (done) => {
    const input = `abc`;

    const output = range({
      str: input,
      zeroIndexed: 4,
      length: 4,
      test: true,
    });

    const expected = "abc";

    expect(output).toEqual(expected);

    done();
  });
  it("processed 2", (done) => {
    const input = `abc`;

    const output = range({
      str: input,
      zeroIndexed: 4,
      length: 9,
      test: true,
    });

    const expected = "7 abc";

    expect(output).toEqual(expected);

    done();
  });
  it("processed 3", (done) => {
    const input = `abc`;

    const output = range({
      str: input,
      zeroIndexed: 8,
      length: 9,
      test: true,
    });

    const expected = "0 abc";

    expect(output).toEqual(expected);

    done();
  });
  it("processed 4", (done) => {
    const input = `abc`;

    const output = range({
      str: input,
      zeroIndexed: 4,
      length: 9,
      test: true,
    });

    const expected = "7 abc";

    // console.log(JSON.stringify(output, null, 4));

    expect(output).toEqual(expected);

    done();
  });
});

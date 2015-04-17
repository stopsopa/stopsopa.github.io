import sortObjectNested from "./sortObjectNested";

describe("sortObjectNested", () => {
  it("simple object - no need for sorting", (done) => {
    const data = {
      abc: "def",
      efg: "hij",
      klm: "nop",
    };

    const result = sortObjectNested(data);

    const expected = {
      abc: "def",
      efg: "hij",
      klm: "nop",
    };

    expect(result).toEqual(expected);

    done();
  });

  it("simple object - sorting needed", (done) => {
    const data = {
      klm: "nop",
      abc: "def",
      efg: "hij",
    };

    const result = sortObjectNested(data);

    const expected = {
      abc: "def",
      efg: "hij",
      klm: "nop",
    };

    expect(result).toEqual(expected);

    done();
  });

  it("simple object in array with other primitives around - sorting needed", (done) => {
    const data = [
      [{ a: "b", z: "zval", b: "c" }],
      "test",
      {
        klm: "nop",
        abc: "def",
        efg: "hij",
      },
      [7, 6, 5],
    ];

    const result = sortObjectNested(data);

    const expected = [
      [
        {
          a: "b",
          b: "c",
          z: "zval",
        },
      ],
      "test",
      {
        abc: "def",
        efg: "hij",
        klm: "nop",
      },
      [7, 6, 5],
    ];

    expect(result).toEqual(expected);

    done();
  });

  it("nested", (done) => {
    const data = [
      "start",
      {
        klm: "nop",
        abc: "def",
        obj: {
          dabc: "def",
          zefg: "hij",
          cklm: "nop",
        },
        efg: "hij",
      },
      7,
    ];

    const result = sortObjectNested(data);

    const expected = [
      "start",
      {
        abc: "def",
        efg: "hij",
        klm: "nop",
        obj: {
          dabc: "def",
          zefg: "hij",
          cklm: "nop",
        },
      },
      7,
    ];

    expect(result).toEqual(expected);

    done();
  });
});

"use strict";

try {
  jest.setTimeout(100);
} catch (e) {}

function add(a, b) {
  return a + b;
}

it("get - ABC -> DEF", async () => {
  const result = add(1, 2);

  expect(result).toEqual(3);
});

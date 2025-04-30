/**
 * node --experimental-strip-types pages/typescript/node/tstest.ts
 */

// import lib, { lib2 } from "./lib"; // this will fail
import lib, { lib2 } from "./lib.js"; // this one is fine
// urlwizzard.schema://urlwizzard.hostnegotiated/viewer.html?file=%2Fpages%2Ftypescript%2Fnode%2Flib.ts

function add(a: number, b: number): number {
  return a + b;
}

function libs() {
  const l1 = lib("l1");
  const l2 = lib2("l2");
  return `libs: [${l1}] [${l2}]`;
}

console.log(add(1, 2)); // 3
console.log(libs()); // libs: [lib: >l1<] [lib2: >l2<]

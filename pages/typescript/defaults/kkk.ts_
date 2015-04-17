import ts from "typescript";

console.log("TS", ts.version);
console.log(typeof ts.optionDeclarations);
console.log(Array.isArray(ts.optionDeclarations));
console.log(Object.prototype.toString.call(ts.optionDeclarations));

if (ts.optionDeclarations) {
  console.log(
    Reflect.ownKeys(ts.optionDeclarations).slice(0, 20)
  );
}
/**
 * node --experimental-transform-types pages/typescript/node/transform-types.ts
 * https://www.typescriptlang.org/play/?#code/KYOwrgtgBAsgngUXNA3gKClAggGg1AITwF80BjAexAGcKAbYAOjooHMAKAA1EigAcK1AJYAXIVUIA+ACQp4SSIwLEAPJwCUAbiA
 */

enum MyEnum {
  A,
  B,
}
console.log(`enum position B>${MyEnum.B}<`);

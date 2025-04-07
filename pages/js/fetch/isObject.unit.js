//                                                                  isObject      lodash/isObject
//  ✓isObject - {}                                                  -> true             -> true
//  ✓isObject - Object.create(null)                                 -> true             -> true
//  ✓isObject - using with object that have implemented toString()  -> true             -> true
//  ✓isObject - extended object                                     -> true             -> true
//  ✓isObject - new function () {}                                  -> true             -> true
//  ✓isObject - []                                                  -> false            -> true
//  ✓isObject - function () {}                                      -> false            -> true
//  ✓isObject - async function () {}                                -> false            -> true
//  ✓isObject - () => {}                                            -> false            -> true
//  ✓isObject - true                                                -> false            -> false
//  ✓isObject - false                                               -> false            -> false
//  ✓isObject - NaN                                                 -> false            -> false
//  ✓isObject - undefined                                           -> false            -> false
//  ✓isObject - no arg                                              -> false            -> false
//  ✓isObject - 4                                                   -> false            -> false
//  ✓isObject - string                                              -> false            -> false
//  ✓isObject - Symbol('test')                                      -> false            -> false
//  ✓isObject - new Date()                                          -> false            -> true
//  ✓isObject - new Map()                                           -> false            -> true
//  ✓isObject - new Set()                                           -> false            -> true
//  ✓isObject - new Error()                                         -> false            -> true

// const isObjectLo = require('lodash/isObject');
import isObjectLo from "lodash/isObject";

// Cu -> custom
// const isObjectCu = require('./isObject');
import isObjectCu from "./isObject.js";

it("lodash.isObject - {}                                                    -> true  -> true", () => {
  expect(isObjectCu({})).toBeTruthy();
  expect(isObjectLo({})).toBeTruthy();
});

it("lodash.isObject - Plain object                                          -> true  -> true", () => {
  expect(isObjectCu(Object.create(null))).toBeTruthy();
  expect(isObjectLo(Object.create(null))).toBeTruthy();
});

it("lodash.isObject - new function () {}                                    -> true  -> true", () => {
  expect(isObjectCu(new (function () {})())).toBeTruthy();
  expect(isObjectLo(new (function () {})())).toBeTruthy();
});

it("lodash.isObject - using with object that have implemented toString()    -> true  -> true", async () => {
  var k = function () {};
  k.prototype.toString = function () {
    return "test...";
  };

  var t = new k();

  expect(t + "").toEqual("test...");

  expect(isObjectCu(t)).toBeTruthy();
  expect(isObjectLo(t)).toBeTruthy();
});

it("lodash.isObject - extended object                                       -> true  -> true", async () => {
  var a = function () {};

  var b = function () {};

  b.prototype = Object.create(a.prototype);

  b.prototype.constructor = b;

  expect(isObjectCu(new b())).toBeTruthy();
  expect(isObjectLo(new b())).toBeTruthy();
});

it("lodash.isObject - []                                                    -> false -> true", () => {
  expect(isObjectCu([])).toBeFalsy();
  expect(isObjectLo([])).toBeTruthy();
});

it("lodash.isObject - null                                                  -> false -> false", () => {
  expect(isObjectCu(null)).toBeFalsy();
  expect(isObjectLo(null)).toBeFalsy();
});

it("lodash.isObject - function () {}                                        -> false -> true", () => {
  expect(isObjectCu(function () {})).toBeFalsy();
  expect(isObjectLo(function () {})).toBeTruthy();
});

it("lodash.isObject - async function () {}                                  -> false -> true", () => {
  expect(isObjectCu(async function () {})).toBeFalsy();
  expect(isObjectLo(async function () {})).toBeTruthy();
});

it("lodash.isObject - () => {}                                              -> false -> true", () => {
  expect(isObjectCu(() => {})).toBeFalsy();
  expect(isObjectLo(() => {})).toBeTruthy();
});

it("lodash.isObject - true                                                  -> false -> false", () => {
  expect(isObjectCu(true)).toBeFalsy();
  expect(isObjectLo(true)).toBeFalsy();
});

it("lodash.isObject - false                                                 -> false -> false", () => {
  expect(isObjectCu(false)).toBeFalsy();
  expect(isObjectLo(false)).toBeFalsy();
});

it("lodash.isObject - NaN                                                   -> false -> false", () => {
  expect(isObjectCu(NaN)).toBeFalsy();
  expect(isObjectLo(NaN)).toBeFalsy();
});

it("lodash.isObject - undefined                                             -> false -> false", () => {
  expect(isObjectCu(undefined)).toBeFalsy();
  expect(isObjectLo(undefined)).toBeFalsy();
});

it("lodash.isObject - no arg                                                -> false -> false", () => {
  expect(isObjectCu()).toBeFalsy();
  expect(isObjectLo()).toBeFalsy();
});

it("lodash.isObject - 4                                                     -> false -> false", () => {
  expect(isObjectCu(4)).toBeFalsy();
  expect(isObjectLo(4)).toBeFalsy();
});

it("lodash.isObject - string                                                -> false -> false", () => {
  expect(isObjectCu("test")).toBeFalsy();
  expect(isObjectLo("test")).toBeFalsy();
});

it("lodash.isObject - Symbol('test')                                        -> false -> false", () => {
  expect(isObjectCu(Symbol("test"))).toBeFalsy();
  expect(isObjectLo(Symbol("test"))).toBeFalsy();
});

it("lodash.isObject - new Date()                                            -> false -> true", () => {
  expect(isObjectCu(new Date())).toBeFalsy();
  expect(isObjectLo(new Date())).toBeTruthy();
});

it("lodash.isObject - new Map()                                             -> false -> true", () => {
  expect(isObjectCu(new Map())).toBeFalsy();
  expect(isObjectLo(new Map())).toBeTruthy();
});

it("lodash.isObject - new Set()                                             -> false -> true", () => {
  expect(isObjectCu(new Set())).toBeFalsy();
  expect(isObjectLo(new Set())).toBeTruthy();
});

it("lodash.isObject - new Error()                                           -> false -> true", () => {
  expect(isObjectCu(new Error())).toBeFalsy();
  expect(isObjectLo(new Error())).toBeTruthy();
});

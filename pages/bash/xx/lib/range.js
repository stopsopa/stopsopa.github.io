import easingLib, { exist, getKeys, mirror } from "../../../../libs/easing.js";

const FIRST_LENGTH_WHEN_ENABLED = 8;

// █	U+2588	FULL BLOCK
// ▉	U+2589	LEFT SEVEN EIGHTHS BLOCK
// ▊	U+258A	LEFT THREE QUARTERS BLOCK
// ▋	U+258B	LEFT FIVE EIGHTHS BLOCK
// ▌	U+258C	LEFT HALF BLOCK
// ▍	U+258D	LEFT THREE EIGHTHS BLOCK
// ▎	U+258E	LEFT ONE QUARTER BLOCK
// ▏	U+258F	LEFT ONE EIGHTH BLOCK
// from: https://github.com/hackerb9/ugrep
// ugrep block

const blocks = ["█", "▉", "▊", "▋", "▌", "▍", "▎", "▏"];
const tlocks = ["0", "1", "2", "3", "4", "5", "6", "7"];

const th = (msg) => new Error(`xx/lib/range.js error: ${msg}`);

export default (opt) => {
  const { length, zeroIndexed, str, test, easing = "easeOutExpo", firstLengthWhenEnabled } = opt;

  const zeroIndexedLenth = length - 1;

  if (!/^\d+$/.test(zeroIndexedLenth)) {
    throw th(`zeroIndexedLenth is not a number`);
  }

  if (!/^\d+$/.test(zeroIndexed)) {
    throw th(`zeroIndexed is not a number`);
  }

  if (typeof str !== "string") {
    throw th(`str is not a string`);
  }

  if (!exist(easing)) {
    throw th(`easing >${easing}< function is not on the list of ${getKeys().join(" ")}`);
  }

  let block = structuredClone(blocks);

  if (test) {
    block = structuredClone(tlocks);
  }

  let flwe = FIRST_LENGTH_WHEN_ENABLED;

  if (/^\d+$/.test(firstLengthWhenEnabled) && firstLengthWhenEnabled >= 0) {
    flwe = firstLengthWhenEnabled;
  }

  if (flwe < 2) {
    flwe = 2;
  }

  if (length < flwe) {
    return str;
  }

  const ratio = zeroIndexed / zeroIndexedLenth;

  let easingRatio = mirror(ratio, easingLib[easing]);

  if (easingRatio < 0) {
    easingRatio = 0;
  }

  if (easingRatio >= 1) {
    easingRatio = 0.99999;
  }

  const result = Math.floor(block.length * easingRatio);

  return `${block[result]} ${str}`;
};

export const getEasingKeys = () => getKeys();

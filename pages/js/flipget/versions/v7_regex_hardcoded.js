const fullMap = {
  ' ': '.', '.': ' ',
  '"': '!', '!': '"',
  ':': '-', '-': ':',
  '{': '(', '(': '{',
  '}': ')', ')': '}',
  '?': '_', '_': '?',
  '&': '~', '~': '&',
  ',': '*', '*': ','
};

const re = /[ ."!:\-{}()?&_*,~]/g;

function flipget(str) {
  return str.replace(re, ch => fullMap[ch]);
}

export default flipget;

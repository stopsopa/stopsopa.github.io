const map = {
  ' ': '.',
  '"': '!',
  ':': '-',
  '{': '(',
  '}': ')',
  '?': '_',
  '&': '~',
  ',': '*'
};

// build reverse map once
const reverseMap = Object.fromEntries(
  Object.entries(map).map(([k, v]) => [v, k])
);

// combine both directions
const fullMap = { ...map, ...reverseMap };

// precompile regex once
// Added hyphen escape so it doesn't create an invalid range like `:-{`
const safeKeys = Object.keys(fullMap).join('').replace('-', '\\-');
const re = new RegExp(`[${safeKeys}]`, 'g');

function flipget(str) {
  return str.replace(re, ch => fullMap[ch]);
}

export default flipget;

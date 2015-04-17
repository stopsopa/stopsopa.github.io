/*
# extract id from url
# https://www.youtube.com/watch?v=_p2NvO6KrBs&list=PLevh6iJsj6uUg6KJtFjyu0hiyHJ9UsQwm&index=112
# or
# https://youtu.be/_p2NvO6KrBs
*/

const arg = process.argv[2];

if (typeof arg !== "string") {
  console.error("arg is not a string");

  process.exit(1);
}

const reg = /^[A-Za-z0-9_-]+$/g;

if (reg.test(arg)) {
  process.stdout.write(arg);

  process.exit(0);
}

// use URL constructor to parse url
const url = new URL(arg);

// extract id from url
let v = url.searchParams.get("v");

if (v === null) {
  // handle case: https://youtu.be/_p2NvO6KrBs
  v = trim(url.pathname, "/ ");
}

if (typeof v !== "string" || trim(v).length === 0) {
  console.error(`id >${v}< is not a valid youtube id`);

  process.exit(1);
}

if (!reg.test(v)) {
  console.error(`id >${v}< doesn't match ${reg}`);

  process.exit(1);
}

process.stdout.write(v);

/*!
 * @version 1.0 - 2013-05-21
 * @author Szymon Działowski
 * direction : 'rl'|'r'|'l'   -->   (undefined => 'rl')
 * charlist  : (undefined => " \n")
 */
function trim(string, charlist, direction) {
  direction = direction || "rl";
  charlist = (charlist || "").replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  charlist = charlist || " \\n";
  direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + charlist + "]*$", "gm"), "$1"));
  direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + charlist + "]*(.*)$", "gm"), "$1"));
  return string;
}

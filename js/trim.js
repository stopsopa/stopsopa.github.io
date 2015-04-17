export default function trim(string, charlist, direction) {
  direction = direction || "rl";
  charlist = (charlist || "").replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  charlist = charlist || " \\n";
  direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + charlist + "]*$", "gm"), "$1"));
  direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + charlist + "]*(.*)$", "gm"), "$1"));
  return string;
}

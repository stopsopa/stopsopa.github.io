import trim from "./trim.js";

export default function slug(str) {
  return trim(
    str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/--+/g, "-"),
    "-"
  );
}

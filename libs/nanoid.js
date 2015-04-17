export default function nanoid(l) {
  if (!Number.isInteger(l) || l < 1) {
    throw new Error(`nanoid error: length is incorrect: ${l}`);
  }

  return crypto
    .getRandomValues(new Uint8Array(l))
    .reduce(
      (t, e) =>
        (t += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e > 62 ? "-" : "_"),
      ""
    );
}

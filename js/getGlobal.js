export default function getGlobal() {
  try {
    if (typeof window !== "undefined") {
      return window;
    }
  } catch (e) {
    e;
  }
  try {
    if (typeof global !== "undefined") {
      return global;
    }
  } catch (e) {
    e;
  }
  throw new Error(`getGlobal error: can't find global`);
}

// This script intercepts process.emit to silence the "Transform Types" experimental warning.
const originalEmit = process.emit;
process.emit = function (name, data) {
  if (
    name === "warning" &&
    data &&
    ((data.name === "ExperimentalWarning" && data.message.includes("Transform Types")) ||
      (typeof data === "string" && data.includes("Transform Types")))
  ) {
    return false;
  }
  return originalEmit.apply(this, arguments);
};

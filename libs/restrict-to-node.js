/**
 * use:
 *
 * require('libs/restrict-to-node')(__filename);
 */

export default (file) => {
  if (!file) {
    throw `restrict-to-node: file parameter not specified`;
  }

  const node = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";

  if (!node) {
    const msg = `\n\n\n${file} is included in web bundle\n\n\n`;

    window.addEventListener("DOMContentLoaded", () => setTimeout(() => document.write(msg), 500));

    alert(msg);

    throw msg;
  }
};

export default () => {
  return new Promise((resolve) => {
    (function repeat() {
      const exist = (function () {
        try {
          return typeof window.ace.edit === "function";
        } catch (e) {}

        return false;
      })();

      if (exist) {
        // console.log("ace defined");

        resolve(window.ace);
      } else {
        // console.log("ace not defined");
        setTimeout(repeat, 100);
      }
    })();
  });
};

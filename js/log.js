const log = (function () {
  try {
    return console.log;
  } catch (e) {
    return function () {};
  }
})();

/**
 * Adding methods:
 * log.green()
 * log.red()
 * ...
 * and so on to window.log
 */
(function () {
  // https://stackoverflow.com/a/13017382

  log.c = function () {
    var a = Array.prototype.slice.call(arguments);

    a[a.length - 1] += " ";

    a = a.concat(["background: #3B4045; color: white"]);

    a[0] = "%c " + a[0];

    log.apply(log, a);
  };

  function define(color) {
    return function define() {
      var a = Array.prototype.slice.call(arguments);

      var l = a.length;

      var tmp = "";

      var buff = [];

      for (var i = 0; i < l; i += 1) {
        if (i === 0) {
          tmp += "%c " + a[i] + " ";

          buff.push(color);
        } else {
          buff.push(a[i]);
        }
      }

      tmp && buff.unshift(tmp);

      log.apply(log, buff);
    };
  }

  Object.entries({
    red: "background: #C90000; color: white",
    orange: "background: #c87037; color: white",
    green: "background: #00B700; color: white",
    blue: "background: #2CA5E0; color: white",
    gray: "background: #3B4045; color: white",
    yellow: "background: #ffe686; color: black",
  }).map(function (entry) {
    log[entry[0]] = define(entry[1]);
  });

  /* now use
  
      log.red('abc')
      log.green('abc')
      log.blue('abc')
      log.gray('abc')
  
       */

  log.green("defined", "log & log[red|green|blue|gray]");
})();

export default log;

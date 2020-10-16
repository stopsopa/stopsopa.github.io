
(function () {
  try {

    window.async.permalink.then(function () {

      window.mountpermalink();

      window.toc();
    });
  }
  catch (e) {
    log.red('domcontentloaded', e);
  }
}());

window.async.triggers.domcontentloaded();
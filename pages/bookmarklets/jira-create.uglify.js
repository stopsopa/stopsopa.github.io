/**
 * Jira create ticket - script to widen "Project" dropdown
 * https://stopsopa.github.io/pages/bookmarklets/index.html#jira-create-ticket-script-to-widen-project-dropdown
 */
(function () {
  var log = (function () {
    try {
      return console.log;
    } catch (e) {
      return function () {};
    }
  })();

  var find = function (selector, parent) {
    if (!parent) {
      parent = document;
    }

    var tmp = parent.querySelector(selector);

    if (!tmp) {
      throw new Error("cant find element by selector: " + selector);
    }

    return tmp;
  };

  function box(content, opt) {
    if (!opt) {
      opt = {};
    }

    var div = document.createElement("div");

    const style = {
      position: "fixed",
      zIndex: "10000000",
      top: "20%",
      left: "50%",
      border: "1px solid gray",
      backgroundColor: "white",
      transform: "translate(-50%, -50%)",
      padding: "10px",
      cursor: "pointer",
    };

    Object.assign(
      div.style,
      Object.entries(Object.assign({}, style, opt.style)).reduce((acc, [key, val]) => {
        if (val !== false) acc[key] = val;
        return acc;
      }, {})
    );

    div.innerHTML = String(content);

    document.body.appendChild(div);

    var close = function () {
      document.body.removeChild(div);
    };

    if (opt.autoclose) {
      setTimeout(close, Number.isInteger(opt.autoclose) ? opt.autoclose : 1000);
    } else {
      div.addEventListener("click", close);
    }

    typeof opt.fn === "function" && opt.fn(div);
  }

  try {
    var doc = find("#project-field");

    doc.style.maxWidth = "none";

    var parent = doc.parentNode;

    parent.style.maxWidth = "none";

    box("All good", { autoclose: 200 });
  } catch (e) {
    box(e, { style: { minHeight: "200" } });
  }
})();

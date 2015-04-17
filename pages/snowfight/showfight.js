window.SnowFight = (function () {
  var isIe = false;

  // const isIe /* doesn't include edge */ = (function () {
  //   // https://github.com/lancedikson/bowser
  //
  //   const b = browser.detect();
  //
  //   // console.log(`The current browser name is "${browser.getBrowserName()}"`);
  //   //
  //   // log(JSON.stringify(browser.parse(), null, 4));
  //   //
  //   // return b.satisfies({
  //   //     windows: {
  //   //         "internet explorer": ">6",
  //   //     },
  //   // });
  //
  //   return b.name == 'ie';
  // }());

  function style(element, style) {
    if (isIe) {
      element.textContent += style;
    } else {
      element.innerHTML += style;
    }
  }

  var xml = "http://www.w3.org/2000/svg";

  var viewBoxX = 1000;
  var viewBoxY = 540;

  var log = (function () {
    try {
      return console.log;
    } catch (e) {
      return function () {};
    }
  })();

  var manipulation = (function () {
    var domCache = document.createElement("div");

    function trim(string, charlist, direction) {
      direction = direction || "rl";
      charlist = (charlist || "").replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      charlist = charlist || " \\n";
      direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + charlist + "]*$", "gm"), "$1"));
      direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + charlist + "]*(.*)$", "gm"), "$1"));
      return string;
    }

    return {
      after: function (referenceNode, newNode) {
        return this.before(referenceNode.nextSibling, newNode);
      },
      before: function (referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
        return this;
      },
      append: function (parentNode, newNode) {
        parentNode.appendChild(newNode);
        return newNode;
      },
      prepend: function (parentNode, newNode) {
        parentNode.insertBefore(newNode, parentNode.firstChild);
        return this;
      },
      remove: function (node) {
        node.parentNode.removeChild(node);
        return this;
      },
      detach: function (element) {
        // detach element from DOM, to use it somewhere else
        this.append(domCache, element);
        return element;
      },
      empty: function (element) {
        element.innerHTML = "";
        return this;
      },
      children: function (parent) {
        try {
          // read also about
          // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
          // https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName  - undefined when #text node
          // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName
          return Array.prototype.slice.call(parent.childNodes);
        } catch (e) {
          throw new Error("manipulation.children() error: " + String(e));
        }
      },
    };
  })();

  function isElement(el) {
    return el instanceof Element;
  }

  function th(msg) {
    return "SnowFight.js error: " + String(msg);
  }
  /**
    var tetris = new SnowFight({
      fieldDiv: document.querySelector('.fieldDiv'),
      bricks: document.querySelector('.bricks'),
      brickHeight: 15,
      brickWidth: 15,
    })
   */
  const SnowFight = function (opt) {
    if (!(this instanceof SnowFight)) {
      return new SnowFight(opt);
    }

    this.opt = opt = Object.assign(
      {
        // target: document.querySelector('.field'),
        // imagesdir: '.'
      },
      opt
    );

    if (!isElement(opt.target)) {
      throw th("opt.target is not DOM element");
    }

    if (typeof opt.imagesdir !== "string") {
      throw th("opt.imagesdir is not a string");
    }

    const imagesdir = opt.imagesdir;

    // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10080 500">
    var svg = (this.svg = document.createElementNS(xml, "svg"));
    svg.setAttributeNS(null, "viewBox", ["0 0", viewBoxX, viewBoxY].join(" "));

    manipulation.append(opt.target, svg);

    this.adjustResize();

    // log('this.domW', this.domW, 'viewBoxX', viewBoxX)
    // log('this.domH', this.domH, 'viewBoxY', viewBoxY)

    function create(tag, opt) {
      var g = document.createElementNS(xml, tag);
      opt.cls && g.classList.add(opt.cls);
      opt.parent && manipulation.append(opt.parent, g);
      return g;
    }

    style(
      svg,
      `
  <defs>
    <pattern id="virus" patternUnits="objectBoundingBox" width="1" height="1">
        <image xlink:href="${imagesdir}/virus.svg" width="100" height="100" />
    </pattern>
    <pattern id="bricks" patternUnits="objectBoundingBox" width="1" height="1">
        <image xlink:href="${imagesdir}/bricks.svg" width="100" height="100" />
    </pattern>
    <pattern id="cart" patternUnits="objectBoundingBox" width="1" height="1">
        <image xlink:href="${imagesdir}/cart.svg" width="100" height="100" />
    </pattern>
  </defs>
`
    );

    this.style = create("style", { parent: svg });
    this.gdead = create("g", { cls: "gdead", parent: svg });
    this.gshadow = create("g", { cls: "gshadow", parent: svg });
    this.gthem = create("g", { cls: "gthem", parent: svg });
    this.gus = create("g", { cls: "gus", parent: svg });
    this.gballs = create("g", { cls: "gballs", parent: svg });

    style(
      this.style,
      `
    
`
    );

    this.img = {
      list: ["virus", "bricks", "cart"],
      i: 0,
    };

    // <rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
    const art1 = (this.art1 = document.createElementNS(xml, "rect"));
    art1.setAttributeNS(null, "fill", `url(#${this.img.list[this.img.i]})`);
    art1.setAttributeNS(null, "x", "-100");
    art1.setAttributeNS(null, "y", "-100");
    art1.setAttributeNS(null, "width", "100");
    art1.setAttributeNS(null, "height", "100");

    // <image href="firefox.jpg" x="0" y="0" height="50px" width="50px"/>
    // const art1 = this.art1 = document.createElementNS(xml, 'image');
    // art1.classList.add(this.img.list[this.img.i]);
    // art1.setAttributeNS(null, 'href', this.img.list[this.img.i]);

    // <circle cx="50" cy="50" r="50"/>
    // const art1 = this.art1 = document.createElementNS(xml, 'circle');
    // art1.setAttributeNS(null, 'cx', '-100');
    // art1.setAttributeNS(null, 'cy', '-100');
    // art1.setAttributeNS(null, 'r', '20');

    manipulation.append(this.gus, art1);
  };

  SnowFight.prototype.destroy = function () {
    manipulation.remove(this.svg);

    this.svg = false;
  };

  SnowFight.prototype.adjustResize = function () {
    if (this.svg) {
      var x = this.svg.getBoundingClientRect();

      this.domW = x.width;
      this.domH = x.height;
    }
  };

  SnowFight.prototype.pointerenter = function () {
    log("pointerenter");
  };
  SnowFight.prototype.pointerleave = function () {
    log("pointerleave");
  };
  SnowFight.prototype.pointermove = function (x, y) {
    log("pointermove");

    this.art1.setAttributeNS(null, "x", parseInt((x / this.domW) * viewBoxX, 10) - 100);
    this.art1.setAttributeNS(null, "y", parseInt((y / this.domH) * viewBoxY, 10) - 100);
  };
  SnowFight.prototype.pointerdown = function (x, y) {
    log("pointerdown", x, y);
  };
  SnowFight.prototype.pointerup = function () {
    this.img.i += 1;

    if (this.img.i >= this.img.list.length) {
      this.img.i = 0;
    }

    this.art1.setAttributeNS(null, "fill", `url(#${this.img.list[this.img.i]})`);
    log("pointerup");
  };

  SnowFight.log = log;

  return SnowFight;
})();

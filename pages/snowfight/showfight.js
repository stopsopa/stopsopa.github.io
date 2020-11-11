
window.SnowFight = (function () {

  var xml = "http://www.w3.org/2000/svg";

  var viewBoxX = 1000;
  var viewBoxY = 540

  var log=(function(){try{return console.log}catch(e){return function(){}}}());

  var manipulation = (function () {

    var domCache = document.createElement('div');

    function trim(string, charlist, direction) {
      direction = direction || 'rl';
      charlist  = (charlist || '').replace(/([.?*+^$[\]\\(){}|-])/g,'\\$1');
      charlist  = charlist || " \\n";
      (direction.indexOf('r')+1) && (string = string.replace(new RegExp('^(.*?)['+charlist+']*$','gm'),'$1'));
      (direction.indexOf('l')+1) && (string = string.replace(new RegExp('^['+charlist+']*(.*)$','gm'),'$1'));
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
      detach: function (element) { // detach element from DOM, to use it somewhere else
        this.append(domCache, element);
        return element;
      },
      empty: function (element) {
        element.innerHTML = '';
        return this;
      },
      children: function (parent) {
        try {
          // read also about
          // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
          // https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName  - undefined when #text node
          // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName
          return Array.prototype.slice.call(parent.childNodes)
        }
        catch (e) {

          throw new Error("manipulation.children() error: " + String(e));
        }
      },
    };
  }());

  function isElement(el) { return el instanceof Element };

  function th(msg) { return "SnowFight.js error: " + String(msg) };
  /**
    var tetris = new SnowFight({
      fieldDiv: document.querySelector('.fieldDiv'),
      bricks: document.querySelector('.bricks'),
      brickHeight: 15,
      brickWidth: 15,
    })
   */
  const SnowFight = function (opt) {

    if ( ! (this instanceof SnowFight) ) {

      return new SnowFight(opt);
    }

    this.opt = opt = Object.assign({
      // target: document.querySelector('.field'),
    }, opt);

    if ( ! isElement(opt.target) ) {

      throw th("opt.target is not DOM element");
    }

    // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10080 500">
    var svg = this.svg = document.createElementNS(xml, "svg");
    svg.setAttributeNS(null, 'viewBox', ['0 0', viewBoxX, viewBoxY].join(' '));

    manipulation.append(opt.target, svg);

    this.adjustResize();

    log('this.domW', this.domW, 'viewBoxX', viewBoxX)
    log('this.domH', this.domH, 'viewBoxY', viewBoxY)

    function createG(cls) {
      var g = document.createElementNS(xml, 'g');
      g.classList.add(cls);
      manipulation.append(svg, g);
      return g;
    }

    this.gshadow   = createG('gshadow');
    this.gthem     = createG('gthem');
    this.gus       = createG('gus');
    this.gballs    = createG('gballs');

    // <circle cx="50" cy="50" r="50"/>
    const circle = this.circle = document.createElementNS(xml, 'circle');
    circle.setAttributeNS(null, 'cx', '-100');
    circle.setAttributeNS(null, 'cy', '-100');
    circle.setAttributeNS(null, 'r', '20');

    manipulation.append(this.gus, circle);
  };

  SnowFight.prototype.destroy = function () {

    manipulation.remove(this.svg);

    this.svg = false;
  }

  SnowFight.prototype.adjustResize = function () {

    if (this.svg) {

      var x = this.svg.getBoundingClientRect();

      this.domW = x.width;
      this.domH = x.height;
    }
  }

  SnowFight.prototype.pointerenter = function () {
    log('pointerenter')
  }
  SnowFight.prototype.pointerleave = function () {
    log('pointerleave')
  }
  SnowFight.prototype.pointermove = function (x, y) {
    log('pointermove')

    this.circle.setAttributeNS(null, 'cx',
      parseInt((x / this.domW) * viewBoxX, 10)
    );
    this.circle.setAttributeNS(null, 'cy',
      parseInt((y / this.domH) * viewBoxY, 10)
    );
  }

  SnowFight.log = log;

  return SnowFight;
}());


window.Tetris = (function () {

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

  function th(msg) { return "Tetris.js error: " + String(msg) };

  function createOneBrick(parent, n) {
    var brick = document.createElement('div');
    n -= 1;
    if (n > 0) {
      createOneBrick(brick, n)
    }
    manipulation.append(parent, brick);
    return brick;
  }

  function clearSquare(square) {
    square.empty = true;
    square.t = false;
    square.b = false;
    square.l = false;
    square.r = false;
  }

  function clearRow(rowZeroIndex) {
    for ( var k = 0 ; k < opt.width ; k += 1 ) {
      clearSquare(this.board[rowZeroIndex][k])
    }
  }

  // Super rotation system
  // https://strategywiki.org/wiki/File:Tetris_rotation_super.png
  const tetrominoes = [
    [ // ████
      [
        [null],
        [true, true, true, true],
      ],
      [
        [null, null, true],
        [null, null, true],
        [null, null, true],
        [null, null, true],
      ],
      [
        [null],
        [null],
        [true, true, true, true],
      ],
      [
        [null, true],
        [null, true],
        [null, true],
        [null, true],
      ],
    ],
    [ // ▛ ▟
      [
        [true],
        [true, true, true],
      ],
      [
        [null, true, true],
        [null, true],
        [null, true],
      ],
      [
        [null],
        [true, true, true],
        [null, null, true],
      ],
      [
        [null, true],
        [null, true],
        [true, true],
      ],
    ],
    [ // ▙ ▜
      [
        [null, null, true],
        [true, true, true],
      ],
      [
        [null, true],
        [null, true],
        [null, true, true],
      ],
      [
        [null],
        [true, true, true],
        [true],
      ],
      [
        [true, true],
        [null, true],
        [null, true],
      ],
    ],
    [ // ░ ▒ ▓
      [
        [null, true, true],
        [null, true, true],
      ],
    ],
    [ //▗█▘
      [
        [null, true, true],
        [true, true],
      ],
      [
        [null, true],
        [null, true, true],
        [null, null, true],
      ],
      [
        [null],
        [null, true, true],
        [true, true],
      ],
      [
        [true],
        [true, true],
        [null, true],
      ],
    ],
    [ //▝█▖
      [
        [true, true],
        [null, true, true],
      ],
      [
        [null, null, true],
        [null, true, true],
        [null, true],
      ],
      [
        [null],
        [true, true],
        [null, true, true],
      ],
      [
        [null, true],
        [true, true],
        [true],
      ],
    ],
    [ //▗█▖
      [
        [null, true],
        [true, true, true],
      ],
      [
        [null, true],
        [null, true, true],
        [null, true],
      ],
      [
        [null],
        [true, true, true],
        [null, true],
      ],
      [
        [null, true],
        [true, true],
        [null, true],
      ],
    ],
  ];

  /**
    var tetris = new Tetris({
      board: document.querySelector('.board'),
      bricks: document.querySelector('.bricks'),
      brickHeight: 15,
      brickWidth: 15,
    })
   */
  const Tetris = function (opt) {

    if ( ! (this instanceof Tetris) ) {

      return new Tetris(opt);
    }

    this.opt = opt = Object.assign({
      // board: document.querySelector('.board'),
      // bricks: document.querySelector('.bricks'),
      width: 10,
      height: 20,
      brickHeight: 10,
      brickWidth: 10,
    }, opt);

    if ( ! isElement(opt.board) ) {

      throw th("opt.board is not DOM element");
    }

    if ( ! isElement(opt.bricks) ) {

      throw th("opt.bricks is not DOM element");
    }

    if ( ! Number.isInteger(opt.width) ) {

      throw th("opt.width is not an integer");
    }

    if ( ! Number.isInteger(opt.height) ) {

      throw th("opt.height is not an integer");
    }

    if ( opt.width < 8 ) {

      throw th("opt.width is smaller than 8 it is '" + opt.width + "'");
    }

    if ( opt.height < 16 ) {

      throw th("opt.height is smaller than 16 it is '" + opt.height + "'");
    }

    log('existing', this.opt.board.tetris);

    manipulation.empty(opt.board);

    this.board = [];

    for ( var i = 0 ; i < opt.height ; i += 1 ) {

      var t = [];

      for ( var k = 0 ; k < opt.width ; k += 1 ) {

        const square = {
          brick: createOneBrick(opt.board, 3),
        };

        clearSquare(square)

        t.push(square);
      }

      this.board.push(t);
    }

    this.setSize();

    opt.board.tetris = this;

    // keys

    this.keys = {};
  };

  Tetris.prototype.destroy = function () {

    delete this.opt.board.tetris;
  }

  Tetris.prototype.keyBind = function (key, fn, triggerEveryMs) {

    if (typeof key !== 'string') {

      throw th("keyBind, key is not a string");
    }

    key = trim(key);

    if ( ! key ) {

      throw th("keyBind, key is an empty string");
    }

    this.keyUnbind(key);

    if ( typeof fn !== 'function') {

      throw th("keyBind, fn is not a function");
    }

    if ( ! Number.isInteger(triggerEveryMs) || triggerEveryMs < 100 ) {

      log("WARNING: keyBind, triggerEveryMs < 100 or just wrong, set to default value 300");

      triggerEveryMs = 300;
    }

    this.keys[key] = {
      fn,
      triggered: false,
      handler: false,
      triggerEveryMs,
    };

    return this;
  }

  Tetris.prototype.keyUnbind = function (key) {

    if (typeof key !== 'string') {

      throw th("keyBind, key is not a string");
    }

    key = trim(key);

    try {

      clearInterval(this.keys[key].handler);
    }
    catch (e) {}

    if ( ! key ) {

      throw th("keyBind, key is an empty string");
    }

    delete this.keys[key];

    return this;
  }

  Tetris.prototype.keyDown = function (key) {

    // commented out due to optimization reasons
    // if (typeof key !== 'string') {
    //
    //   throw th("keyDown, key is not a string");
    // }
    //
    // key = trim(key);
    //
    // if ( ! key ) {
    //
    //   throw th("keyDown, key is an empty string");
    // }
    //
    if ( ! this.keys[key] ) {

      throw th("keyDown, key '" + key + "' first trigger keyBind()");
    }

    if ( this.keys[key].triggered ) {

      return this;
    }

    this.keys[key].triggered = true;

    this.keys[key].handler = setInterval(this.keys[key].fn, this.keys[key].triggerEveryMs);

    this.keys[key].fn();

    return this;
  }


  Tetris.prototype.keyUp = function (key) {

    // if (typeof key !== 'string') {
    //
    //   throw th("keyDown, key is not a string");
    // }
    //
    // key = trim(key);
    //
    // if ( ! key ) {
    //
    //   throw th("keyDown, key is an empty string");
    // }
    //
    if ( ! this.keys[key] ) {

      throw th("keyDown, key '" + key + "' first trigger keyBind()");
    }

    if ( ! this.keys[key].triggered ) {

      return this;
    }

    this.keys[key].triggered = false;

    try {

      clearInterval(this.keys[key].handler);
    }
    catch (e) {}

    return this;
  }
  /**
   * tetris.setSize({
        brickWidth: 10,
        brickHeight: 10,
    })
   */
  Tetris.prototype.setSize = function (opt) {

    opt = Object.assign({}, this.opt, opt);

    if ( ! Number.isInteger(opt.brickWidth) ) {

      throw th("opt.brickWidth is not an integer");
    }

    if ( ! Number.isInteger(opt.brickHeight) ) {

      throw th("opt.brickHeight is not an integer");
    }

    if ( opt.brickWidth < 4 ) {

      throw th("opt.brickWidth is smaller than 4 it is '" + opt.brickWidth + "'");
    }

    if ( opt.brickHeight < 4 ) {

      throw th("opt.brickHeight is smaller than 4 it is '" + opt.brickHeight + "'");
    }

    for ( var i = 0 ; i < opt.height ; i += 1 ) {

      for ( var k = 0 ; k < opt.width ; k += 1 ) {

        this.board[i][k].brick.style.width = String(opt.brickWidth) + "px";

        this.board[i][k].brick.style.height = String(opt.brickHeight) + "px";
      }
    }

    this.opt.board.style.width = String(opt.width * opt.brickWidth) + 'px';

    this.opt.board.style.height = String(opt.height * opt.brickHeight) + 'px';
  };

  return Tetris;
}());
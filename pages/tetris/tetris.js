window.Tetris = (function () {
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
    return "Tetris.js error: " + String(msg);
  }

  function createOneBrick(parent, n) {
    var el = document.createElement("div");
    n -= 1;
    if (n > 0) {
      createOneBrick(el, n);
    }
    manipulation.append(parent, el);
    return el;
  }

  function clearCell(square) {
    square.on = false;
    square.t = false;
    square.b = false;
    square.l = false;
    square.r = false;

    if (isElement(square.el)) {
      square.el.setAttribute("class", "");
    }
  }

  function clearRow(rowZeroIndex) {
    for (var k = 0; k < opt.width; k += 1) {
      clearCell(this.board[rowZeroIndex][k]);
    }
  }

  function updateCell(board, cell, newData) {
    clearCell(cell.cell);

    var b = cell.cell.el;

    var c = (board[cell.row][cell.col] = Object.assign(newData, {
      el: b,
    }));

    c.t && b.classList.add("t");
    c.b && b.classList.add("b");
    c.l && b.classList.add("l");
    c.r && b.classList.add("r");
    c.on && b.classList.add("on");
  }

  // Super rotation system
  // https://strategywiki.org/wiki/File:Tetris_rotation_super.png
  const tetrominoes = [
    [
      // ████                         // one brick
      {
        // one rotation
        start: true,
        rotation: [
          [null], // one row // one square
          [true, true, true, true],
        ],
      },
      {
        start: false,
        rotation: [
          [null, null, true],
          [null, null, true],
          [null, null, true],
          [null, null, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [null], [true, true, true, true]],
      },
      {
        start: false,
        rotation: [
          [null, true],
          [null, true],
          [null, true],
          [null, true],
        ],
      },
    ],
    [
      // ▛ ▟
      {
        start: true,
        rotation: [[true], [true, true, true]],
      },
      {
        start: true,
        rotation: [
          [null, true, true],
          [null, true],
          [null, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [true, true, true], [null, null, true]],
      },
      {
        start: true,
        rotation: [
          [null, true],
          [null, true],
          [true, true],
        ],
      },
    ],
    [
      // ▙ ▜
      {
        start: true,
        rotation: [
          [null, null, true],
          [true, true, true],
        ],
      },
      {
        start: true,
        rotation: [
          [null, true],
          [null, true],
          [null, true, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [true, true, true], [true]],
      },
      {
        start: true,
        rotation: [
          [true, true],
          [null, true],
          [null, true],
        ],
      },
    ],
    [
      // ░ ▒ ▓
      {
        start: true,
        rotation: [
          [null, true, true],
          [null, true, true],
        ],
      },
    ],
    [
      //▗█▘
      {
        start: true,
        rotation: [
          [null, true, true],
          [true, true],
        ],
      },
      {
        start: true,
        rotation: [
          [null, true],
          [null, true, true],
          [null, null, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [null, true, true], [true, true]],
      },
      {
        start: true,
        rotation: [[true], [true, true], [null, true]],
      },
    ],
    [
      //▝█▖
      {
        start: true,
        rotation: [
          [true, true],
          [null, true, true],
        ],
      },
      {
        start: true,
        rotation: [
          [null, null, true],
          [null, true, true],
          [null, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [true, true], [null, true, true]],
      },
      {
        start: true,
        rotation: [[null, true], [true, true], [true]],
      },
    ],
    [
      //▗█▖
      {
        start: true,
        rotation: [
          [null, true],
          [true, true, true],
        ],
      },
      {
        start: true,
        rotation: [
          [null, true],
          [null, true, true],
          [null, true],
        ],
      },
      {
        start: false,
        rotation: [[null], [true, true, true], [null, true]],
      },
      {
        start: true,
        rotation: [
          [null, true],
          [true, true],
          [null, true],
        ],
      },
    ],
  ];

  const max = (function () {
    var w = 0;
    var h = 0;
    tetrominoes.forEach(function (brick) {
      brick.forEach(function (rotation) {
        if (rotation.rotation.length > h) {
          h = rotation.rotation.length;
        }
        rotation.rotation.forEach(function (row) {
          if (row.length > w) {
            w = row.length;
          }
        });
      });
    });

    return {
      w: w,
      h: h,
    };
  })();

  // extend and add borders
  (function () {
    tetrominoes.forEach(function (brick, ib) {
      brick.forEach(function (rotation, ir) {
        rotation.rotation.forEach(function (row, irow) {
          row.forEach(function (square, is) {
            if (square === true) {
              tetrominoes[ib][ir].rotation[irow][is] = {
                square,
                borders: {
                  t: (function () {
                    if (irow === 0) {
                      return true;
                    }
                    try {
                      return !Boolean(tetrominoes[ib][ir].rotation[irow - 1][is]);
                    } catch (e) {
                      return true;
                    }
                  })(),
                  b: (function () {
                    if (irow >= rotation.length - 1) {
                      return true;
                    }
                    try {
                      return !Boolean(tetrominoes[ib][ir].rotation[irow + 1][is]);
                    } catch (e) {
                      return true;
                    }
                  })(),
                  l: (function () {
                    if (is === 0) {
                      return true;
                    }
                    try {
                      return !Boolean(tetrominoes[ib][ir].rotation[irow][is - 1]);
                    } catch (e) {
                      return true;
                    }
                  })(),
                  r: (function () {
                    if (is >= row.length - 1) {
                      return true;
                    }
                    try {
                      return !Boolean(tetrominoes[ib][ir].rotation[irow][is + 1]);
                    } catch (e) {
                      return true;
                    }
                  })(),
                },
              };
            }
          });
        });
      });
    });
  })();

  /**
    var tetris = new Tetris({
      board: document.querySelector('.board'),
      bricks: document.querySelector('.bricks'),
      brickHeight: 15,
      brickWidth: 15,
    })
   */
  const Tetris = function (opt) {
    if (!(this instanceof Tetris)) {
      return new Tetris(opt);
    }

    this.opt = opt = Object.assign(
      {
        // board: document.querySelector('.board'),
        // bricks: document.querySelector('.bricks'),
        width: 10,
        height: 20,
        brickHeight: 10,
        brickWidth: 10,
        next: 3,
      },
      opt
    );

    if (!isElement(opt.board)) {
      throw th("opt.board is not DOM element");
    }

    if (!isElement(opt.bricks)) {
      throw th("opt.bricks is not DOM element");
    }

    if (!Number.isInteger(opt.width)) {
      throw th("opt.width is not an integer");
    }

    if (!Number.isInteger(opt.height)) {
      throw th("opt.height is not an integer");
    }

    if (opt.width < 8) {
      throw th("opt.width is smaller than 8 it is '" + opt.width + "'");
    }

    if (opt.height < 16) {
      throw th("opt.height is smaller than 16 it is '" + opt.height + "'");
    }

    if (!Number.isInteger(opt.next)) {
      throw th("opt.next is not an integer");
    }

    if (opt.next < 1) {
      throw th("opt.next is smaller than 1 it is '" + opt.next + "'");
    }

    if (opt.next > 5) {
      throw th("opt.next is greater than 5 it is '" + opt.next + "'");
    }

    if (opt.width - 2 <= max.w) {
      throw th("[[ (opt.width - 2) <= max.w ]] where opt.width=" + opt.width + ", max.w=" + max.w);
    }

    const startx = Math.floor((opt.width - max.w) / 2);

    log("existing", this.opt.board.tetris);

    manipulation.empty(opt.board);

    this.board = [];

    for (var i = 0; i < opt.height; i += 1) {
      var t = [];

      for (var k = 0; k < opt.width; k += 1) {
        var el = createOneBrick(opt.board, 3);

        const square = {
          el: el,
        };

        el.dataset["row"] = i;

        el.dataset["col"] = k;

        clearCell(square);

        t.push(square);
      }

      this.board.push(t);
    }

    this.bricks = [];

    for (var i = 0, l = (max.h + 1) * opt.next; i < l; i += 1) {
      var t = [];

      for (var k = 0; k < max.w; k += 1) {
        const square = {
          el: createOneBrick(opt.bricks, 3),
        };

        clearCell(square);

        t.push(square);
      }

      this.bricks.push(t);
    }

    this.setSize();

    opt.board.tetris = this;

    this.keys = {};
  };

  var game = (function () {
    // https://tetris.wiki/Tetris_(NES,_Nintendo)#:~:text=Soft%20drop%20speed%20is%201,frames%20longer%20than%20the%20last.
    // var framesPerSec = 60
    var framesPerSec = 55; // after correction
    var msPerFrame = 1000 / framesPerSec;

    var levels = [
      msPerFrame * 48, // 0
      msPerFrame * 43, // 1
      msPerFrame * 38, // 2
      msPerFrame * 33, // 3
      msPerFrame * 28, // 4
      msPerFrame * 23, // 5
      msPerFrame * 18, // 6
      msPerFrame * 13, // 7
      msPerFrame * 8, // 8
      msPerFrame * 6, // 9
      msPerFrame * 5, // 10
      msPerFrame * 4, // 11
      msPerFrame * 3, // 12
    ];

    var handler;
    // var speed =

    var tool = function () {};

    tool.start = function () {};
    tool.stop = function () {};

    return game;
  })();

  Tetris.prototype.destroy = function () {
    // to implement

    delete this.opt.board.tetris;
  };

  Tetris.prototype.up = function () {
    log(".up");
  };

  Tetris.prototype.down = function () {
    log(".down");
  };

  Tetris.prototype.left = function () {
    log(".left");
  };

  Tetris.prototype.right = function () {
    log(".right");
  };

  Tetris.prototype.rotateR = function () {
    log(".rotateR");
  };

  Tetris.prototype.rotateL = function () {
    log(".rotateL");
  };

  Tetris.prototype.cellOn = function (element) {
    try {
      var cell = this.findCellByDomElement(element);

      updateCell(this.board, cell, {
        on: true,
      });
    } catch (e) {
      throw th("cellOn error: " + String(e));
    }
  };

  Tetris.prototype.cellOff = function (element) {
    try {
      var cell = this.findCellByDomElement(element);

      clearCell(cell.cell);
    } catch (e) {
      throw th("cellOff error: " + String(e));
    }
  };

  Tetris.prototype.cellIsOn = function (element) {
    try {
      var cell = this.findCellByDomElement(element);

      return Boolean(cell.cell.on);
    } catch (e) {
      throw th("cellIsOn error: " + String(e));
    }
  };

  Tetris.prototype.findCellByDomElement = function (element) {
    if (typeof element.dataset["row"] !== "string") {
      throw th("findCellByDomElement element dataset.row is not a string");
    }

    if (typeof element.dataset["col"] !== "string") {
      throw th("findCellByDomElement element dataset.row is not a string");
    }

    return {
      col: element.dataset["col"],
      row: element.dataset["row"],
      cell: this.board[element.dataset["row"]][element.dataset["col"]],
    };
  };

  Tetris.prototype.keyBind = function (key, fn, triggerEveryMs) {
    if (typeof key !== "string") {
      throw th("keyBind, key is not a string");
    }

    key = trim(key);

    if (!key) {
      throw th("keyBind, key is an empty string");
    }

    this.keyUnbind(key);

    if (typeof fn !== "function") {
      throw th("keyBind, fn is not a function");
    }

    if (!Number.isInteger(triggerEveryMs) || triggerEveryMs < 100) {
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
  };

  Tetris.prototype.keyUnbind = function (key) {
    if (typeof key !== "string") {
      throw th("keyBind, key is not a string");
    }

    key = trim(key);

    try {
      clearInterval(this.keys[key].handler);
    } catch (e) {}

    if (!key) {
      throw th("keyBind, key is an empty string");
    }

    delete this.keys[key];

    return this;
  };

  Tetris.prototype.keyDown = function (key, extra) {
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
    if (!this.keys[key]) {
      throw th("keyDown, key '" + key + "' first trigger keyBind()");
    }

    if (this.keys[key].triggered) {
      return this;
    }

    this.keys[key].triggered = true;

    var fn = this.keys[key].fn;

    this.keys[key].handler = setInterval(function () {
      fn();

      log("keyDown[", extra.key, "]");
    }, this.keys[key].triggerEveryMs);

    fn();

    log("keyDown[", extra.key, "]");

    return this;
  };

  Tetris.prototype.keyUp = function (key, extra) {
    // log('keyUp', extra)

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
    if (!this.keys[key]) {
      throw th("keyDown, key '" + key + "' first trigger keyBind()");
    }

    if (!this.keys[key].triggered) {
      return this;
    }

    this.keys[key].triggered = false;

    try {
      clearInterval(this.keys[key].handler);
    } catch (e) {}

    return this;
  };
  /**
   * tetris.setSize({
        brickWidth: 10,
        brickHeight: 10,
    })
   */
  Tetris.prototype.setSize = function (opt) {
    opt = Object.assign({}, this.opt, opt);

    if (!Number.isInteger(opt.brickWidth)) {
      throw th("opt.brickWidth is not an integer");
    }

    if (!Number.isInteger(opt.brickHeight)) {
      throw th("opt.brickHeight is not an integer");
    }

    if (opt.brickWidth < 4) {
      throw th("opt.brickWidth is smaller than 4 it is '" + opt.brickWidth + "'");
    }

    if (opt.brickHeight < 4) {
      throw th("opt.brickHeight is smaller than 4 it is '" + opt.brickHeight + "'");
    }

    // board
    for (var i = 0; i < opt.height; i += 1) {
      for (var k = 0; k < opt.width; k += 1) {
        this.board[i][k].el.style.width = String(opt.brickWidth) + "px";

        this.board[i][k].el.style.height = String(opt.brickHeight) + "px";
      }
    }

    this.opt.board.style.width = String(opt.width * opt.brickWidth) + "px";

    this.opt.board.style.height = String(opt.height * opt.brickHeight) + "px";

    // bricks
    for (var i = 0, l = (max.h + 1) * opt.next; i < l; i += 1) {
      for (var k = 0; k < max.w; k += 1) {
        this.bricks[i][k].el.style.width = String(opt.brickWidth) + "px";

        this.bricks[i][k].el.style.height = String(opt.brickHeight) + "px";
      }
    }

    this.opt.bricks.style.width = String(max.w * opt.brickWidth) + "px";

    this.opt.bricks.style.height = String((max.h + 1) * opt.next * opt.brickHeight) + "px";
  };

  return Tetris;
})();

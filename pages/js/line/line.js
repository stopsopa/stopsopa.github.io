const pi = Math.PI;

/**
 * var linediv =                          line(x1, y1, x2, y2, opt, callback);                  case A
 * var linediv =        line(parentDomElement, x1, y1, x2, y2, opt, callback);                  case B
 *
 * var linediv =                          line(x1, y1, {ang: 45, dis: 200}, opt, callback);     case C
 * var linediv =        line(parentDomElement, x1, y1, {ang: 45, dis: 200}, opt, callback);     case D
 */
const tool = function (target, x1, y1, x2, y2, opt, callback) {
  if (!isNode(target)) {
    return tool.apply(this, [document.body].concat(_a(arguments)));
  }

  if (isObject(x2)) {
    // normalization for case C and D
    var k = 0,
      a = _a(arguments);

    if (typeof x2.ang != "undefined") k = calcXYOffsetByVectorAngle(x2.ang, x2.dis);
    else if (typeof x2.rad != "undefined") k = calcXYOffsetByVectorAngleRad(x2.rad, x2.dis);
    else _thw("Arguments incomplete: " + JSON.stringify(a));

    a[6] = a[5];
    a[5] = a[4];
    a[3] = x1 + k.x;
    a[4] = y1 + k.y;

    return tool.apply(this, a);
  }

  if (isFunction(opt)) {
    callback = opt;
  }

  opt || (opt = {});

  var o = {
    style: "solid",
    width: 1,
    color: "black",

    cls: "jqline",
    id: false,
    correct: true, // bool|int - corection of position, give integer to move
    correctpos: "normal", // normal, top, bottom, left, right
    css: {
      height: "0",
      zIndex: "999",
      zoom: 1,
    },
  };

  o = Object.assign(o, opt || {});

  o.create = opt.create || document.createElement("div");

  var ang = calcAngle(x1, y1, x2, y2); // degrees

  var c = correct(x1, y1, x2, y2, o /* half of line width */, ang);

  c.distance = calcDistance(x1, y1, x2, y2);

  o.css = Object.assign(
    Object.assign({}, o.css),
    {
      borderTop: o.width + "px " + o.style + " " + o.color,
      position: "absolute",
      width: c.distance + "px",
      "-webkit-transform": "rotate(" + ang + "deg)",
      "-moz-transform": "rotate(" + ang + "deg)",
      "-ms-transform": "rotate(" + ang + "deg)",
      "-o-transform": "rotate(" + ang + "deg)",
      transform: "rotate(" + ang + "deg)",

      "transform-origin": "0 0",
      "-ms-transform-origin": "0 0" /* IE 9 */,
      "-webkit-transform-origin": "0 0" /* Chrome, Safari, Opera */,

      left: x1 + c.x + "px",
      top: y1 + c.y + "px",
    },
    opt.css
  );

  Object.keys(o.css).forEach((name) => {
    o.create.style[name] = o.css[name];
  });

  o.cls && o.create.classList.add(o.cls);
  o.id && o.create.setAttribute("id", o.id);

  // manipulation
  manipulation.append(target, o.create);

  isFunction(callback) && callback(o.create, o, c);

  return o.create;
  return {
    element: o.create,
    unmount: () => {
      // no plan for that yet
    },
  };
};

// // expose tools to use outside

// converting radians to angle
tool.radToAng = radToAng;

// converting angle to radians
tool.angToRad = angToRad;

// calc distance between two points of two points x1, y1, x2, y2
tool.calcDistance = calcDistance;

// calculate angle in radians x1, y1, x2, y2
tool.calcAngleRad = calcAngleRad;

// calculate angle in degrees x1, y1, x2, y2
tool.calcAngle = calcAngle;

// calculate points based on angle and distance
// calcXYOffsetByVectorAngle(x2.ang, x2.dis)
tool.calcXYOffsetByVectorAngle = calcXYOffsetByVectorAngle;

// calculate points based on radians and distance
// calcXYOffsetByVectorAngleRad(x2.rad, x2.dis)
tool.calcXYOffsetByVectorAngleRad = calcXYOffsetByVectorAngleRad;

export default tool;

function _thw(message) {
  throw "plugin jQuery(...)." + name + "() : " + message;
}
function _a(a) {
  return Array.prototype.slice.call(a, 0);
}
function isFunction(a) {
  // taken from underscore.js
  return typeof a == "function" || false;
}
function isObject(obj) {
  var type = typeof obj;
  return type === "function" || (type === "object" && !!obj);
}
function angToRad(ang) {
  return ang * (pi / 180);
}
function radToAng(rad) {
  return rad * (180 / pi);
}
// calc distance between two points
function calcDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
// calculate angle in radians
function calcAngleRad(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}
// calculate angle in degrees
function calcAngle(x1, y1, x2, y2) {
  var a = calcAngleRad(x1, y1, x2, y2) * (180 / pi);
  return a < 0 ? (a += 360) : a;
}
function calcXYOffsetByVectorAngleRad(rad, dis) {
  return {
    // http://stackoverflow.com/a/10962780
    x: Math.cos(rad) * dis,
    y: Math.sin(rad) * dis,
  };
}
function calcXYOffsetByVectorAngle(ang, dis) {
  return calcXYOffsetByVectorAngleRad(angToRad(ang), dis);
}
var manipulation = {
  after: function (referenceNode, newNode) {
    return this.before(referenceNode.nextSibling, newNode);
  },
  before: function (referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
    return this;
  },
  append: function (parentNode, newNode) {
    parentNode.appendChild(newNode);
    return this;
  },
  prepend: function (parentNode, newNode) {
    parentNode.insertBefore(newNode, parentNode.firstChild);
    return this;
  },
  remove: function (node) {
    node.parentNode.removeChild(node);
    return this;
  },
  empty: function (node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    return this;
  },
};

/**
 * https://stackoverflow.com/a/384380
 * @param o
 * @returns {*}
 */
function isNode(o) {
  return typeof Node === "object"
    ? o instanceof Node
    : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string";
}
// count correction
function correct(x1, y1, x2, y2, o, ang) {
  ang || (ang = calcAngle(x1, y1, x2, y2));

  var hw = o.width / 2;
  var hwo = hw; // originial

  var sw = false;

  if (Number.isInteger(o.correct)) {
    var c = o.correct;
    switch (true) {
      case o.correctpos == "normal":
        hw += c;
        break;
      case o.correctpos == "top" && ang > 90 && ang < 270:
        sw = true;
        c = -Math.abs(c);
        break;
      case o.correctpos == "bottom" && (ang < 90 || ang > 270):
        sw = true;
        c = -Math.abs(c);
        break;
      case o.correctpos == "left" && ang > 0 && ang < 180:
        sw = true;
        c = -Math.abs(c);
        break;
      case o.correctpos == "right" && (ang < 0 || ang > 180):
        sw = true;
        c = -Math.abs(c);
        break;
    }
    hw += c;
  }

  var rad = calcAngleRad(x1, y1, x2, y2); // radians
  var radminhalf = rad - pi / 2; // radians minus half radian

  var c = {};
  if (o.correct === false) {
    c.x = c.y = c.oy = c.ox = 0;
  } else {
    c.y = Math.sin(radminhalf) * hw;
    c.x = Math.cos(radminhalf) * hw;
    c.oy = Math.sin(radminhalf) * hwo; // without correction
    c.ox = Math.cos(radminhalf) * hwo; // without correction
  }
  c.ang = ang;
  c.rad = rad;
  c.ox2 = c.ox * 2;
  c.oy2 = c.oy * 2;
  c.x1 = x1;
  c.y1 = y1;
  c.x2 = x2;
  c.y2 = y2;

  if (sw) {
    c.ax = c.x1 - c.ox2;
    c.ay = c.y1 - c.oy2;

    c.bx = c.ax + c.x;
    c.by = c.ay + c.y;

    c.cx = c.x2 + c.x;
    c.cy = c.y2 + c.y;

    c.dx = c.cx - c.ox2;
    c.dy = c.cy - c.oy2;
  } else {
    c.bx = c.x1 + c.x;
    c.by = c.y1 + c.y;

    c.ax = c.bx - c.ox2;
    c.ay = c.by - c.oy2;

    c.dx = c.x2 + c.x;
    c.dy = c.y2 + c.y;

    c.cx = c.dx - c.ox2;
    c.cy = c.dy - c.oy2;
  }

  return c;
}

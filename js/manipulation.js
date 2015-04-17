import log from "./log.js";

function manipulation() {
  var domCache = document.createElement("div");
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function isPlainObject(value) {
    // simplified version of isPlainObject then the one in lodash
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function isNode(value) {
    return isObjectLike(value) && !isPlainObject(value);
  }
  return {
    after: function (referenceNode, newNode) {
      if (referenceNode.nextSibling) {
        return this.before(referenceNode.nextSibling, newNode);
      }
      return this.append(referenceNode.parentNode, newNode);
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
    replace: function (oldNode, newNode) {
      oldNode.parentNode.replaceChild(newNode, oldNode);
    },
    detach: function (node) {
      // detach element from DOM, to use it somewhere else
      this.append(domCache, node);
      return node;
    },
    empty: function (node) {
      node.innerHTML = "";
      return this;
    },
    isNodeList: function (obj) {
      return Object.prototype.toString.call(obj) === "[object NodeList]";
    },
    isNode: isNode,
    children: function (parentNode) {
      try {
        // read also about
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName  - undefined when #text node
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName
        return Array.prototype.slice.call(parentNode.childNodes);
      } catch (e) {
        throw new Error("manipulation.children() error: " + String(e));
      }
    },
    /**
     *
     * @param el
     * @param firstText - empty string - remove element, non empty string - set element, null|undefined - skip element
     * @param lastText - empty string - remove element, non empty string - set element, null|undefined - skip element
     */
    txt: function (el, firstText, lastText) {
      var list = Array.prototype.slice.call(el.childNodes);
      var a,
        b,
        lastRef,
        t = list[0];
      if (this.isNode(t) && t.nodeType === 3) {
        a = t;
      }
      if (list.length > 1) {
        for (var i = 1, l = list.length; i < l; i += 1) {
          if (this.isNode(list[i]) && list[i].nodeType === 3) {
            b = list[i];
            lastRef = i;
          }
        }
      }
      if (typeof firstText === "string") {
        if (firstText) {
          if (a) {
            if (this.isNode(a) && a.nodeValue !== 3) {
              this.replace(a, firstText);
              a = firstText;
            } else {
              a.nodeValue = firstText;
            }
          } else {
            a = document.createTextNode(firstText);
            this.prepend(el, a);
          }
        } else {
          if (a) {
            this.remove(a);
            a = undefined;
          }
        }
      }
      if (typeof lastText === "string") {
        if (lastText) {
          if (b) {
            if (this.isNode(b) && b.nodeType !== 3) {
              this.replace(b, lastText);
              b = lastText;
            } else {
              b.nodeValue = lastText;
            }
          } else {
            b = document.createTextNode(lastText);
            this.append(el, b);
          }
        } else {
          if (b) {
            this.remove(b);
            b = undefined;
          }
        }
      }
      var res = {
        a: a,
        b: b,
        at: a ? a.nodeValue : undefined,
        bt: b ? b.nodeValue : undefined,
        all: "",
      };
      if (res.at) {
        res.all += res.at;
      }
      if (res.bt) {
        if (res.all) {
          res.all += " ";
        }
        res.all += res.bt;
      }
      return res;
    },
  };
}

const manipulationInstance = manipulation();

/* from lodash */
function isNodeList(obj) {
  return Object.prototype.toString.call(obj) === "[object NodeList]";
}
/* from lodash */
var isNode = (function () {
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function isPlainObject(value) {
    // simplified version of isPlainObject then the one in lodash
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  return function isNode(value) {
    return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
  };
})();

log.green("defined", "window.isNode");

manipulationInstance.custommove = function (newParent, elements) {
  if (isNode(elements)) {
    elements = [elements];
  } else if (isNodeList(elements)) {
    elements = Array.prototype.slice.call(elements);
  }

  try {
    for (var i = 0, l = elements.length; i < l; i += 1) {
      newParent.appendChild(elements[i]);
    }
  } catch (e) {
    throw "manipulation.custommove - can't iterate through elements";
  }
  return this;
};

log.green("defined", "manipulation.custommove [extension]");

export default manipulationInstance;

log.green("defined", "window.manipulation");

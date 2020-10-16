/**
 * @author Szymon Działowski
 * @date: 08-03-2018
 *
 * Use:
 * add at the end of the page just before </body>
 *
    <script src="./js/permalink-my.js"></script>
    <script>mountpermalink();</script>

 * UMD -> https://github.com/umdjs/umd#umd-universal-module-definition -> amdWebGlobal.js
 */


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.mountpermalink = factory());
        });
    } else {
        // Browser globals
        root.mountpermalink = factory();
    }
}(typeof self === 'undefined' ? this : self, function () {

    // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys#Polyfill
    if (!Object.keys) {
        Object.keys = (function() {
            'use strict';
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                dontEnums = [
                    'toString',
                    'toLocaleString',
                    'valueOf',
                    'hasOwnProperty',
                    'isPrototypeOf',
                    'propertyIsEnumerable',
                    'constructor'
                ],
                dontEnumsLength = dontEnums.length;

            return function(obj) {
                if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                var result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
    }

    // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
    if (typeof Object.assign != 'function') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
            value: function assign(target, varArgs) { // .length of function is 2
                'use strict';
                if (target == null) { // TypeError if undefined or null
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                var to = Object(target);

                for (var index = 1; index < arguments.length; index++) {
                    var nextSource = arguments[index];

                    if (nextSource != null) { // Skip over if undefined or null
                        for (var nextKey in nextSource) {
                            // Avoid bugs when hasOwnProperty is shadowed
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                return to;
            },
            writable: true,
            configurable: true
        });
    }

    var log = (function () {
        try {
            return console.log;
        }
        catch (e) {
            return function () {};
        }
    }());

    function isObject(a) {
        return (!!a) && (a.constructor === Object);
    };

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
        }
    };

    function trim(string, charlist, direction) {
        direction = direction || 'rl';
        charlist  = (charlist || '').replace(/([.?*+^$[\]\\(){}|-])/g,'\\$1');
        charlist  = charlist || " \\n";
        (direction.indexOf('r')+1) && (string = string.replace(new RegExp('^(.*?)['+charlist+']*$','gm'),'$1'));
        (direction.indexOf('l')+1) && (string = string.replace(new RegExp('^['+charlist+']*(.*)$','gm'),'$1'));
        return string;
    }
    function slug(str) {
        return trim(str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-'), '-');
    }

    function unique(list, str) {

        if (isObject(list)) {

            list = Object.keys(list);
        }

        str = slug(str);

        var i = 0, tmp;

        do {
            tmp = str || '';

            if (i > 0) {

                if (tmp) {

                    tmp += '-';
                }

                tmp += i;
            }

            i += 1;
        }
        while (!tmp || list.indexOf(tmp) > -1);

        return tmp;
    }

    var def = {
        html: '¶',
        styleId: 'permalink-plugin',
        anchorClass: 'permalink-cls',
        style:
            "h1 > a.permalink-cls, h2 > a.permalink-cls, h3 > a.permalink-cls,\n\
            h4 > a.permalink-cls, h5 > a.permalink-cls, h6 > a.permalink-cls {\n\
                float: left;\n\
                width: 1ex;\n\
                height: 1em;\n\
                color: #29252b;\n\
                text-decoration: none;\n\
                display: none;\n\
                -webkit-transform: translate(-100%, 0);\n\
                -ms-transform: translate(-100%, 0);\n\
                transform: translate(-100%, 0);\n\
                margin-right: -100%;\n\
                padding-right: 0.4em;\n\
            }\n\
            h1:hover > a.permalink-cls, h2:hover > a.permalink-cls, h3:hover > a.permalink-cls,\n\
            h4:hover > a.permalink-cls, h5:hover > a.permalink-cls, h6:hover > a.permalink-cls {\n\
                display: inline-block;\n\
            }"
    };

    var mountpermalink = function (opt) {

        opt = Object.assign(def, opt);

        var links = {};

        'h1, h2, h3, h4, h5, h6'.split(',').forEach(function (selector) {
            document.querySelectorAll(trim(selector)).forEach(function (el) {
                links[unique(links, el.innerText)] = el;
            });
        });

        if ( ! document.querySelector('#' + opt.styleId) ) {

            // https://stackoverflow.com/a/524721
            var head = document.head || document.getElementsByTagName('head')[0],
                style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet){
                style.styleSheet.cssText = opt.style;
            } else {
                style.appendChild(document.createTextNode(opt.style));
            }

            style.setAttribute('id', opt.styleId)

            head.appendChild(style);
        }

        Object.keys(links).forEach(function (key) {

            var firstChild = links[key].children[0];

            if (firstChild && firstChild.getAttribute) {

                if (firstChild.getAttribute('class') === opt.anchorClass) {

                    // link already created

                    return;
                }
            }

            var link = document.createElement('a');

            link.setAttribute('class', opt.anchorClass)

            var id = links[key].getAttribute('id');

            if ( ! id ) {

                id = key;
            }

            links[key].setAttribute('id', id);

            link.setAttribute('href', '#' + id);

            link.innerHTML = opt.html;

            manipulation.prepend(links[key], link);
        });

        log.blue('executed', 'permalink-my', '[function executed in domcontentloaded.js]')
    };

    return mountpermalink;
}));

log.gray('finished', 'permalink-my.js')


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
    move: function (newParent, elements) { // elements - array of elements|single element

    }
};

(function () {
    /* from lodash */
    function isNodeList (obj) {
        return Object.prototype.toString.call(obj) === '[object NodeList]';
    }
    /* from lodash */
    var isNode = (function () {
        function isObjectLike(value) {
            return value != null && typeof value == 'object';
        }
        function isPlainObject(value) { // simplified version of isPlainObject then the one in lodash
            return Object.prototype.toString.call(value) === '[object Object]'
        }
        return function isNode (value) {
            return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
        }
    }());
    manipulation.move = function (newParent, elements) {

        if (isNode(elements)) {

            elements = [elements];
        }
        else if (isNodeList(elements)) {
            elements = Array.prototype.slice.call(elements);
        }

        try {
            for (var i = 0, l = elements.length ; i < l ; i += 1 ) {
                newParent.appendChild(elements[i]);
            }
        }
        catch (e) {

            throw "manipulation.move - can't iterate through elements"
        }
        return this;
    }
}());

(function () {

    const log = (function () {
        try {
            return console.log
        }
        catch (e) {
            return () => {}
        }
    }());

    window.log = log;

    window.manipulation = manipulation;

    // https://github.com/stopsopa/stopsopa.github.io/edit/master/demos/jquery.elkanatooltip/katownik.html
    // https://stopsopa.github.io/
    // user stopsopa
    // path /pages/css-grid/index.html
    const github = (function (def) {

        let host = def;

        if (/\.github\.io$/.test(location.host)) {

            host = location.host;
        }

        const user = host.replace(/^(.*)\.github\.io$/, '$1');

        log('user', user)

        let path = location.pathname;

        if ( /\/$/.test(path) ) {

            path += 'index.html';
        }

        log('path', path)

        const github = `//github.com/${user}/${user}.github.io/edit/master/${path}`;

        log('github', github)

        return github;

    }("stopsopa.github.io"));

    document.addEventListener('DOMContentLoaded', () => {

        (function () {
            const a = document.createElement('a');

            a.classList.add('github-link');

            a.innerText = 'edit';

            a.setAttribute('href', github)

            manipulation.append(document.body, a);

            const css = `
body .github-link {
    border: 1px solid #2d2d2d;
    top: 7px;
    right: -18px;
    position: absolute;
    transform: rotate(45deg);
    padding-left: 20px;
    padding-right: 20px;
    color: white;
    text-decoration: none;
    background-color: #2d2d2d;
} 
body .github-link:hover {
    cursor: pointer;
    color: #2d2d2d;
    background-color: white;
}          
            `;
            // https://stackoverflow.com/a/524721
            var head = document.head || document.getElementsByTagName('head')[0],
                style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet){
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
        }());


        (function () {
            const a = document.createElement('a');

            a.classList.add('github-profile');

            a.innerText = 'profile';

            a.setAttribute('href', '//github.com/stopsopa')

            manipulation.append(document.body, a);

            const css = `
body .github-profile {
    border: 1px solid #2d2d2d;
    top: 6px;
    left: -23px;
    position: absolute;
    transform: rotate(-38deg);
    padding-left: 20px;
    padding-right: 20px;
    color: white;
    text-decoration: none;
    background-color: #2d2d2d;
    font-size: 15px;
    padding-bottom: 2px;
    padding-top: 2px;
} 
body .github-profile:hover {
    cursor: pointer;
    color: #2d2d2d;
    background-color: white;
}          
            `;
            // https://stackoverflow.com/a/524721
            var head = document.head || document.getElementsByTagName('head')[0],
                style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet){
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
        }());

    });
}());

(function () {
    document.querySelector('body > header') || document.addEventListener('DOMContentLoaded', function () {

        var body = document.body;

        if (body.hasAttribute('head')) {

            var header = document.createElement('header');

            header.innerHTML = `
    <a href="/index.html">stopsopa.github.io</a>
`;

            manipulation.prepend(body, header);
        }
    });
}());

(function () {
    document.querySelector('body > footer') || document.addEventListener('DOMContentLoaded', function () {

        var body = document.body;

        log('foot', body)

        if (body.hasAttribute('foot')) {

            var header = document.createElement('footer');

            header.innerHTML = `footer`;

            manipulation.append(body, header);
        }
    });
}());

// load common css and js

(function () {

    // <link rel="stylesheet" href="../../css/normalize.css">

    [
        '/css/normalize.css',
        '/css/main.css',
        '/js/aceedit/jquery.aceedit.css',
        '//fonts.googleapis.com/css?family=Open+Sans:300,400',
    ].forEach(u => {

        // https://stackoverflow.com/a/524721
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('link');

        // style.type = 'text/css';

        style.setAttribute('rel', 'stylesheet');

        style.setAttribute('href', u);

        head.appendChild(style);
    })
}());

(function () {

    // <link rel="shortcut icon" type="image/png" href="favicon.png"/>

    [
        'favicon.png',
    ].forEach(u => {

        // https://stackoverflow.com/a/524721
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('link');

        // style.type = 'text/css';

        style.setAttribute('rel', 'shortcut icon');
        style.setAttribute('type', 'image/png');

        style.setAttribute('href', u);

        head.appendChild(style);
    })
}());

(function () {

    // <script src="./js/polyfill.js"></script>
    // <script src="./js/permalink-my.js"></script>

    [
        '/js/polyfill.js',
        '/js/permalink-my.js',
        '/js/domcontentloaded.js',
        '/js/lodash-4.17.10.js',
        '/js/ace/ace-builds-1.3.3/src-min-noconflict/ace.js',
    ].forEach(u => {

        // https://stackoverflow.com/a/524721
        var head = document.head || document.getElementsByTagName('head')[0],
            script = document.createElement('script');

        // script.async = false;

        script.setAttribute('src', u);

        head.appendChild(script);
    })
}());

(function () {
    document.addEventListener('DOMContentLoaded', function () {
       Array.prototype.slice.call(document.querySelectorAll('[data-do-sort]')).forEach(function (parent) {
           var children = Array.prototype.slice.call(parent.children);

           var tmp = [];

           children.forEach(function (child) {
               tmp.push({
                   node: child,
                   text: child.innerText.toLocaleLowerCase()
               })
           });

           const newList = tmp.sort(function (a, b) {

               if (a.text === b.text) {

                   return 0
               }

               return a.text > b.text;
           }).map(function (n) {return n.node});

           log('newList', newList)

           manipulation.move(parent, newList)
       });
    });
}());

// ace editor
(function () {

    // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            };
    }

    function unique(pattern) { // node.js require('crypto').randomBytes(16).toString('hex');
        pattern || (pattern = 'xyxyxy');
        return pattern.replace(/[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }

    var p, editors = {};

    window.doace = function () {

        if (!p) {

            p = new Promise(function (resolve) {
                (function run() {
                    if (window._ && window.ace && window.ace.edit) {

                        document.body.addEventListener('click', function (e) {

                            var el = e.target;

                            var match = el.matches('[data-lang] > .copy');

                            if (match) {

                                var editor = editors[el.parentNode.dataset.ace];

                                if (editor) {

                                    log("found editory, let's copy");

                                    var textarea = document.createElement('textarea');
                                    manipulation.append(document.body, textarea);
                                    textarea.value = editor.getValue();
                                    textarea.select();
                                    document.execCommand('copy');
                                    textarea.value = "";
                                    manipulation.remove(textarea);

                                    (function () {

                                        el.dataset.or = el.dataset.or || el.innerHTML;

                                        el.innerHTML = '☑️';

                                        setTimeout(function () {
                                            el.innerHTML = el.dataset.or;
                                        }, 1000);

                                    }());
                                }

                                log('clicked .copy');
                            }
                            else {

                                log('something else clicked');
                            }
                        });

                        resolve()
                    }
                    else {
                        setTimeout(run, 100);
                    }
                }());
            });
        }

        p.then(function () {
            Array.prototype.slice.call(document.querySelectorAll('[type="editor"], [type="syntax"]')).forEach(function (el) {

                if (el.classList.contains('handled')) {

                    log('ace - handled')

                    return true;
                }

                var script, editor, div, t = '', d;

                /**
                 * Lets simplify syntax
                 * from
                 *
                 *  <div class="editor">
                 *      <script type="editor" data-lang="js" data-w="95%">
                 *      </script>
                 *  </div>
                 *
                 *  to
                 *
                 *  <script class="editor" type="editor" data-lang="js" data-w="95%"></script>
                 *
                 *  and then execute old logic
                 */
                (function () {

                    div = document.createElement('div');

                    manipulation.after(el, div);

                    manipulation.move(div, el);

                    var attr = Array.prototype.slice.call(el.attributes);

                    for (var i = 0, l = attr.length ; i < l ; i += 1 ) {

                        if (attr[i].name.toLowerCase() === 'class') {

                            continue;
                        }

                        div.setAttribute(attr[i].name, attr[i].value);
                    }

                    el = div;
                })();

                script = el.querySelector('script');

                d = el.dataset.h;
                d && (el.style.height = d);
                d = el.dataset.w;
                d && (el.style.width = d);

                if (!script) {

                    log('ace - no script child found');

                    return true;
                }

                t = script.innerHTML;

                manipulation.remove(script);

                div = el.cloneNode(false);

                div.removeAttribute('data-lang');
                div.removeAttribute('data-w');
                div.removeAttribute('data-h');

                el.classList.add('handled');

                manipulation.append(el, div);

                div.classList.remove('editor')
                div.classList.remove('syntax')

                const clear = document.createElement('div');

                clear.style.clear = 'both';

                manipulation.append(el, clear);

                // manipulation.after(el, clear.cloneNode(false))

                editor = ace.edit(div);

                var un = unique();

                editors[un] = editor;

                el.dataset.ace = un;

                var copy = document.createElement('div');
                copy.classList.add('copy');
                copy.innerHTML = '📋';

                manipulation.prepend(el, copy);

                editor.getSession().setTabSize(4);
                editor.setTheme("ace/theme/idle_fingers");
                editor.getSession().setUseWrapMode(true);

                d = el.dataset.lang;
                (d == 'js') && (d = 'javascript');
                d && editor.getSession().setMode("ace/mode/"+d);

                el.classList.contains('syntax') && editor.setReadOnly(true);  // false to make it editable
                //        editor.getSession().setMode("ace/mode/javascript");
                editor.setValue(_.unescape(t).replace(/^ *\n([\s\S]*?)\n *$/g, '$1'));
                // editor.setValue(t);
                editor.clearSelection();
                // editor.setOptions({
                //     maxLines: Infinity
                // });


                var heightUpdateFunction = function() {

                    // http://stackoverflow.com/questions/11584061/
                    var newHeight =
                        editor.getSession().getScreenLength()
                        * editor.renderer.lineHeight
                        + editor.renderer.scrollBar.getWidth();

                    log('new height', newHeight);

                    var h = newHeight.toString();

                    // h += 1000;

                    h += 'px';

                    div.style.height = h;

                    // Array.prototype.slice.call(document.querySelector('.editor').querySelectorAll('[class]'))
                    //     .map(e => e.style.height = h)
                    // ;
                    // $('#editor').height(newHeight.toString() + "px");
                    // $('#editor-section').height(newHeight.toString() + "px");

                    // This call is required for the editor to fix all of
                    // its inner structure for adapting to a change in size
                    editor.resize();
                };

                // Set initial size to match initial content
                heightUpdateFunction();

                // Whenever a change happens inside the ACE editor, update
                // the size again
                editor.getSession().on('change', heightUpdateFunction);

            })
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.doace();
    })

}());

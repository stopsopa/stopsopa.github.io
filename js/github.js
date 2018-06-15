
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
.github-link {
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
.github-link:hover {
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
.github-profile {
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
.github-profile:hover {
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
    ].forEach(u => {

        // https://stackoverflow.com/a/524721
        var head = document.head || document.getElementsByTagName('head')[0],
            script = document.createElement('script');

        // script.async = false;

        script.setAttribute('src', u);

        head.appendChild(script);
    })
}());

// ace editor
(function () {

    var p;

    window.doace = function () {

        if (!p) {

            p = new Promise(function (resolve) {
                (function run() {
                    if (window._) {
                        resolve()
                    }
                    else {
                        setTimeout(run, 100);
                    }
                }());
            });
        }

        p.then(function () {
            Array.prototype.slice.call(document.querySelectorAll('.editor, .syntax')).forEach(function (el) {

                if (el.classList.contains('handled')) {

                    log('ace - handled')

                    return true;
                }

                var script, editor, div, t = '', d;

                script = el.querySelector('script, textarea');

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

                el.classList.add('handled');

                manipulation.append(el, div);

                div.classList.remove('editor')
                div.classList.remove('syntax')

                const clear = document.createElement('div');

                clear.style.clear = 'both';

                manipulation.append(el, clear);

                // manipulation.after(el, clear.cloneNode(false))

                editor = ace.edit(div);

                window.ed = editor

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

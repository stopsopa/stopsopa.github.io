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

    });
}());

// load common css and js

(function () {

    // <link rel="stylesheet" href="../../css/normalize.css">

    [
        '/css/normalize.css',
        '/css/main.css',
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
    ].forEach(u => {

        // https://stackoverflow.com/a/524721
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('script');

        style.type = "text/javascript";
        style.async = false;

        style.setAttribute('src', u);

        head.appendChild(style);
    })
}());

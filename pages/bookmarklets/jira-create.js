(function () {

    var log = (function () {
        try {

            return console.log;
        }
        catch (e) {

            return function () {}
        }
    }());

    var find = function (selector, parent) {

        if ( !parent) {

            parent = document;
        }

        var tmp= parent.querySelector(selector);

        if ( ! tmp ) {

            throw new Error('cant find element by selector: ' + selector);
        }

        return tmp;
    }

    function box(content, opt) {

        if ( ! opt ) {

            opt = {};
        }

        var div = document.createElement('div');

        div.style.position = 'fixed';
        div.style.zIndex = '10000000';
        div.style.top = '20%';
        div.style.left = '50%';
        div.style.border = '1px solid gray';
        div.style.backgroundColor = 'white';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.padding = '10px';
        opt.minHeight && (div.style.minHeight = opt.minHeight);
        div.style.cursor = 'pointer'

        div.innerText = String(content);

        document.body.appendChild(div);

        var close = function () {
            document.body.removeChild(div);
        };

        if (opt.autoclose) {

            setTimeout(close, Number.isInteger(opt.autoclose) ? opt.autoclose : 1000);
        }
        else {

            div.addEventListener('click', close);
        }
    }

    try {

        var doc = find('#project-field');

        doc.style.maxWidth = 'none';

        var parent = doc.parentNode;

        parent.style.maxWidth = 'none';

        box("All good", {autoclose: 200});
    }
    catch (e) {

        box(e, {minHeight: '200'});
    }
}());
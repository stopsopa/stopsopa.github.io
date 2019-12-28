/**
 * ver 1 date: 2015-08-05
 * require: URI.js 1.16.0 http://medialize.github.io/URI.js/
 * 
    var update = $.urlstate({
        collection: {
            j : function (s, value) {

                if (s === 'def')
                    return 'defjeden';

                var field = $('[name="jeden"]');

                if (s === 'read')
                    return field.val();

                field.val(value);
            },
            t : function (s, value) {

                if (s === 'def')
                    return 'deftrzy';

                var field = $('[name="trzy"]');

                if (s === 'read')
                    return field.val();

                field.val(value);
            },
        }
    });

    $('[data-change]').on('keyup', function () {
        // return entire ulr
        var url = update();
        log('url after change: "'+url+'"')
    });

    // get data in object form from url (only from url)
    update.get()

     // get defaults and override them by data from url
     update.defurl()

     // get defaults and override them by data from form
     update.defform()

    // setup in url
    update.set({j: "f", d: "s", t: "f"})

 */
;(function ($){

    var flipget = (function (w, c) {
        for (var i in c)
            c[c[i]] = i;
        return function (s) {
            s = s.split('');
            for (var i = 0, l = s.length ; i < l ; ++i )
                if (c[s[i]]) s[i] = c[s[i]];
            return s.join('');
        };
    })(this, {
        ' ' : '.',
        '"' : '!',
        ':' : '-',
        '{' : '(',
        '}' : ")",
        '?' : "_",
        '&' : "~",
        ',' : "*"
    });

    var key = 'permalink';

    $.urlstate = function (opt) {
        function isObject(obj) {
            var type = typeof obj;
            return type === 'function' || type === 'object' && !!obj;
        };
        function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };
        function each(obj, fn, context) {
            if (isArray(obj)) {
                for (var i = 0, l = obj.length ; i < l ; ++i)
                    fn.call(context, obj[i], i);
            }
            else if (isObject(obj)) {
                for (var i in obj)
                    fn.call(context, obj[i], i);
            }
        }
        function def() {
            var d = {};
            for (var i in opt.collection) {
                d[i] = opt.collection[i]('def');
            }
            return d;
        }
        function form() {
            var d = {};
            for (var i in opt.collection) {
                d[i] = opt.collection[i]('read');
            }
            return d;
        }
        function filtered(collection) {
            var d = def();

            var list = {};
            for (var i in collection) {
                if (d[i] !== collection[i]) {
                    list[i] = collection[i];
                }
            }

            return clear(list);
        }
        function clear(d) {

            each(d, function (val, key) {
//                           if (typeof val == 'string' && !val) {
//                               delete d[key];
//                           }
               if (isObject(d) || isArray(d)) {
                   d[key] = clear(d[key]);
                   if (jQuery.isEmptyObject(d[key])) {
                       delete d[key];
                   }
               }
            });

            return d || {};
        }

        opt = $.extend({
            collection: {
                // klucz: funkcja -
                // klucz to nazwa pod jaką będzie przechowywany (na przykład w url parametr)
                // funkjca gdy dostaje true to ma czytać wartość, gdy dostaje false ma ustawić wartość (na przykład w polu input)
                // gdy dostaje undefined ma zwrócić wartość domyślną
//                            j : function (s, value, key) {
//
//                                if (s === 'def')
//                                    return 'defjeden';
//
//                                var field = $('[name="jeden"]');
//
//                                if (s === 'read')
//                                    return field.val();
//
//                                field.val(value);
//                            },
            },
            set: function (data) {
                var k = new URI(location.href);

                var d = {};
                d[key] = flipget(JSON.stringify(data));

                k.query(d);

                var url = k.toString();

                url = url.replace(/%28/g, '(');
                url = url.replace(/%29/g, ')');
                url = url.replace(/%21/g, '!');
                url = url.replace(/%5C/g, '\\');
                url = url.replace(/%2A/g, '*');

                history.replaceState({}, "", url);

                return url;
            }, // zapis - na przykład do url
            get: function () {

                var k = new URI(location.href);

                k = k.query(true);

                if (k[key])
                    return JSON.parse(flipget(k[key]));

                return {};
            }, // odczyt - na przykład z url
            defurl: function () {
                return $.extend(def(), this.get());
            },
            defform: function () {
                return $.extend(def(), form());
            }
        }, opt || {});

        var read = opt.get() || def();

        if (read) {
            var d = def();

            read = $.extend(d, read);

            for (var i in read) {
                if (opt.collection[i]) {
                    opt.collection[i]('write', read[i]);
                }
                else {
                    log("key '"+i+"' is not exist in collection");
                }
            }
        }

        var up = function update() {

            var read = {}
            for (var i in opt.collection) {
                read[i] = opt.collection[i]('read');
            }

            return opt.set(filtered(read));
        }

        for (var i in opt) {
            up[i] = opt[i];
        }

        return up;
    }
})(jQuery);
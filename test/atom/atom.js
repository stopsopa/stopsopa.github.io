/**
 * @author Szymon Działowski
 * @date 2018-03-12 09:00:08
 * @version v2.0.0
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.atomInterval = factory());
        });
    } else {
        // Browser globals
        root.atomInterval = factory();
    }
}(typeof self === 'undefined' ? this : self, function () {

    function isObject(a) {
        return (!!a) && (a.constructor === Object);
    };

    var stack   = [],
        len     = 0,
        tool    = {},
        handler,
        interval,
        milliseconds = false,
        t, i
    ;

    function unbind() {

        clearInterval(handler);

        handler = false;
    }

    function bind(rebind) {

        if (len) {

            if (handler && !rebind) {

                return tool;
            }

            unbind();

            if (milliseconds === false) {

                return tool;
            }

            interval || (interval = 1000);

            if (interval < 300) {

                interval = 300;
            }

            var fn = function () {

                t = new Date();

                t.setTime(t.getTime() + milliseconds);

                for ( i = 0 ; i < len ; i += 1 ) {

                    stack[i](t, function () {
                        tool.unsubscribe(stack[i]);
                    });
                }
            };

            fn();

            handler = setInterval(fn, interval);
        }
        else {

            unbind();
        }

        return tool;
    };

    /**
     * run(60 * 60 * 1000) - one hour
     */
    tool.run = function (argMilliseconds, argInterval) {

        interval        = argInterval;

        if (argMilliseconds) {

            milliseconds    = argMilliseconds;
        }

        bind(true);
    }

    /**
     * atomInterval.runPromise(new Promise(resolve => setTimeout(resolve, 5000, 60 * 60 * 2000)));
     */
    tool.runPromise = function (promise) {

        promise.then(function (arg) {

            var interval, milliseconds;

            if (isObject(arg)) {

                milliseconds    = arg.milliseconds;

                interval        = arg.interval;
            }
            else {

                milliseconds = arg;
            }

            return tool.run(milliseconds, interval);
        });

        return tool;
    };

    tool.clearStack = function () {

        tool.stop();

        stack = [];

        len = 0;

        return tool;
    }

    tool.stop = function () {

        unbind();

        milliseconds = false;

        return tool;
    }

    tool.subscribe = function (fn) {

        if (typeof fn === 'function') {

            stack.push(fn);

            len = stack.length;

            bind();

            return tool;
        }

        throw "atomInterval.subscribe(fn) - fn is not a function";
    };

    tool.unsubscribe = function (fn) {

        for (var i = 0, l = stack.length ; i < l ; i += 1 ) {

            if (stack[i] === fn) {

                tool.unsubscribeByIndex(i);

                break;
            }
        }

        return tool;
    };

    tool.unsubscribeByIndex = function (index) {

        stack.splice(index, 1);

        len = stack.length;

        bind();

        return tool;
    };

    return tool;

}));




// atomInterval.runPromise(new Promise(resolve => {
//
//     // http://www.navi.pl/katalog/time.php
//
//     var data = '2016-03-12-10-00-00-613479'; // fake for test
//
//     var i = data.split('-'); // 2013-11-09-11-05-51-911664
//     var f = new Date();
//     var g = new Date();
//     g.setFullYear(i[0]);  // 2013
//     g.setMonth(i[1] - 1);  // 11
//     g.setDate(i[2]);  // 09
//     g.setHours(i[3]);  // 11
//     g.setMinutes(i[4]);  // 05
//     g.setSeconds(i[5]);  // 51
//     g.setMilliseconds(i[6] / 1000);  // 911664
//
//     resolve(g.valueOf() - f.valueOf());
//
//     // or
//     //  resolve({
//     //      milliseconds    : g.valueOf() - f.valueOf(),
//     //      interval        : 2000
//     //  });
// }));
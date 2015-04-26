/**
 * is crossdomain: 
   https://github.com/padolsey-archive/jquery.fn/blob/master/cross-domain-ajax/jquery.xdomainajax.js
   
    var protocol = location.protocol,
        hostname = location.hostname,
        exRegex = RegExp(protocol + '//' + hostname),
        YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?callback=?',
        query = 'select * from html where url="{URL}" and xpath="*"';
    
    function isExternal(url) {
        return !exRegex.test(url) && /:\/\//.test(url);
    }
 */

var jsonp = (function (d, w, namespaces) {  
    function log(l) {try {console.log(l);}catch (e) {}};
    w[namespaces] || (w[namespaces] = {});
    
    function getcallname() {
        var m = '_'+(1*new Date());
        return {
            fn   : m,
            name : namespaces+'.'+m
        };
    }
    function _a(a) {
        return Array.prototype.slice.call(a, 0);
    }
    function isFunction (a) { // taken from underscore.js
        return typeof a == 'function' || false;
    };
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
    function noFunction(a) {
        var o;
        if (isArray(a)) {
            o = false;
            var obj = [];
        }
        else if (isObject(a)) {
            o = true;
            var obj = {};
        }
        else
            return a;

        each(a, function (v, k) {
            isFunction(v) || ( o ? obj[k] = noFunction(v) : obj.push(noFunction(v)) );
        });

        return obj;
    }
    function serialize(data) {
        if (isObject(data)) {
            var d = [];
            each(data, function (val, key) {
                d.push(encodeURIComponent(key)+'='+encodeURIComponent(val));
            }); 
            return d.join('&');
        }
        return '';
    }
    /**
     * do kodowania parametrów url używać encodeURIComponent
     */
    return function jsonp(url, fn, data, callbackparamname) { // jsonp gdy nie ma cors
        callbackparamname || (callbackparamname = 'callback');
        data || (data = {});  
        var a = d.createElement('script'),
            h = d.getElementsByTagName('script')[0],
            t = getcallname();
        a.async = 1;
        w[namespaces][t.fn] = function () {
            fn.call(this, _a(arguments)[0]);
            // clean up namepsace
            delete w[namespaces][t.fn];
            (h = d.getElementsByTagName('script')[0]) && h.parentNode.removeChild(a);
        };
        data[callbackparamname] = t.name;
        data = serialize(data);        
        (data.length) && (url += (url.indexOf('?') > -1 ? '&' : '?') + data);
        a.src   = url;
        h.parentNode.insertBefore(a, h);
    }    
})(document, window, 'jsonpcallbacknamespaces');


jsonp.html = function (url, fn) {
    jsonp('http://query.yahooapis.com/v1/public/yql', fn, {
        //format : 'xml',
        q : 'select * from html where url="' + url + '"'
    });
}

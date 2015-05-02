/**
 * @author Szymon Działowski
 * @homepage https://bitbucket.org/stopsopa/jquery.line
 * @ver 1.0 2014-07-06
 * @ver 1.1 2014-07-07 upgrades, corrections
 * @ver 1.2 2015-05-01 drawing line by rad/ang and distance from point x and x, fix manual
 */

(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
})((function (name, pi) {
    return function ($) {
        function log(l) {try {console.log(l);}catch (e) {}};
        function error(l) {try {console.error(l);}catch (e) {}};
        function _thw(message) {throw "plugin jQuery(...)."+name+"() : "+message};
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
        function angToRad(ang) {
            return ang * (pi / 180);
        }
        function radToAng(rad) {
            return rad * (180 / pi) ;
        }
        // calc distance between two points
        function calcDistance(x1, y1, x2, y2) { // http://www.gwycon.com/calculating-the-distance-between-two-pixels/
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }
        // count angle in radians
        function calcAngleRad(x1, y1, x2, y2) {
            return Math.atan2( (y2 - y1) , (x2 - x1) );
        }
        // count angle in degrees
        function calcAngle(x1, y1, x2, y2) {
            var a = calcAngleRad(x1, y1, x2, y2) * (180 / pi); 
            return (a < 0) ? (a += 360) : a;
        }        
        function calcXYOffsetByVectorAngleRad(rad, dis) {
            return { // http://stackoverflow.com/a/10962780
                x : Math.cos(rad) * dis,
                y : Math.sin(rad) * dis
            }
        }        
        function calcXYOffsetByVectorAngle(ang, dis) {
            return calcXYOffsetByVectorAngleRad(angToRad(ang), dis); 
        }        
        // count correction
        function correct(x1, y1, x2, y2, o, ang) {
            ang || (ang = calcAngle(x1, y1, x2, y2));

            var hw  = o.width/2;
            var hwo = hw // originial

            var sw = false;

            if ($.isNumeric(o.correct)) {
                var c = o.correct;
                switch(true) {
                    case o.correctpos == 'normal':
                        hw += c;
                        break;
                    case o.correctpos == 'top'    && (ang > 90 && ang < 270) : 
                        sw = true;
                        c = - Math.abs(c); 
                        break;
                    case o.correctpos == 'bottom' && (ang < 90 || ang > 270) :  
                        sw = true;
                        c = - Math.abs(c); 
                        break;
                    case o.correctpos == 'left'   && (ang > 0 && ang < 180) :  
                        sw = true;
                        c = - Math.abs(c); 
                        break;
                    case o.correctpos == 'right'  && (ang < 0 || ang > 180) :
                        sw = true;
                        c = - Math.abs(c);  
                        break;
                }
                hw += c;
            }

            var rad = calcAngleRad(x1, y1, x2, y2); // radians
            var radminhalf = (rad - (pi / 2));      // radians minus half radian

            var c = {};
            if (o.correct === false) {
                c.x = c.y = c.oy = c.ox = 0;
            }
            else {
                c.y  = Math.sin(radminhalf) * hw;
                c.x  = Math.cos(radminhalf) * hw;
                c.oy = Math.sin(radminhalf) * hwo; // without correction
                c.ox = Math.cos(radminhalf) * hwo; // without correction
            }
            c.ang = ang;
            c.rad = rad
            c.ox2 = c.ox * 2;
            c.oy2 = c.oy * 2;
            c.x1  = x1;
            c.y1  = y1;
            c.x2  = x2;
            c.y2  = y2;

            if (sw) {  
                c.ax = c.x1 - c.ox2;
                c.ay = c.y1 - c.oy2;

                c.bx = c.ax + c.x;
                c.by = c.ay + c.y;

                c.cx = c.x2 + c.x
                c.cy = c.y2 + c.y;

                c.dx = c.cx - c.ox2;
                c.dy = c.cy - c.oy2;
            }
            else {            
                c.bx = c.x1 + c.x;
                c.by = c.y1 + c.y;

                c.ax = c.bx - c.ox2;
                c.ay = c.by - c.oy2;

                c.dx = c.x2 + c.x;
                c.dy = c.y2 + c.y;

                c.cx = c.dx - c.ox2
                c.cy = c.dy - c.oy2;
            }

            return c;
        }
        /**
         * @returns jQuery object representing line
         * var linediv =                   $.line(x1, y1, x2, y2, opt, callback);
         * var linediv = $('parent element').line(x1, y1, x2, y2, opt, callback);
         * var linediv = $('parent element').line(x1, y1, {ang: 45, dis: 200}, opt, callback);
         * var linediv =                   $.line(x1, y1, {ang: 45, dis: 200}, opt, callback);
         */                  //0   1   2   3   4    5          
        $.fn[name] = function (x1, y1, x2, y2, opt, callback) {                        
            
            if (isObject(x2)) {
                var k = 0, a = _a(arguments); 
                
                if (typeof x2.ang != 'undefined') 
                    k = calcXYOffsetByVectorAngle(x2.ang, x2.dis); 
                
                else if (typeof x2.rad != 'undefined') 
                    k = calcXYOffsetByVectorAngleRad(x2.rad, x2.dis);                                     
                
                else _thw("Arguments incomplete: "+JSON.stringify(a));                                
                
                a[5] = a[4];
                a[4] = a[3];
                a[2] = x1 + k.x;
                a[3] = y1 + k.y;
                
                return $.fn[name].apply(this, a);
            }
            
            if (isFunction(opt)) {
                callback = opt;
            }
            else if (isFunction(callback)) {
                opt = callback;
            }

            opt || (opt = {});

            if ($(this).length > 1) 
                throw "$(this) is more then one element";            
             
            var o = {
                style: 'solid',
                width: 1,
                color: 'black',
                
                cls: 'jqline',
                id: false,
                correct: true, // bool|int - corection of position, give integer to move 
                correctpos: 'normal', // normal, top, bottom, left, right
                css: {
                    height: '0',
                    zIndex: '999',
                    zoom: 1
                }
            } 
            
            if (opt.css) {
                $.extend(o.css, opt.css);
                opt.css = o.css;
            }
            
            o           = $.extend(true, o, opt || {});            
            o.create    = opt.create ? $(opt.create) : $('<div></div>');
            var ang     = calcAngle(x1, y1, x2, y2);    // degrees
            var c       = correct(x1, y1, x2, y2, o/* half of line width */, ang);
            c.distance  = calcDistance(x1, y1, x2, y2);

            o.create
                .css({
                    borderTop: o.width+'px '+o.style+' '+o.color,
                    position: 'absolute',
                    width: c.distance + 'px',
                    '-webkit-transform': 'rotate(' + ang + 'deg)',
                    '-moz-transform': 'rotate(' + ang + 'deg)',
                    '-ms-transform': 'rotate(' + ang + 'deg)',
                    '-o-transform': 'rotate(' + ang + 'deg)',
                    transform: 'rotate(' + ang + 'deg)',

                    'transform-origin' :  '0 0',
                    '-ms-transform-origin' : '0 0', /* IE 9 */
                    '-webkit-transform-origin' : '0 0', /* Chrome, Safari, Opera */                

                    left : (x1 + c.x)+'px',
                    top  : (y1 + c.y)+'px'
                })
                .css(o.css)
            ;

            o.cls && o.create.addClass(o.cls);
            o.id  && o.create.attr('id', o.id);

            o.create.appendTo(this);

            (isFunction(callback)) && callback(o.create, o, c);

            return o.create;
        };
        /**
         * @returns jQuery object representing line
         */
        $[name] = function () {
            var b = $('body');
            return b[name].apply(b, arguments);
        };

        // expose tools to use outside
        $[name].radToAng                        = radToAng;
        $[name].angToRad                        = angToRad;
        $[name].calcDistance                    = calcDistance;
        $[name].calcAngleRad                    = calcAngleRad;
        $[name].calcAngle                       = calcAngle;
        $[name].calcXYOffsetByVectorAngle       = calcXYOffsetByVectorAngle;
        $[name].calcXYOffsetByVectorAngleRad    = calcXYOffsetByVectorAngleRad;
    }
})('line', Math.PI)); // to change name of plugin simply change it in this place
/**
 * @author Szymon Działowski
 * @homepage https://bitbucket.org/stopsopa/jquery.line
 * @ver 1.0 2014-07-06
 * @ver 1.1 2014-07-07 upgrades, corrections
 */
;(function ($) {
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
        var a = calcAngleRad(x1, y1, x2, y2) * (180 / Math.PI); 
        return (a < 0) ? (a += 360) : a;
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
        var radminhalf = (rad - (Math.PI / 2));      // radians minus half radian
        
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
     */
    $.fn.line = function (x1, y1, x2, y2, opt, callback) {
        
        opt || (opt = {});

        if ($(this).length > 1) 
            throw "$(this) is more then one element";            
            
        var o = $.extend(true, {
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
        }, opt || {});

        o.create = opt.create ? $(opt.create) : $('<div></div>');
        opt.css && (o.css = opt.css);

        var ang  = calcAngle(x1, y1, x2, y2);    // degrees
        
        var c = correct(x1, y1, x2, y2, o/* half of line width */, ang)
        c.distance = calcDistance(x1, y1, x2, y2);
        
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

                top  : (y1 + c.y)+'px',
                left : (x1 + c.x)+'px'
            })
            .css(o.css);

        o.cls && o.create.addClass(o.cls);
        o.id  && o.create.attr('id', o.id);

        o.create.appendTo(this);
        
        (typeof callback == 'function') && callback(o.create, o, c);
        
        return o.create;
    };
    /**
     * @returns jQuery object representing line
     */
    $.line = function (x1, y1, x2, y2, opt, callback) {
        return $('body').line(x1, y1, x2, y2, opt, callback);
    };
})(jQuery);
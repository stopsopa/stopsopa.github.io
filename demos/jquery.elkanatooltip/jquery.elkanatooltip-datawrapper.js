/*!
 * This is ordinary plugin
 * $.position (from jQuery UI - v1.11.4) - 2015-04-23
 * but with changed namespaces:
 *
 *    $.fn.position -> $.fn.position_elkanatooltip
 * and
 *    $.ui.position -> $.ui.position_elkanatooltip
 *
 * to avoid conflict with user selected version of jQuery UI position
 * if you need jQuery UI position please include to project one more instance of this library
 *
 * Compressed manually by http://ganquan.info/yui/
 *
 * ----------- standard compressed plugin below ---------- vvv
 *
* http://jqueryui.com
* Includes: position.js
* Copyright 2015 jQuery Foundation and other contributors; Licensed MIT */
(function(a){if(typeof define==="function"&&define.amd){define(["jquery"],a)}else{a(jQuery)}}(function(b){
/*!
 * jQuery UI Position 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/position/
 */
(function(){b.ui=b.ui||{};var j,m,k=Math.max,p=Math.abs,n=Math.round,e=/left|center|right/,h=/top|center|bottom/,c=/[\+\-]\d+(\.[\d]+)?%?/,l=/^\w+/,d=/%$/,g=b.fn.position;function o(s,r,q){return[parseFloat(s[0])*(d.test(s[0])?r/100:1),parseFloat(s[1])*(d.test(s[1])?q/100:1)]}function i(q,r){return parseInt(b.css(q,r),10)||0}function f(r){var q=r[0];if(q.nodeType===9){return{width:r.width(),height:r.height(),offset:{top:0,left:0}}}if(b.isWindow(q)){return{width:r.width(),height:r.height(),offset:{top:r.scrollTop(),left:r.scrollLeft()}}}if(q.preventDefault){return{width:0,height:0,offset:{top:q.pageY,left:q.pageX}}}return{width:r.outerWidth(),height:r.outerHeight(),offset:r.offset()}}b.position_elkanatooltip={scrollbarWidth:function(){if(j!==undefined){return j}var r,q,t=b("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),s=t.children()[0];b("body").append(t);r=s.offsetWidth;t.css("overflow","scroll");q=s.offsetWidth;if(r===q){q=t[0].clientWidth}t.remove();return(j=r-q)},getScrollInfo:function(u){var t=u.isWindow||u.isDocument?"":u.element.css("overflow-x"),s=u.isWindow||u.isDocument?"":u.element.css("overflow-y"),r=t==="scroll"||(t==="auto"&&u.width<u.element[0].scrollWidth),q=s==="scroll"||(s==="auto"&&u.height<u.element[0].scrollHeight);return{width:q?b.position_elkanatooltip.scrollbarWidth():0,height:r?b.position_elkanatooltip.scrollbarWidth():0}},getWithinInfo:function(r){var s=b(r||window),q=b.isWindow(s[0]),t=!!s[0]&&s[0].nodeType===9;return{element:s,isWindow:q,isDocument:t,offset:s.offset()||{left:0,top:0},scrollLeft:s.scrollLeft(),scrollTop:s.scrollTop(),width:q||t?s.width():s.outerWidth(),height:q||t?s.height():s.outerHeight()}}};b.fn.position_elkanatooltip=function(A){if(!A||!A.of){return g.apply(this,arguments)}A=b.extend({},A);var B,x,v,z,u,q,w=b(A.of),t=b.position_elkanatooltip.getWithinInfo(A.within),r=b.position_elkanatooltip.getScrollInfo(t),y=(A.collision||"flip").split(" "),s={};q=f(w);if(w[0].preventDefault){A.at="left top"}x=q.width;v=q.height;z=q.offset;u=b.extend({},z);b.each(["my","at"],function(){var E=(A[this]||"").split(" "),D,C;if(E.length===1){E=e.test(E[0])?E.concat(["center"]):h.test(E[0])?["center"].concat(E):["center","center"]}E[0]=e.test(E[0])?E[0]:"center";E[1]=h.test(E[1])?E[1]:"center";D=c.exec(E[0]);C=c.exec(E[1]);s[this]=[D?D[0]:0,C?C[0]:0];A[this]=[l.exec(E[0])[0],l.exec(E[1])[0]]});if(y.length===1){y[1]=y[0]}if(A.at[0]==="right"){u.left+=x}else{if(A.at[0]==="center"){u.left+=x/2}}if(A.at[1]==="bottom"){u.top+=v}else{if(A.at[1]==="center"){u.top+=v/2}}B=o(s.at,x,v);u.left+=B[0];u.top+=B[1];return this.each(function(){var D,M,F=b(this),H=F.outerWidth(),E=F.outerHeight(),G=i(this,"marginLeft"),C=i(this,"marginTop"),L=H+G+i(this,"marginRight")+r.width,K=E+C+i(this,"marginBottom")+r.height,I=b.extend({},u),J=o(s.my,F.outerWidth(),F.outerHeight());if(A.my[0]==="right"){I.left-=H}else{if(A.my[0]==="center"){I.left-=H/2}}if(A.my[1]==="bottom"){I.top-=E}else{if(A.my[1]==="center"){I.top-=E/2}}I.left+=J[0];I.top+=J[1];if(!m){I.left=n(I.left);I.top=n(I.top)}D={marginLeft:G,marginTop:C};b.each(["left","top"],function(O,N){if(b.ui.position_elkanatooltip[y[O]]){b.ui.position_elkanatooltip[y[O]][N](I,{targetWidth:x,targetHeight:v,elemWidth:H,elemHeight:E,collisionPosition:D,collisionWidth:L,collisionHeight:K,offset:[B[0]+J[0],B[1]+J[1]],my:A.my,at:A.at,within:t,elem:F})}});if(A.using){M=function(Q){var S=z.left-I.left,P=S+x-H,R=z.top-I.top,O=R+v-E,N={target:{element:w,left:z.left,top:z.top,width:x,height:v},element:{element:F,left:I.left,top:I.top,width:H,height:E},horizontal:P<0?"left":S>0?"right":"center",vertical:O<0?"top":R>0?"bottom":"middle"};if(x<H&&p(S+P)<x){N.horizontal="center"}if(v<E&&p(R+O)<v){N.vertical="middle"}if(k(p(S),p(P))>k(p(R),p(O))){N.important="horizontal"}else{N.important="vertical"}A.using.call(this,Q,N)}}F.offset(b.extend(I,{using:M}))})};b.ui.position_elkanatooltip={fit:{left:function(u,t){var s=t.within,w=s.isWindow?s.scrollLeft:s.offset.left,y=s.width,v=u.left-t.collisionPosition.marginLeft,x=w-v,r=v+t.collisionWidth-y-w,q;if(t.collisionWidth>y){if(x>0&&r<=0){q=u.left+x+t.collisionWidth-y-w;u.left+=x-q}else{if(r>0&&x<=0){u.left=w}else{if(x>r){u.left=w+y-t.collisionWidth}else{u.left=w}}}}else{if(x>0){u.left+=x}else{if(r>0){u.left-=r}else{u.left=k(u.left-v,u.left)}}}},top:function(t,s){var r=s.within,x=r.isWindow?r.scrollTop:r.offset.top,y=s.within.height,v=t.top-s.collisionPosition.marginTop,w=x-v,u=v+s.collisionHeight-y-x,q;if(s.collisionHeight>y){if(w>0&&u<=0){q=t.top+w+s.collisionHeight-y-x;t.top+=w-q}else{if(u>0&&w<=0){t.top=x}else{if(w>u){t.top=x+y-s.collisionHeight}else{t.top=x}}}}else{if(w>0){t.top+=w}else{if(u>0){t.top-=u}else{t.top=k(t.top-v,t.top)}}}}},flip:{left:function(w,v){var u=v.within,A=u.offset.left+u.scrollLeft,D=u.width,s=u.isWindow?u.scrollLeft:u.offset.left,x=w.left-v.collisionPosition.marginLeft,B=x-s,r=x+v.collisionWidth-D-s,z=v.my[0]==="left"?-v.elemWidth:v.my[0]==="right"?v.elemWidth:0,C=v.at[0]==="left"?v.targetWidth:v.at[0]==="right"?-v.targetWidth:0,t=-2*v.offset[0],q,y;if(B<0){q=w.left+z+C+t+v.collisionWidth-D-A;if(q<0||q<p(B)){w.left+=z+C+t}}else{if(r>0){y=w.left-v.collisionPosition.marginLeft+z+C+t-s;if(y>0||p(y)<r){w.left+=z+C+t}}}},top:function(v,u){var t=u.within,C=t.offset.top+t.scrollTop,D=t.height,q=t.isWindow?t.scrollTop:t.offset.top,x=v.top-u.collisionPosition.marginTop,z=x-q,w=x+u.collisionHeight-D-q,A=u.my[1]==="top",y=A?-u.elemHeight:u.my[1]==="bottom"?u.elemHeight:0,E=u.at[1]==="top"?u.targetHeight:u.at[1]==="bottom"?-u.targetHeight:0,s=-2*u.offset[1],B,r;if(z<0){r=v.top+y+E+s+u.collisionHeight-D-C;if(r<0||r<p(z)){v.top+=y+E+s}}else{if(w>0){B=v.top-u.collisionPosition.marginTop+y+E+s-q;if(B>0||p(B)<w){v.top+=y+E+s}}}}},flipfit:{left:function(){b.ui.position_elkanatooltip.flip.left.apply(this,arguments);b.ui.position_elkanatooltip.fit.left.apply(this,arguments)},top:function(){b.ui.position_elkanatooltip.flip.top.apply(this,arguments);b.ui.position_elkanatooltip.fit.top.apply(this,arguments)}}};(function(){var u,w,r,t,s,q=document.getElementsByTagName("body")[0],v=document.createElement("div");u=document.createElement(q?"div":"body");r={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"};if(q){b.extend(r,{position:"absolute",left:"-1000px",top:"-1000px"})}for(s in r){u.style[s]=r[s]}u.appendChild(v);w=q||document.documentElement;w.insertBefore(u,w.firstChild);v.style.cssText="position: absolute; left: 10.7432222px;";t=b(v).offset().left;m=t>10&&t<11;u.innerHTML="";w.removeChild(u)})()})();var a=b.ui.position_elkanatooltip}));

/**
 *
 * @author Szymon Działowski
 * @ver 1.0 - 2015-04-23
 * @homepage https://github.com/stopsopa/elkanatooltip
 * @demo http://stopsopa.bitbucket.org/demos/elkanatooltip/demo.html <--- to edit later
 *
 * Copyright (c) 2015 Szymon Działowski
 * Released under the MIT license
 * http://en.wikipedia.org/wiki/MIT_License
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
})((function (name, base) {
    return function ($) {
        function log(l){try{console.log(l)}catch(e){}};
        function error(l){try{console.error(l)}catch(e){}};
//        function log(l) {};

        function isFunction (a) { // taken from underscore.js
            return typeof a == 'function' || false;
        };
        function isString(a) {
            return typeof a == 'string';
        }
        function isObject(obj) {
            var type = typeof obj;
            return type === 'function' || type === 'object' && !!obj;
        };
        function _a(a) {
            return Array.prototype.slice.call(a, 0);
        };

        return $.fn[name] = function () {
            var tooltip = arguments[0], o = arguments[1], a = _a(arguments);

            o = $.extend({
                showon              : 'click',      // false, 'click', 'hover', 'hoverclick'
                hideonclick         : 'document',   // false, 'notooltip', 'target', 'document'
                hideonmouseleave    : 'both',       // false, 'both', 'target'

                show                : false // parameter of base plugin elkanatooltip, to force hiding of tooltip
            }, o || {});

            $(this).each(function () {
                var t = $(this);  // target do którego będą dowiązywane eventy pokazująci i chowające - domyślnie jest to source

                if (typeof tooltip == 'undefined')
                    return error("First argument cannot be undefined");

                if (isFunction(tooltip)) { // if retrieved by function
                    tooltip = tooltip.apply(t, a);
                }
                else if (typeof tooltip == 'string') { // if selector
                    tooltip = $(tooltip);
                }

                t[base].apply(t, a);

                if (isString(o.showon)) {
                    switch (true) {
                        case o.showon.indexOf('click') > -1:
                            log('click')
                            break;
                        case o.showon.indexOf('hover') > -1:
                            log('hover')
                            break;
                    }
                }
                else {
                    log('showon disabled')
                }

                if (isString(o.hideonclick)) { // false, 'notooltip', 'target', 'document'
                    switch (o.hideonclick) {
                        case 'notooltip':
                            log('notooltip')
                            break;
                        case 'target':
                            log('target')
                            break;
                        case 'document':
                            log('document')
                            break;
                    }
                }
                else {
                    log('hideonclick disabled')
                }

                if (isString(o.hideonmouseleave)) { // false, 'both', 'target'
                    switch (o.hideonclick) {
                        case 'both':
                            log('both')
                            break;
                        case 'target':
                            log('target')
                            break;
                    }
                }
                else {
                    log('hideonmouseleave disabled')
                }
            });
        };

        function error(l) {try {console.error(l);}catch (e) {}};
        function _thw(message) {throw "plugin jQuery(...)."+name+"() : "+message};

        // cource; http://stackoverflow.com/a/13008597
        function getTransitionTime(obj) {
            var s = obj.css('transition-duration').replace(/^(\d+(\.\d+)?([a-z]+)?).*$/, '$1');
            if (s) {
                if (s.indexOf('ms') > -1) {
                    return parseInt(s.replace('ms',''));
                }
                if (s.indexOf('s') > -1) {
                    s = s.replace('s','');
                    return s * 1000;
                }
            }
            return 0;
        }
        function _a(a) {
            return Array.prototype.slice.call(a, 0);
        }

        var transitionend = (function () {
            var i,
                undefined,
                el = document.createElement('div'),
                transitions = {
                    transition:'transitionend',
                    OTransition:'otransitionend',  // oTransitionEnd in very old Opera
                    MozTransition:'transitionend',
                    WebkitTransition:'webkitTransitionEnd'
                };

            for (i in transitions) {
                if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
                    return transitions[i];
                }
            }
        })();

        var positions = (function () {
            function eq(i, k) { return (Math.abs(i-k) < 3) }
            function calc(t) {
                return {
                    l       : t.left,
                    t       : t.top,
                    r       : t.left   + t.width,
                    b       : t.top    + t.height,
                    hclt    : t.top    + (t.height / 2), // horizontal center line top
                    vcll    : t.left   + (t.width / 2) // vertical center line left
                };
            }
            return function (e) {
                var k = calc(e.target);  // target coordinates
                var t = calc(e.element); // tooltip coordinates

                var p = {
                    h  : false, // l, r
                    v  : false, // t, b
                    hc : false, // t, b - horizontal correction, if arrow should be moved top or down from standard position
                    vc : false  // l, r - vertical correction, if arrow should be moved left or fight from standard position
                };

                eq(t.r, k.l) && (p.h = 'r');
                eq(t.l, k.r) && (p.h = 'l');
                if (p.h) {
                    p.vc = (k.t - t.t) + (k.b - t.b)
                    p.vc = eq(p.vc, 0) ? false : (p.vc > 0) ? 'b' : 't';
                }

                eq(t.b, k.t) && (p.v = 'b');
                eq(t.t, k.b) && (p.v = 't');
                if (p.v) {
                    p.hc = (k.l - t.l) + (k.r - t.r)
                    p.hc = eq(p.hc, 0) ? false : (p.hc > 0) ? 'r' : 'l';
                }

                return {
                    k : k,
                    t : t,
                    p : p
                }
            }
        })();

        // https://gist.github.com/WebReflection/2953527
        // http://jsfiddle.net/mwcs8o4e/3/
        (function(window, nextTick, process, prefixes, i, p, fnc) {
            p = window[process] || (window[process] = {});
            while (!fnc && i < prefixes.length) {
                fnc = window[prefixes[i++] + 'equestAnimationFrame'];
            }
            p[nextTick] = p[nextTick] || (fnc && fnc.bind(window)) || window.setImmediate || window.setTimeout;
        })(window, 'nextTick', 'process', 'r webkitR mozR msR oR'.split(' '), 0);

        $.fn[name] = function () {
            var n, t = $(this), tooltip = arguments[0], o = arguments[1];

            (t.length > 1) && _thw("can't be used on more then one element at once");

            if (typeof tooltip == 'boolean' || !arguments.length) { // show, hide or return settings

                if (typeof o != 'string')
                    log("No class specified, use default '"+ (o = name) +"'");

                o = t.data(o);

                o || _thw("DOM data not found");

                if (!arguments.length)
                    return o;

                if (tooltip) { // show
                    o.place && $(o.tooltip).appendTo(o.place);

                    ;(function (mid) {
                        var visiblebefore = o.tooltip.is(':visible'), k, prepare = true, oo = $.extend({}, o.position, {
                            of: t
                        });

                        oo.using = function(p, el, is, n, i) {
                            k = positions(el);

                            i   = o.tooltip.find('> i');
                            is  = i.length;
                            n   = $('<i></i>');
                            is ? i.replaceWith(n) : n.appendTo(o.tooltip);
                            o.i = n;

//                            if (prepare) {
                                o.tooltip.removeClass('v-t h-r v-b h-l vc-t hc-r vc-b hc-l h-center v-middle '+o.aanim)
//                            }
//                            else {
//                                o.tooltip.removeClass('vc-t hc-r vc-b hc-l h-center v-middle '+o.aanim)
//                            }
                            o.tooltip
                                .css({
                                    top  : p.top + (o.offset.top || 0),
                                    left : p.left + (o.offset.left || 0)
                                });

                            (el.vertical   === 'middle') && o.tooltip.addClass('v-'+el.vertical);
                            (el.horizontal === 'center') && o.tooltip.addClass('h-'+el.horizontal);
                            k.p.h  && o.tooltip.addClass('h-'+k.p.h);
                            k.p.v  && o.tooltip.addClass('v-'+k.p.v);
                            k.p.hc && o.tooltip.addClass('hc-'+k.p.hc);
                            k.p.vc && o.tooltip.addClass('vc-'+k.p.vc);

                            if (prepare) { // first call of this function needs to be executed only to this point, to setup margins of tooltip container
                                // in another call of this function everything else is also adjusted
                                prepare = false;
                                return;
                            }

                            var c = {};
                            if (el.horizontal === 'center') {
                                if      (k.p.hc === 'r')    c.left      = o.border + 'px';
                                else if (k.p.hc === 'l')    c.right     = o.border + 'px';
                                else                        c.left      = ((o.tooltip.outerWidth() / 2) - o.border) + 'px';
                            }
                            else if (k.p.hc === 'r')        c.right     = o.border + 'px';
                            else if (k.p.hc === 'l')        c.left      = o.border + 'px';

                            if (el.vertical === 'middle') {
                                if      (k.p.vc === 't')    c.bottom    = o.border + 'px';
                                else if (k.p.vc === 'b')    c.top       = o.border + 'px';
                                else                        c.top       = ((o.tooltip.outerHeight() / 2) - o.border) + 'px';
                            }
                            else if (k.p.vc === 'b')        c.bottom    = o.border + 'px';
                            else if (k.p.vc === 't')        c.top       = o.border + 'px';

                            o.i.css(c);
                        };

                        o.tooltip
                            .addClass(o.ashow)
                            .position_elkanatooltip(oo) // setup margin
                            .position_elkanatooltip(oo) // setup all rest
                            //.css({position: 'absolute'}) // i don't know why but jQuery UI position setup here 'relative' instead of 'absolute'
                            .addClass(o.astart)
                        ;

                        var visible = o.tooltip.is(':visible'),
                            afterShow = (function () {
                                var a = _a(arguments);
                                var t = this;
                                return function () {
                                    o.afterShow.apply(t, a);
                                }
                            }).call(t, o, visiblebefore, k);

                        if (visible) {
                            setTimeout(function() {
                                o.tooltip
                                    .addClass(o.aanim)
                                    .addClass(o.astop)
                                ;
                                afterShow();
                            }, 20);
                        }
                        else {
                            process.nextTick(function() {
                                o.tooltip
                                    .one(transitionend, afterShow)
                                    .addClass(o.aanim)
                                    .addClass(o.astop)
                                ;
                            });
                        }

                    })(o.show);

                    o.show = true;
                }
                else { // hide
                    var visiblebefore = o.tooltip.is(':visible'),
                        afterHide = (function () {
                            var a = _a(arguments);
                            var t = this;
                            return function () {
                                o.afterHide.apply(t, a);
                            }
                        }).call(t, o, visiblebefore);

                    if (getTransitionTime(o.tooltip)) {
                        o.tooltip.one(transitionend, function () {

                            if (!o.tooltip.hasClass(o.astop))
                                o.tooltip.removeClass(o.aanim+' '+o.astart+' '+o.ashow);

                            afterHide();
                        });
                    }
                    else {
                        o.tooltip.removeClass(o.aanim+' '+o.astart+' '+o.ashow);
                        afterHide();
                    }
                    o.tooltip.removeClass(o.astop);
                    o.show = false;
                }

                return t.data(o.cls, o);
            }

            o = $.extend(true, {
                show    : true, // show on start
                cls     : name, // main class, from this class depend entire layout and animations of tooltip
                ashow   : 'a-show',
                astart  : 'a-start',
                aanim   : 'a-anim',
                astop   : 'a-stop',
                place   : false, // (string|jQuery element) remove or create tooltip element in this container
                position: {  // options for inner jQuery UI position plugin
                    my: 'bottom',
                    at: 'top'
                },
                offset: {
                    top: false,
                    left: false
                },
                afterShow : $.noop,
                afterHide : $.noop,
            }, o || {});

            // preparing mode
            if (typeof tooltip == 'string')
                tooltip = $('<div></div>').html(tooltip);
            try {
                if (tooltip.parent().hasClass(o.cls)) {
                    tooltip = tooltip.parent();
                }
                else {
                    if (tooltip.data(o.cls))
                        return log('i found data, then exit')

                    ;(function () {
                        var is      = tooltip.parent().length,
                            div     = $('<div></div>');

                        if (o.place) {
                            $(o.place).append(div.append(tooltip));
                            tooltip = div;
                            o.place = false;
                        }
                        else {
                            if (is) {
                                var p = tooltip.parent();
                                div.appendTo(p)
                                tooltip.appendTo(div);
                                tooltip = div;
                            }
                            else {
                                div.appendTo('body')
                                tooltip.appendTo(div);
                                tooltip = div;
                            }
                        }

                        tooltip.addClass(o.cls);
                        o.i || (o.i = $('<i></i>').appendTo(tooltip));
                    })();
                }
            } catch(e) {
                log('exception: ');
                error(e)
            }

            // get width from css
            o.border || (o.border = (function (b, w) {
                b = $('<span></span>').appendTo('body').addClass(o.cls).addClass('test');
                w = parseInt(b.css('borderTopWidth'));
                b.remove();
                return w;
            })());

            o.tooltip = tooltip;

            t.data(o.cls, o);

            o.show && t[name](true, o.cls);

            return t;
        }
    }
})('elkana', 'elkanatooltip')); // to change name of plugin simply change it in this place
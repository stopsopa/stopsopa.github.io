
/**
 * Fallback dla window.console
 * @author Szymon Działowski
 * v 1.0 - 2013-06-08
 */  
(function () {

  window.console = (window.console || {});
  
  if (window.console._site) return;
  
  if (typeof console.dir != 'function')
    console.dir=(function(){return function a(h,b,c){var g="  ",c=(typeof c=="string"||typeof c=="number")?"["+c+"] => ":"";b=b||0;b||log(d("=--=",5)+"vvv");switch(typeof h){case"function":log(d(g,b)+c+"function()");break;case"boolean":log(d(g,b)+c+"bool: "+h+"");break;case"undefined":log(d(g,b)+c+'undef: "'+h+'"');break;case"string":log(d(g,b)+c+'str: "'+h+'"');break;case"number":log(d(g,b)+c+'num: "'+h+'"');break;case"object":if(h===null){log(d(g,b)+c+"null");break}log(d(g,b)+c+f+": <<<"+b+"<");var f=h instanceof Array?"array":"object";if(h instanceof Array){for(var e=0;e<h.length;e++){a(h[e],b+1,e)}}else{for(var e in h){a(h[e],b+1,e)}}log(d(g,b)+" >>>"+b+">");break}b||log(d("=--=",5)+"^^^");function d(l,m){m=m||0;var j="";for(var k=0;k<m;k++){j+=l}return j}}})();

  // make it safe to use console.log always
  window.console=(function(b,d,c,a){
    while(a=d.pop())
      b[a]=(b[a]||c);
    return b;
  })((window.console||{}),"_site,assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),function c(){});

  (function () {
    window.log = navigator.userAgent.match(/webkit/i) 
    ? function (msg,mode) { // webkit
      mode = mode || 'log';
      try {
        if (typeof msg == 'object')
          return console.dir(msg);
        if (mode === 'log') 
          return console.log('%c'+'['+((new Date()).getTime())+']'+msg,'color: black; background-color: #DBDBDB;-webkit-border-radius: 3px; padding: 0 3px;text-shadow: 0 0 1px gray;');
        console[mode](msg);
      }
      catch (e) {};
    } 
    : function (msg,mode) { // nie webkit
      mode = mode || 'log';
      try {
        if (typeof msg == 'object')
          return console.dir(msg);
        console[mode](msg);
      }
      catch (e) {};
    }
  })();
})();

$(function () { 
  
  
  
  
  (function () {
    // * @homepage http://stopsopa.bitbucket.org/?repo=kwotaslownie
    var uri = new URI(location.href);
    var get = uri.search(true);
    
    if (get['repo']) {
      log('jest');
    }
    
    
  })();
  
});
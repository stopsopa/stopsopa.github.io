/*
 * jQuery tooltip
 *
 * należy ustawić sobie w linii 38 element w którym będzie się zawartość wpisywać
 * 
 * 
 *
 *
 * 
 *   
 */
 /* DODAĆ TEN CSS : ---------------------------------------------

       .tip{
                position: absolute;
                z-index: 100000;
                border: 1px solid #444444; /*1px solid #FFD5AA;*/
   /*             background: #000; /* #F8FFBF;*/
   /*             color: #fff;  /*#000;*/
   /*             font: bold 80% Arial;
                padding: 5px;
                display: none;
                /*white-space: nowrap;*/
   /*             -moz-border-radius: 5px;
                -webkit-border-radius: 5px;
                border-radius: 5px;
                opacity: 0.9;
                filter: alpha(opacity=90);
            }

 */
(function($) {
  var title = '',
  tip = false,
  ajaxType = 'post';
  $.fn.extend({
    toolTip : function () {
      tip = $('<p class="tip"></p>').appendTo($('body'));   /////////// TUTAJ W RAZIE CZEGO DOPASOWAĆ /////////////////////
      return this.live('mouseenter', function(e){
        title = $(this).attr('title');
        //console.log(title);
        $(this).attr( 'title', '');
        if (typeof $(this).attr('get') !== 'undefined' || typeof $(this).attr('post') !== 'undefined') {
          if (typeof $(this).attr('post') !== 'undefined') ajaxType = 'post';
          else                                             ajaxType = 'get';
          var load = true; // aby zapobiedz ładowaniu spuźnionych odpowiedzi ajax

          $.ajaxSetup({
            data: {
              '<?php echo session_name(); ?>': 'ses'
              //'<?php echo session_name(); ?>': Ses.GetSessid()
            }
          });
          $.ajax({
            type: ajaxType,
            cache: false,
            data: eval('('+$(this).attr(ajaxType)+')'),
            url: title,
            context: this,
            beforeSend: function(){
              tip.html('<img src="./img/load.gif"/>').show(); 
              updatetip(e);
              $(document.body).bind('mousemove', updatetip);
              $(this).mouseleave( function(){
                load = false;
                tip.hide().empty().css({top: 0, left: 0} );
                $(this).attr( 'title', title );
                $(document.body).unbind('mousemove', updatetip);
                tip.unbind();
              });
            },
            timeoutNumber: 1000,
            error: function(){
              tip.html('Błąd').show();   
            },
            success: function(back){
              if (load)   {
                tip.html( back );
                updatetip(e);
              }
            }
          });
        }
        else if ($(this).attr('img') == 'img') {
          tip.html('<img src="'+title+'"/>').show(); 
          updatetip(e);
          $(document.body).bind('mousemove', updatetip);
          $(this).mouseleave( function(){
            load = false;
            tip.hide().empty().css({top: 0, left: 0} );
            $(this).attr( 'title', title );
            $(document.body).unbind('mousemove', updatetip);
            tip.unbind();
          });
        }
        else {
          tip.html( title ).show();
          updatetip(e);
          $(document.body).bind('mousemove', updatetip);
          $(this).mouseleave( function(){
            load = false;
            tip.hide().empty().css({top: 0, left: 0} );
            $(this).attr( 'title', title );
            $(document.body).unbind('mousemove', updatetip);
            tip.unbind();
          });
        }
      });
    }
  });
  function updatetip(e){
    var s= {},
      x = 10,
      h = tip,
      l = (e.pageX + x),
      t = (e.pageY + x),
      v = {
        l: $(window).scrollLeft(),
        t: $(window).scrollTop(),
        w: $(window).width(),
        h: $(window).height()
      };
    h.css({top: t + 'px', left: l + 'px'} );
    s = {
      w: h.width(),
      h: h.height()
    };
    if (v.l + v.w < s.w + l + (x*2)  && l > s.w )      h.css({left:  ( l - s.w  - (x*3)  ) + 'px'} );
    if (v.t + v.h < s.h + t + (x*3) && t > s.h)        h.css({ top:  ( t - s.h - (x*2) ) + 'px'} );
  }
})(jQuery);

/*
// STARA WTYCZKA -------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
;(function($) {
        var title = '',
            tip = false;
        $.fn.extend({
                monnaTip : function () {
                        tip = $('<p class="tip"></p>').appendTo(document.body);
                        return this.live('mouseenter', function(e){
                                            title = $(this).attr( 'title' );
                                            $(this).attr( 'title', '' );
                                            tip.html( title ).show();
                                            updatetip(e);
                                            $(document.body).bind('mousemove', updatetip);
                                            $(this).mouseleave( function(){
                                                tip.hide().empty().css({top: 0, left: 0} );
                                                $(this).attr( 'title', title );
                                                $(document.body).unbind('mousemove', updatetip);
                                                tip.unbind();

                                            });

                                         });
                 }
        });
        function updatetip(e){
            var s= {},
                x = 10,
                h = tip,
                l = (e.pageX + x),
                t = (e.pageY + x),
                v = {
                        l: $(window).scrollLeft(),
                        t: $(window).scrollTop(),
                        w: $(window).width(),
                        h: $(window).height()
                    };
            h.css({top: t + 'px', left: l + 'px'} );
            s = { w: h.width(), h: h.height() };
            if (v.l + v.w < s.w + l + (x*2)  && l > s.w )
                    h.css({left:  ( l - s.w  - (x*3)  ) + 'px'} );
            if (v.t + v.h < s.h + t + (x*3) && t > s.h)
                    h.css({ top:  ( t - s.h - (x*2) ) + 'px'} );
        }
})(jQuery);

*/

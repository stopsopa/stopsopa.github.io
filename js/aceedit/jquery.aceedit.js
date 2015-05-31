/**
 * Zależne od underscore.js, jQuery
 * v 1.1 dodałem w komentarzach link do listy dostępnych języków
 *   https://github.com/ajaxorg/ace/blob/master/lib/ace/ext/modelist.js#L53
 *   https://github.com/ajaxorg/ace/tree/master/lib/ace/mode
 */
;(function ($) {
    /**
     * http://ace.ajax.org/api/edit_session.html
     * g(clearSelection site:ace.ajax.org)
     */
    $.fn.aceedit = function () {
        var bag = [];
        $(this).each(function () {
            var that, clone, script, editor, div, t = '', d, newh = 0;
            that = $(this);

            d = that.data('h')
            d && that.css({height:d});
            d = that.data('w')
            d && that.css({width:d});

            script = that.children('script');
            if (script.length) {
                t = script.html();
            }
            else {
                script = that.children('textarea');
                t = script.html();
            }
            script.remove();

            div = that.clone().removeClass('editor').removeClass('syntax').appendTo(that);

            // dodaję też clean:both jako następny element
            $('<div></div>').attr('style','clear:both;').appendTo(that);

            editor = ace.edit(div.get(0));
            editor.getSession().setTabSize(4);
            editor.setTheme("ace/theme/idle_fingers");
            editor.getSession().setUseWrapMode(true);


            // list of supported languages and theres symbols
            d = that.data('lang');
            (d == 'js') && (d = 'javascript');
            d && editor.getSession().setMode("ace/mode/"+d);

            that.hasClass('syntax') && editor.setReadOnly(true);  // false to make it editable
      //        editor.getSession().setMode("ace/mode/javascript");
            editor.setValue(_.unescape(t));
            editor.clearSelection();
            if (!that.data('h')) {
      //        newh = ((editor.getSession().getDocument().getLength()+1) * editor.renderer.lineHeight) +
      //               editor.renderer.scrollBar.getWidth();
                setTimeout(function () {
                    newh = div.find('.ace_sb > div').height();
                    div.add(that).height(newh);
                    editor.resize();
                },10);
            }
            editor.resize();
            editor.$ = that;
            that.data('editor',editor);
            bag.push(editor);
        });
        return bag.length == 1 ? bag[0] : bag;
    };
    $.aceedit = function () {
        $('.editor, .syntax').aceedit();
    };
})(jQuery);
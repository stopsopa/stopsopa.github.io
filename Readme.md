
# Ace editor objects syntax:

    <script type="editor|syntax" data-lang="js" data-w="95%">
        function (a, b, c) {
            console.log('textarea', a)
        }
    </script>
    
    attributes:
    
    type        - required : editor | syntax
    data-lang   - required
    data-w      - optional: any valid css value for width css directive
    datahw      - optional: any valid css value for height css directive
    
[supported syntax](https://github.com/ajaxorg/ace/blob/master/lib/ace/ext/modelist.js#L53)

# attribute helpers

    <div data-do-sort>... children nodes...</div> - sorts all children based on innerText
    
    <body nohead nofoot toc>
    
        toc - turn on Table of Content
        nohead - no header
        nofoot - no footer
    
# new page template

    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport"
              content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>stopsopa.github.io</title>
        
                <script> <!-- optional to do something before binding ACE editor -->
                    (function () {
                        var resolve;
                        var p = new Promise(function (res) {
                            resolve = res;
                        });
            
                        document.addEventListener('DOMContentLoaded', () => {
            
                            Array.prototype.slice.call(document.querySelectorAll('[class="domain.com"]')).forEach(function (tag) {
            
                                var text = tag.innerHTML;
            
                                text = text.replace(/domain\.com/g, location.origin)
            
                                tag.innerHTML = text;
                            });
            
                            resolve();
                        });
            
                        window.waitForPromise = function () {
            
                            return p;
                        }
                    }())
                </script>
                
        <script src="/js/github.js"></script>
    </head>
    <body class="layout" toc>
    
        <div class="body">
            <div class="inside">
    
                <div class="cards">
                    <h2>Index</h2>               
                    
                </div>
            </div>
        </div>
    </body>
    </html>
    
# other   

http://httpd.pl/stopsopa.github.io/index.html
http://httpd.pl/stopsopa.github.io/demos/jquery.elkanatooltip/demo.html
http://httpd.pl/dropdown
http://httpd.pl/stopsopa.github.io/demos/jquery.elkanatooltip/pos.html



# to maintain:
http://stopsopa.github.io/demos/jquery.elkanatooltip/katownik.html
http://stopsopa.github.io/demos/jquery.elkanatooltip/pos.html

# cross origin requests: 
- https://allorigins.win/
- http://anyorigin.com/

Pull contents from any page via API (as JSON/P or raw) and avoid Same-origin policy problems.









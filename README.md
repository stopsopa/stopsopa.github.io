
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
    
    Warning: Just specify type="typescript" and script on site will load
             /js/ace/ace-builds-1.4.12/src-min-noconflict/mode-typescript.js
    
[supported syntax](https://github.com/ajaxorg/ace/blob/master/lib/ace/ext/modelist.js#L53)

## You can add manually TOC to the document in order to add some extra links to TOC

```html
<body class="layout" toc>
    <div class="body">
        <div class="inside">
            <div class="cards toc">
                <h1>Table of Contents</h1>
                <ul>
                    <li><a href="http://">ekstra link</a></li>
                </ul>
            </div>
            <div class="cards">
                <h2>debug</h2>
                <script type="editor" data-lang="sh">
                    ...
                </script>
                ...
```


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

# firebase 
firebase console: https://console.firebase.google.com/

In order to configure firebase database get credentails from:
https://i.imgur.com/oVsGuVT.png
and then enable 
https://i.imgur.com/gYnXKfm.png
otherwise you end up with issue:
    auth/operation-not-allowed	The provided sign-in provider is disabled for your Firebase project. 
    Enable it from the Sign-in Method section of the Firebase console.
    more:
        https://firebase.google.com/docs/auth/admin/errors
and also add domains to section "Authorised domains":
    https://i.imgur.com/STTaAJ4.png

explore api:

https://firebase.google.com/docs/reference/js/firebase.database.Reference
       Explore api: 
       g(firebase. database. Reference)
read write:
    https://firebase.google.com/docs/database/web/read-and-write

add rules to database:

    {
      "rules": {
        "users": {
          "$email": {
            ".read": "$email === auth.token.email.replace('.', ',')",
              ".write": "$email === auth.token.email.replace('.', ',')",
          }
        }
      }
    }


# to maintain:
http://stopsopa.github.io/demos/jquery.elkanatooltip/katownik.html
http://stopsopa.github.io/demos/jquery.elkanatooltip/pos.html

# cross origin requests: 
- https://allorigins.win/
- http://anyorigin.com/

Pull contents from any page via API (as JSON/P or raw) and avoid Same-origin policy problems.









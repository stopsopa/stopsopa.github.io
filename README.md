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

[supported syntax](https://github.com/ajaxorg/ace/blob/master/src/ext/modelist.js#L45)

- (in older versions up to v1.8.1 the file was here: https://github.com/ajaxorg/ace/blob/v1.8.1/lib/ace/ext/modelist.js#L53)

## You can add manually TOC to the document in order to add some extra links to TOC

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>stopsopa.github.io</title>
  </head>
  <body class="layout" toc>
    <div class="body">
      <div class="inside">
        <div class="cards toc">
          <h1>Table of Contents</h1>
          <ul data-do-sort>
            <li><a href="http://">ekstra link</a></li>
          </ul>
        </div>
        <div class="cards">
          <h2>debug</h2>
          <script type="editor" data-lang="sh">
            ...
          </script>
          ...
        </div>
      </div>
    </div>
    <script src="/js/github.js"></script>
  </body>
</html>
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

                            text = text.replace(/domain\.com/g, location.origin).replace(/host\.com/g, location.host)

                            tag.innerHTML = text;
                        });

                        resolve();
                    });

                    window.beforeAceEventPromise = function () {

                        return p;
                    }
                }())
            </script>
    </head>
    <body class="layout" toc>
        <div class="body">
            <div class="inside">
                <div class="cards">
                    <h2>Index</h2>

                </div>
            </div>
        </div>
        <script src="/js/github.js"></script>
    </body>
    </html>

# links to files through github pages

```

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>stopsopa.github.io</title>

    <script src="/public/preprocessed.js"></script>
    <script>
      (function () {
        var resolve;
        var p = new Promise(function (res) {
          resolve = res;
        });

        // <a href="GITHUB_SOURCES_PREFIX/blob/master/pages/bash/rsync.sh">rsync.sh</a>
        document.addEventListener("DOMContentLoaded", () => {
          const GITHUB_SOURCES_PREFIX = env("GITHUB_SOURCES_PREFIX");

          if (typeof GITHUB_SOURCES_PREFIX !== "string" || !GITHUB_SOURCES_PREFIX.trim()) {
            throw new Error(`GITHUB_SOURCES_PREFIX is not defined`);
          }

          const reg = /^GITHUB_SOURCES_PREFIX(.*)/;

          const buff = {
            reg,
            a_match: [],
            a_notmatch: [],
          };

          document.querySelectorAll("a").forEach((a) => {
            const href = a.getAttribute("href");

            if (reg.test(href)) {
              buff.a_match.push(href);

              const newhref = href.replace(/^GITHUB_SOURCES_PREFIX(.*)/, `${GITHUB_SOURCES_PREFIX}$1`);

              a.setAttribute("href", newhref);
            } else {
              buff.a_notmatch.push(href);
            }
          });

          console.log(JSON.stringify(buff, null, 4));

          resolve();
        });

        window.beforeAceEventPromise = function () {
          return p;
        };
      })();
    </script>
</head>
```

# uglify

If anywhere in the repository file _.uglify.js will be created it will be processed with babel and next by uglifyjs and exported as _.uglify.min.js

For details look to uglify.js

# templating engine

If you create file _.template.html anywhere in the project during build it will be found and file _.html will be generate right next to original \*.template.html.

In template file listed placeholders will be processed:

<%url path/to/file/in/repository.js %> - will import file in-place and replace each " to %22

<%inject path/to/file/in/respository.js %> - will be imported in-place as is

For details look to template.sh

# ace editor click link

When you hold CMD button and click any link anywhere in the content of ace editor it will open it in separate tab

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
auth/operation-not-allowed The provided sign-in provider is disabled for your Firebase project.
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

# Dev notes

```bash

# clone repository
# then enter main directory

cat <<EOF > .env

PROJECT_NAME="testtools"
NODE_PORT=7898
LOCAL_HOSTS="test.github.io.local"
FIREBASE_API_KEY="xxx"
FIREBASE_AUTH_DOMAIN="github-xxxx.firebaseapp.com"
FIREBASE_DATABASE_URL="https://github-xxxx.firebaseio.com"
FIREBASE_PROJECT_ID="github-xxxx"
FIREBASE_STORAGE_BUCKET="github-xxxx.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="3896666666217"
FIREBASE_API_ID="1:38666666667:web:c7effb066666666666"
#FIREBASE_MEASUREMENT_ID="G-F76666666"

EOF

sudo -i
echo "127.0.0.1 test.github.io.local" >> /etc/hosts
exit

# make sure to have node version specified in .nvmrc

yarn

make start

# to publish changes

make build

# commit all changes and push to github pages


```

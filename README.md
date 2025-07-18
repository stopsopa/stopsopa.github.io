![example workflow](https://github.com/stopsopa/stopsopa.github.io/actions/workflows/pipeline.yml/badge.svg)

# What is it?

Just my private webpage with my code snippets for this and that—things I use once in a while, so there’s no point in memorizing them.

I edit it directly via github.dev. I believe there’s nothing for you here, stranger.

And by the way, I’ve deliberately made it difficult to open to avoid being judged. Just difficult - not impossible.

# TOC

<!-- toc -->

- [ci skip](#ci-skip)
- [&lt;script type="editor|syntax" data-eval>](#ltscript-typeeditorsyntax-data-eval)
  - [window.doEval();](#windowdoeval)
- [manual TOC](#manual-toc)
- [&lt;body nohead nofoot toc&gt;](#ltbody-nohead-nofoot-tocgt)
- [&lt;div data-do-sort&gt;](#ltdiv-data-do-sortgt)
- [TEMPLATE](#template)
- [GITHUB_SOURCES_PREFIX || urlwizzard.schema://urlwizzard.hostnegotiated](#github_sources_prefix--urlwizzardschemaurlwizzardhostnegotiated)
- [tabs](#tabs)
- [\_.uglify.js](#_uglifyjs)
- [\*.template.html & url | inject](#templatehtml--url--inject)
- [ace editor click link](#ace-editor-click-link)
- [firebase](#firebase)
- [to maintain:](#to-maintain)
- [cross origin requests:](#cross-origin-requests)
- [Dev notes](#dev-notes)

<!-- tocstop -->

# ci skip

use [q] in git comment to skip test (for fast release) [.github/workflows/pipeline.yml](.github/workflows/pipeline.yml)

# &lt;script type="editor|syntax" data-eval>

```js
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
data-eval   -

Warning: Just specify type="typescript" and script on site will load
          /js/ace/ace-builds-1.5.0/src-min-noconflict/mode-typescript.js
```

[supported syntax](https://github.com/ajaxorg/ace/blob/v1.15.3/src/ext/modelist.js#L44)

> [!TIP]
> For typescript use
>
> <script type="editor" data-lang="ts">

- (in older versions up to v1.8.1 the file was here: https://github.com/ajaxorg/ace/blob/v1.8.1/lib/ace/ext/modelist.js#L53)

## window.doEval();

```html
<script type="editor" data-lang="js" data-eval>
  ...
</script>
```

code will not only be wrapped with aceeditor but also executed just before wrapping.
In order to trigger it again on <script> elements created dynamically use:

```js
window.doEval();
// and optionally also
window.doace();
```

# manual TOC

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>stopsopa.github.io</title>
  </head>


  <body class="layout bg" toc>

  <body class="layout bg" toc wide>


    <div class="body">
      <div class="inside">
        <div class="cards toc">
          <h1>Table of Contents</h1>
          <ul data-do-sort>
            <li><a href="http://">ekstra link</a></li>
          </ul>
        </div>
        <h2>debug</h2>
        <script type="editor" data-lang="sh">
          ...
        </script>
      </div>
    </div>
    <script type="module" src="/js/github.js"></script>
  </body>
</html>
```

# &lt;body nohead nofoot toc&gt;

    <body nohead nofoot toc>

        toc - turn on Table of Content
        nohead - no header
        nofoot - no footer

# &lt;div data-do-sort&gt;

    <div data-do-sort>... children nodes...</div> - sorts all children based on innerText

# TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>stopsopa.github.io</title>

    <script>
      <!-- optional to do something before binding ACE editor -->
      (function () {
        var resolve;
        var p = new Promise(function (res) {
          resolve = res;
        });

        document.addEventListener("DOMContentLoaded", () => {
          // to replace domain.com to ... other stuff
          Array.prototype.slice.call(document.querySelectorAll('[class="domain' + '.com"]')).forEach(function (tag) {
            var text = tag.innerHTML;

            text = text.replace(/domain\.com/g, location.origin).replace(/host\.com/g, location.host);

            tag.innerHTML = text;
          });

          resolve();
        });

        window.beforeAceEventPromise = function () {
          return p;
        };
      })();
    </script>

    <script>
      if (typeof window.allLoaded === "undefined") {
        window.allLoaded = [];
      }
      window.allLoaded.push(function () {
        console.log("do my stuff after all is loaded");
      });
    </script>
  </head>
  <body class="layout bg" toc>
    <div class="body">
      <div class="inside">
        <div class="cards toc">
          <h1>Table of Contents</h1>
          <ul data-do-sort>
            <li><a href="http://">ekstra link</a></li>
          </ul>
        </div>

        <h2>Index</h2>
        <script type="editor" data-lang="sh"></script>

        <div class="cards">
          <h2>Index</h2>
          <script type="editor" data-lang="sh"></script>
        </div>
      </div>
    </div>
    <script type="module" src="/js/github.js"></script>
  </body>
</html>
```

# GITHUB_SOURCES_PREFIX || urlwizzard.schema://urlwizzard.hostnegotiated

which is replacing all occurences in tags, attributes and script bodies as follow

```txt
urlwizzard.hostnegotiated
  // will become something like domain.co.uk
  // or
  // domain.co.uk:447 if http
  // or
  // domain.co.uk:80 if https

urlwizzard.hostname       location.hostname
  // will become something like domain.co.uk

urlwizzard.schema       location.protocol.replace(/^([a-z]+).*$/, "$1")
  // usually it will be 'http' or 'https'

urlwizzard.portnegotiated
  // ":80" or "" or ":5567"

urlwizzard.port
  // simply location.port - sometimes "" sometimes "7439"

usually you will use it like this:

curl "urlwizzard.schema://urlwizzard.hostnegotiated/pages/node/curl.js" -o "curl.js"
// which will conver it to
curl "https://domain.co.uk:1025/pages/node/curl.js" -o "curl.js"

GITHUB_SOURCES_PREFIX/blob/master/pages/bash/rsync.sh
// will become
https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/rsync.sh


```

test page githubpages: https://stopsopa.github.io/research/urlwizzard/urlwizzard.html

# tabs

It supports out of the box tabs like documented in:

https://github.com/stopsopa/tabs

# \_.uglify.js

If anywhere in the repository file _.uglify.js will be created it will be processed with babel and next by uglifyjs and exported as _.uglify.min.js

For details look to uglify.js

# \*.template.html & url | inject

If you create file _.template.html anywhere in the project during build it will be found and file _.html will be generate right next to original \*.template.html.

In template file listed placeholders will be processed:

<%url path/to/file/in/repository.js %> - will import file in-place and replace each " to %22

<%inject /pages/to/file/in/respository.js %> - will be imported in-place as is

> [!NOTE]
> use two path styles:
> relative like lib/test.js or ../lib/test.js
> this will resolve relative to the position of \*.template.html file
>
> or
>
> absolute like /lib/test.js
> that will resolve from the root of the repository

For details look to scripts/template.sh

# ace editor click link

When you hold CMD button and click any link anywhere in the content of ace editor it will open it in separate tab

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
[https://i.imgur.com/STTaAJ4.png](https://i.imgur.com/MYUE5K6.png)

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
NODE_API_PORT=7898
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

<details>
  <summary>👉 <b>Show more details</b></summary>

- Subroutines can appear before the groups they reference.
- Like backreferences, subroutines can't be used _within_ character classes.
- As with all extended syntax in `regex`, subroutines are applied after interpolation, giving them maximal flexibility.
</details>

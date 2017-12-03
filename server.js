
var http    = require('http');

var path    = require('path');

var fs      = require('fs');

const log = function () {
    Array.prototype.slice.call(arguments).map(i => i + "\n").forEach(i => process.stdout.write(i));
};

const args = (function (obj, tmp) {
    process.argv
        .slice(2)
        .map(a => {

            if (a.indexOf('--') === 0)
                return obj[tmp = a.substring(2)] = obj[tmp] || true;

            if (tmp !== null) {

                if (obj[tmp] === true)
                    return obj[tmp] = [a];

                obj[tmp].push(a);
            }
        })
    ;

    Object.keys(obj).map(k => {
        (obj[k] !== true && obj[k].length === 1) && (obj[k] = obj[k][0]);
        (obj[k] === 'false') && (obj[k] = false);
    });

    return {
        all: () => JSON.parse(JSON.stringify(obj)),
        get: (key, def) => {

            var t = JSON.parse(JSON.stringify(obj));

            if (typeof def === 'undefined')

                return t[key];

            return (typeof t[key] === 'undefined') ? def : t[key] ;
        }
    };
}({}));

const diff = function(a, b) {
    return a.filter(function(i) {return b.indexOf(i) < 0});
};

(function (d) {
    if (d.length) {

        log(`Unknown parameters: ${d.join(', ')}`);

        process.exit(1);
    }
}(diff(Object.keys(args.all()), 'port dir noindex log w help'.split(' '))));

if (args.get('help')) {

    process.stdout.write(`
Standalone static files http server with no dependencies
    
@author Szymon Działowski https://github.com/stopsopa
@license MIT    

parameters:

    --port [port]               def: 8080
    
    --dir [path]                def: '.' 
        relative or absolute path to directory with files to serve
    
    --noindex                   def: false  
        disable indexing directories content if url points to directory
        
    --log [level]               def: 1
    
        binary mask:
        
            0 - show nothing
            1 - show 404, 
            2 - show 200, 
            4 - show 301
            8 - autoindex
            
            more examples:
                3 - show 404 and 200
                6 - show 200 and 301
                7 - show all without autoindex
                15 - show all
    --w
        !!! WARNING: be careful, use --w not -w
        
        use this param with 'nodemon' https://github.com/remy/nodemon
        in order to reload server on each change in files.
        
        first install globally nodemon:
            npm install -g nodemon
            
        then run like (examples):
        
            $ nodemon -e 'html js css' server.js --log 15 --w --port 8080
    
            $ nodemon -e '**' server.js --port 8080 --log 15 --w
                above might be heavy because you're watching all 
                files in current directory, and there can be a LOTS of files...
                  -e '**'     means watch any file in current directory (even eg. jpg files)
                  default extensions are 'js coffee litcoffee json'
                    see: https://github.com/remy/nodemon#specifying-extension-watch-list
                
            $ nodemon -e 'html js css' --ignore node_modules/ --ignore my-dir-to-ignore server.js --port 8080 --log 15 --w
                see: https://github.com/remy/nodemon#ignoring-files
    
`);
    process.exit(0);
}

var port    = parseInt(args.get('port', 8080), 10);

var dir     = path.resolve(__dirname, args.get('dir', '.'));

var logs     = parseInt(args.get('log', 1), 10);

var w        = args.get('w');

var type = (function (types) {
    return function (req, res, ext) {

        ext = ext || path.extname(req.url.toLowerCase().split('?')[0]).replace(/[^a-z0-9]/g, '');

        types[ext] && res.setHeader('Content-Type', types[ext]);

        return ext;
    }
}((function (type) {
    type.jpeg = type.jpg;
    return type;
}({
    html    : 'text/html; charset=utf-8',
    js      : 'application/javascript; charset=utf-8',
    css     : 'text/css; charset=utf-8',
    json    : 'application/json; charset=utf-8',
    txt     : 'text/plain; charset=utf-8',
    gif     : 'image/gif',
    bmp     : 'image/bmp',
    jpg     : 'image/jpeg',
    png     : 'image/png',
    pdf     : 'application/pdf',
}))));

function time() {
    return (new Date()).toISOString().substring(0, 19).replace('T', ' ');
}

var server = http.createServer().listen(port);

function noAccess(req, res, isDir, notype) {

    res.statusCode = 403;

    type(req, res, 'html');

    (logs & 2) && log(`${time()} \x1b[35m${res.statusCode}\x1b[0m: ${req.url}`);

    res.end(`<div style="color: #92317B; font-family: tahoma;">${notype ? '' : (isDir ? 'directory' : 'file')} ${req.url} no access.</div>`);
}

var uniq = (function unique(pattern) {
    return pattern.replace(/[xy]/g,
        function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}('xyxyxyxyxyxyx'));

function addWatcher(content, ext) {

    if (w && ext === 'html') {

        content = content.replace(
            /(<\s*\/\s*body\s*>)/i,
            `<script>(function run(uniq){fetch('?watch='+uniq).then(res=>res.text()).then(hash=>run(hash),()=>(function test(){return fetch(location.href).then(()=>location.href=location.href,()=>setTimeout(test,500))}()))}('${uniq}'))</script>$1`
        );
    }

    return content;
}

server.on('request', function (req, res) {

    if (w) {

        var test = req.url.match(/\?watch=(.*)/);

        if (test) {

            if (test[1] !== uniq) {

                return res.end(uniq)
            }

            return;
        }
    }

    var url = req.url.split('?')[0];

    var file = path.resolve(dir, '.' + path.sep + (decodeURI(url).replace(/\.\.+/g, '.')));

    if (fs.existsSync(file)) {

        var isDir = fs.statSync(file).isDirectory();

        if (isDir) {

            if (args.get('noindex')) {

                return noAccess(req, res, isDir, true);
            }

            if (url.length > 1 && url.substr(-1) !== '/') {

                res.writeHead(302, { 'Location': url + '/' });

                (logs & 4) && log(`${time()} \x1b[33m${res.statusCode}\x1b[0m: ${url} -> ${url + '/'}`);

                return res.end();
            }

            try {

                var list = `
<body>
<style>
    *{font-family:tahoma;font-size:12px}
    ul{padding:0;list-style-type:none}
    a{padding-right:20px;padding-left:3px;margin-left:3px;border-left:1px solid transparent}
    a:hover{border-left:1px solid gray}
</style>
<ul><li>📁<a href=".."> .. </a></li></body>
`;
                list += fs.readdirSync(file).map(f => {
                    var dir = fs.statSync(path.resolve(file, f)).isDirectory();
                    return `<li>${dir?'📁':'📄'}<a href="./${f}${dir?'/':''}">${f}</a></li>`;
                }).join("\n");

                list += '</ul>';
            }
            catch (e) {

                return noAccess(req, res, isDir);
            }

            (logs & 8) && log(`${time()} \x1b[36m${res.statusCode}\x1b[0m: [\x1b[36mautoindex\x1b[0m] ${req.url}`);

            return res.end(addWatcher(list, type(req, res, 'html')));
        }

        try {

            res.end(addWatcher(fs.readFileSync(file).toString(), type(req, res)));
        }
        catch (e) {

            return noAccess(req, res, isDir);
        }

        (logs & 2) && log(`${time()} \x1b[32m${res.statusCode}\x1b[0m: ${req.url}`);
    }
    else {

        res.statusCode = 404;

        res.end(`<div style="color: #b10000; font-family: tahoma;">status code ${res.statusCode}: ${req.url}</div>`);

        (logs & 1) && log(`${time()} \x1b[31m${res.statusCode}\x1b[0m: ${req.url}`);
    }
});

log(`
     🌎  Listening on port ${port}, start time: ${time()}
        serving files from directory ${dir}, --help for more info
`);
const path = require("path");

const express = require("express");

const log = console.log;

function check(val, name) {
  if (typeof val !== "string") {
    throw new Error(`${name} is not a string`);
  }

  if (!val.trim()) {
    throw new Error(`${name} is an empty string`);
  }
}

require("dotenv").config();

check(process.env.NODE_PORT, "NODE_PORT");

const serveIndex = require("serve-index");

const host = "0.0.0.0";

const web = path.resolve(__dirname);

const app = express();

app.all("/ping", (req, res) => {
  res.end("ok");
});

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);

  next();
});

app.use(
  express.static(web, {
    // http://expressjs.com/en/resources/middleware/serve-static.html
    // maxAge: 60 * 60 * 24 * 1000 // in milliseconds
    // maxAge: "356 days", // in milliseconds max-age=30758400
    cacheControl: false,
    etag: false,
    immutable: true,
    lastModified: false,
    maxAge: false,
    setHeaders: (res, path, stat) => {
      // res.setHeader("Last-Modified", stat.mtime.toUTCString());

      // res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      // res.setHeader("Pragma", "no-cache");
      // res.setHeader("Expires", "0");

      if (/\.bmp$/i.test(path)) {
        // for some reason by default express.static sets here Content-Type: image/x-ms-bmp

        res.setHeader("Content-type", "image/bmp");
      }

      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      // res.setHeader('Cache-Control', 'public, no-cache, max-age=30758400')
      // res.setHeader('Cache-Control', 'public, only-if-cached')
    },
    // fallthrough: (req, res, next) => {
    //   const ifModifiedSince = req.get("If-Modified-Since");
    //   if (ifModifiedSince && ifModifiedSince === res.get("Last-Modified")) {
    //     res.sendStatus(304);
    //   } else {
    //     next();
    //   }
    // },
  }),
  serveIndex(web, { icons: true })
);

app.listen(process.env.NODE_PORT, host, () => {
  log(`
  
 🌎  Server is running http://${host}:${process.env.NODE_PORT}

 \x1b[41mNOTICE: \x1b[33mmake sure to add ${process.env.LOCAL_HOSTS} to /etc/hosts\x1b[0m
 
`);
});

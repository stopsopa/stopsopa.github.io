// used in:
//   https://stopsopa.github.io/pages/node/index.rendered.html#express-template
//
// node --env-file .env server-template.ts
// express extension: https://raw.githubusercontent.com/stopsopa/roderic/86495ef554314d388e7f6ef10ee4de6d12bcbcff/libs/express-extend-res.js?token=GHSAT0AAAAAACVQ4Q66S6J6DLZRVFB5DQLSZXEOC2Q
// pnpm install "@types/express" "@types/lodash" "@types/node"

import path from "path";

import fs from "fs";

import https from "https";

import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

import template from "lodash/template.js";

// use multer for multipart/form-data https://github.com/expressjs/multer

// https://www.npmjs.com/package/cookie-parser
// import cookieParser from "cookie-parser";

// https://stackoverflow.com/a/23613092
import serveIndex from "serve-index";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (function () {
  try {
    return console.log;
  } catch (e) {
    return function () {};
  }
})();

const web = path.resolve(__dirname, ".");

const { HOST: host, PORT: portRaw } = process.env;

if (!host || !portRaw) {
  throw new Error("HOST and PORT environment variables are required");
}

const port = parseInt(portRaw, 10);

const readFile = (file: string) => fs.readFileSync(file).toString();

const app: Application = express();

// app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

function produceRender(parentFile: string, permaData?: any) {
  return function (file: string, data?: any) {
    try {
      const filePath = path.resolve(path.dirname(parentFile), file);

      const content = fs.readFileSync(filePath, "utf8");

      return template(content, {
        variable: "d",
        interpolate: /<%=([\s\S]+?)%>/g, // this somehow stops template from processing `${i}` which is what I want
        // to see exactly what is going on put debugger in file node_modules/lodash/template.js
        // in place: https://github.com/lodash/lodash/blob/4.18.1/dist/lodash.js#L14928
        // you will see before setting here interpolate: /<%=([\s\S]+?)%>/g,
        // value of sourceURL will be
        // /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|\$\{([^\\}]*(?:\\.[^\\}]*)*)\}|<%([\s\S]+?)%>|$/g
        // but when set:
        // /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|($^)|<%([\s\S]+?)%>|$/g
      })({
        ...permaData,
        ...data,
        fs,
        path,
        template: {
          file: filePath,
          dir: path.dirname(filePath),
        },
        render: produceRender(filePath, permaData),
      });
    } catch (e) {
      console.error(`_.template() error in produceRender() for ${file}`, e);

      throw new Error(`_.template() error in produceRender() for ${file}`);
    }
  };
}
app.get(/^(.*)$/, async (req: Request, res: Response, next: NextFunction) => {
  let reqPath = req.path;
  if (reqPath.endsWith("/")) {
    reqPath += "index.html";
  }

  if (reqPath.endsWith(".html")) {
    const filePath = path.join(web, reqPath);

    try {
      const stat = await fs.promises.stat(filePath);

      if (!stat.isFile()) {
        return next();
      }

      /**
       * WARNING: This method is not safe because it forwards get and post without validation to template
       */
      const render = produceRender(filePath, {
        req,
        res,
        ...req.query,
        ...req.body,
      });

      const content = render(filePath);

      return res.send(content);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        return next();
      }
      console.error(`Error rendering ${filePath}:`, e);
      return res.status(500).send(`Template Error: ${e.message}`);
    }
  }

  next();
});

app.all("/save", (req: Request, res: Response) => {
  const cookies = decodeURIComponent(req.headers.cookie || "")
    .split(";")
    .reduce((acc, coo) => {
      const tmp = coo.split("=");
      const name = tmp.shift()?.trim();
      const value = tmp.join("=").trim();
      if (name) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

  log("save");
  log(JSON.stringify(req.body));

  res.setHeader("Content-type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
    })
  );
});

app.all("/root", (req: Request, res: Response) => {
  const html = readFile(path.resolve(__dirname, "public", "_index.html"));

  const svg = readFile(path.resolve(__dirname, "public", "tree.svg"));

  const tmp = template(html);

  res.end(
    tmp({
      svg,
    })
  );
});

app.use(
  express.static(web, {
    // http://expressjs.com/en/resources/middleware/serve-static.html
    index: false, // stop automatically serve index.html if present. instead list content of directory
    // maxAge: 60 * 60 * 24 * 1000 // in milliseconds
    maxAge: "356 days", // in milliseconds max-age=30758400
    setHeaders: (res, path) => {
      if (/\.bmp$/i.test(path)) {
        // for some reason by default express.static sets here Content-Type: image/x-ms-bmp

        res.setHeader("Content-type", "image/bmp");
      }

      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      // res.setHeader('Cache-Control', 'public, no-cache, max-age=30758400')
      // res.setHeader('Cache-Control', 'public, only-if-cached')
    },
  }) as any
);

app.use(
  serveIndex(web, {
    icons: true,
    view: "details",
    hidden: false, // Display hidden (dot) files. Defaults to false.
  }) as any
);

app.listen(port, host, () => {
  console.log(`\n 🌎  Server is running ` + `http://${host}:${port}\n`);
});

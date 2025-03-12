// 

import fs from "fs";

import https from "https";

import express from "express";

const host = process.env.HOST;

const port = process.env.PORT;

if (!/^\d+$/.test(port)) {
  console.error(`PORT is not a number: >${port}<}`);
  process.exit(1);
}
if (!host) {
  console.error(`HOST is not set >${host}<`);
  process.exit(1);
}

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.all("/test", (req, res) => {
  res.setHeader("Content-type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      test: true,
    })
  );
});

https
  .createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
  .listen(port, () => {
    console.log(
      ` 

    make sure to add to /etc/hosts
    0.0.0.0         abc.com

    🌎  Server is running ` +
        `https://${host}:${port}/test

`
    );
  });

// generate cert and key:
// openssl req -nodes -new -x509 -keyout server.key -out server.cert

// or without interactive
// openssl req -nodes -new -x509 -keyout server.key -out server.cert -subj "/C=UK/ST=Surrey/L=London/O=Company/OU=Company/CN=abc.com/emailAddress=user@gmail.com"

// where
// /C=UK → Country
// /ST=Surrey → State or Province
// /L=London → Locality (City)
// /O=Company → Organization
// /OU=Company → Organizational Unit
// /CN=abc.com → Common Name (Domain Name)
// /emailAddress=myemail@gmail.com → Email Address

// add to host machine /etc/hosts
// 0.0.0.0 abc.com

// then https run server:
// HOST=abc.com PORT=8087 node pages/node/httpsserver.js

// after that when you open in the browser:
// https://0.0.0.0:8087/test
// you will see https://i.imgur.com/vhvBgtq.png
// but that is expected you just have to click "Advanced" and then "Proceed to abc.com (unsafe)"
// that is natural and how it supposed to work with self signed certificates

// after that when you open in the browser:
// https://abc.com:8087/test
// you will see https://i.imgur.com/vhvBgtq.png
// the same as above

// attempt to curl such server will return result
// $ curl https://abc.com:8087/test
// curl: (60) SSL certificate problem: self-signed certificate
// More details here: https://curl.se/docs/sslcerts.html
// curl failed to verify the legitimacy of the server and therefore could not
// establish a secure connection to it. To learn more about this situation and
// how to fix it, please visit the webpage mentioned above.

// you can use -k to skip the verification step and proceed without checking
// see more -> man curl
// $ curl -k https://abc.com:8087/test
// {"test":true}

// urlwizzard.schema://urlwizzard.hostnegotiated/viewer.html?file=%2Fpages%2Fnode%2Fhttpsserver.js

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

// curl -I -v -k https://localhost:8087/test
// curl -I -v -k https://0.0.0.0:8087/test
// curl -I -v -k https://abc.com:8087/test
// all above will return exactly the same thing except field "Date: .." fields
// general response will look like:

// *   Trying 0.0.0.0:8087...
// * Connected to abc.com (127.0.0.1) port 8087
// * ALPN: curl offers h2,http/1.1
// * (304) (OUT), TLS handshake, Client hello (1):
// * (304) (IN), TLS handshake, Server hello (2):
// * (304) (IN), TLS handshake, Unknown (8):
// * (304) (IN), TLS handshake, Certificate (11):
// * (304) (IN), TLS handshake, CERT verify (15):
// * (304) (IN), TLS handshake, Finished (20):
// * (304) (OUT), TLS handshake, Finished (20):
// * SSL connection using TLSv1.3 / AEAD-AES256-GCM-SHA384
// * ALPN: server accepted http/1.1
// * Server certificate:
// *  subject: C=UK; ST=Surrey; L=London; O=Company; OU=Company; CN=abc.com; emailAddress=user@gmail.com
// *  start date: Mar 12 18:49:53 2025 GMT
// *  expire date: Apr 11 18:49:53 2025 GMT
// *  issuer: C=UK; ST=Surrey; L=London; O=Company; OU=Company; CN=abc.com; emailAddress=user@gmail.com
// *  SSL certificate verify result: self signed certificate (18), continuing anyway.
// * using HTTP/1.1
// > HEAD /test HTTP/1.1
// > Host: abc.com:8087
// > User-Agent: curl/8.4.0
// > Accept: */*
// >
// < HTTP/1.1 200 OK
// HTTP/1.1 200 OK
// < X-Powered-By: Express
// X-Powered-By: Express
// < Content-type: application/json; charset=utf-8
// Content-type: application/json; charset=utf-8
// < Date: Wed, 12 Mar 2025 19:06:30 GMT
// Date: Wed, 12 Mar 2025 19:06:30 GMT
// < Connection: keep-alive
// Connection: keep-alive
// < Keep-Alive: timeout=5
// Keep-Alive: timeout=5

// or 

// openssl s_client -connect localhost:8087 -servername localhost
// openssl s_client -connect 0.0.0.0:8087 -servername 0.0.0.0
// openssl s_client -connect abc.com:8087 -servername abc.com
// all will return
// Connecting to 0.0.0.0
// CONNECTED(00000003)
// depth=0 C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
// verify error:num=18:self-signed certificate
// verify return:1
// depth=0 C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
// verify return:1
// ---
// Certificate chain
//  0 s:C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
//    i:C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
//    a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
//    v:NotBefore: Mar 12 18:49:53 2025 GMT; NotAfter: Apr 11 18:49:53 2025 GMT
// ---
// Server certificate
// -----BEGIN CERTIFICATE-----
// MIID-----------------------------------------------------vcNAQEL
// BQAw-----------------------------------------------------AcMBkxv
// bmRv-----------------------------------------------------A4GA1UE
// AwwH-----------------------------------------------------hcNMjUw
// MzEy-----------------------------------------------------zANBgNV
// BAgM-----------------------------------------------------W55MRAw
// DgYD-----------------------------------------------------vcNAQkB
// Fg51-----------------------------------------------------QoCggEB
// AL6f-----------------------------------------------------I8aGJ4C
// o53s-----------------------------------------------------iJoJhoA
// +vOc-----------------------------------------------------BtQjCmG
// CG9C-----------------------------------------------------At4+Q89
// eHk1-----------------------------------------------------J0RdEs+
// jNxo-----------------------------------------------------pcuIvI1
// piV+-----------------------------------------------------A8GA1Ud
// EwEB-----------------------------------------------------BKD3AQt
// 7NaP-----------------------------------------------------EcM5Y2O
// XbE7-----------------------------------------------------sJXaez5
// Ws8K-----------------------------------------------------p1McsTf
// PWaQ-----------------------------------------------------o9WpJ9e
// N66R-----------------------------------------------------eB3Zh8=
// -----END CERTIFICATE-----
// subject=C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
// issuer=C=UK, ST=Surrey, L=London, O=Company, OU=Company, CN=abc.com, emailAddress=user@gmail.com
// ---
// No client certificate CA names sent
// Peer signing digest: SHA256
// Peer signature type: RSA-PSS
// Server Temp Key: X25519, 253 bits
// ---
// SSL handshake has read 1563 bytes and written 398 bytes
// Verification error: self-signed certificate
// ---
// New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
// Protocol: TLSv1.3
// Server public key is 2048 bit
// This TLS version forbids renegotiation.
// Compression: NONE
// Expansion: NONE
// No ALPN negotiated
// Early data was not sent
// Verify return code: 18 (self-signed certificate)
// ---
// ---
// Post-Handshake New Session Ticket arrived:
// SSL-Session:
//     Protocol  : TLSv1.3
//     Cipher    : TLS_AES_256_GCM_SHA384
//     Session-ID: 76C3--------------------------------------------------------AB36
//     Session-ID-ctx: 
//     Resumption PSK: B38-----------------------------------------------------------------------------------------30C6
//     PSK identity: None
//     PSK identity hint: None
//     SRP username: None
//     TLS session ticket lifetime hint: 7200 (seconds)
//     TLS session ticket:
//     0000 - 78 2f 00 dc 4c fd 7d c0-01 9a 13 8d 02 bc 09 e4   x/..L.}.........
//     0010 - b8 -- -- -- -- -- -- -- -- -- -- -- -- -- -- e7   .--------------.
//     0020 - 43 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 51   C--------------Q
//     0030 - a4 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 9b   .--------------.
//     0040 - c0 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 13   .--------------.
//     0050 - 4c -- -- -- -- -- -- -- -- -- -- -- -- -- -- b2   L--------------.
//     0060 - dc -- -- -- -- -- -- -- -- -- -- -- -- -- -- 2d   .---------------
//     0070 - 73 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 83   s--------------.
//     0080 - 2e -- -- -- -- -- -- -- -- -- -- -- -- -- -- a8   .--------------.
//     0090 - 49 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 04   I--------------.
//     00a0 - b2 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 85   .--------------.
//     00b0 - 57 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 6f   W--------------o
//     00c0 - 63 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 05   c--------------.
//     00d0 - 69 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 04   i--------------.
//     00e0 - 92 55 2f 04 7c 6d 39 c5-63 02 55 cf 01 f4 6f fc   .U/.|m9.c.U...o.

//     Start Time: 1741805856
//     Timeout   : 7200 (sec)
//     Verify return code: 18 (self-signed certificate)
//     Extended master secret: no
//     Max Early Data: 0
// ---
// read R BLOCK
// ---
// Post-Handshake New Session Ticket arrived:
// SSL-Session:
//     Protocol  : TLSv1.3
//     Cipher    : TLS_AES_256_GCM_SHA384
//     Session-ID: F7C8--------------------------------------------------------967A
//     Session-ID-ctx: 
//     Resumption PSK: 132C-----------------------------------------------------------------------------------------038
//     PSK identity hint: None
//     SRP username: None
//     TLS session ticket lifetime hint: 7200 (seconds)
//     TLS session ticket:
//     0000 - 78 2f 00 dc 4c fd 7d c0-01 9a 13 8d 02 bc 09 e4   x/..L.}.........
//     0010 - 4c -- -- -- -- -- -- -- -- -- -- -- -- -- -- a1   L--------------.
//     0020 - 50 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 75   P--------------u
//     0030 - 20 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 53    --------------S
//     0040 - de -- -- -- -- -- -- -- -- -- -- -- -- -- -- a2   .--------------.
//     0050 - e9 -- -- -- -- -- -- -- -- -- -- -- -- -- -- a1   .--------------.
//     0060 - 21 -- -- -- -- -- -- -- -- -- -- -- -- -- -- fa   !--------------.
//     0070 - 0e -- -- -- -- -- -- -- -- -- -- -- -- -- -- db   .--------------.
//     0080 - 92 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 9f   .--------------.
//     0090 - bf -- -- -- -- -- -- -- -- -- -- -- -- -- -- 37   .--------------7
//     00a0 - 3a -- -- -- -- -- -- -- -- -- -- -- -- -- -- c5   :--------------.
//     00b0 - dd -- -- -- -- -- -- -- -- -- -- -- -- -- -- 38   .--------------8
//     00c0 - 25 -- -- -- -- -- -- -- -- -- -- -- -- -- -- ac   %--------------.
//     00d0 - 20 -- -- -- -- -- -- -- -- -- -- -- -- -- -- 5a    --------------Z
//     00e0 - 7d 8b 33 18 dc 2d 69 b6-1a 1e 46 a1 a9 36 8e c6   }.3..-i...F..6..

//     Start Time: 1741805856
//     Timeout   : 7200 (sec)
//     Verify return code: 18 (self-signed certificate)
//     Extended master secret: no
//     Max Early Data: 0
// ---
// read R BLOCK


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

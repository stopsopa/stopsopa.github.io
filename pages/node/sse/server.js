const path = require("path");

const express = require("express");

const serveIndex = require("serve-index");

const host = process.env.HOST;

const port = process.env.PORT;

const web = path.resolve(__dirname, "public");

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(
  express.static(web, {
    maxAge: "356 days", // in milliseconds max-age=30758400
  }),
  serveIndex(web, {
    icons: true,
    view: "details",
    hidden: false, // Display hidden (dot) files. Defaults to false.
  })
);

app.all("/stream", (req, res) => {
  const list = [
    { id: 1, name: "one" },
    { id: 2, name: "two" },
    { id: 3, name: "three" },
  ];

  let index = 0;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  function sendNextString() {
    if (index < list.length) {
      let stringToSend = list[index];
      stringToSend.channel = req.query.channel;
      stringToSend = JSON.stringify(stringToSend);
      res.write(`data: ${stringToSend}\n\n`);
      index++;
      setTimeout(sendNextString, 1000); // Delay for 1 second (1000 milliseconds)
    } else {
      res.write("event: end\n");
      res.write("data: \n\n");
      res.end();
    }
  }

  sendNextString();
});

app.listen(port, host, () => {
  console.log(`\n 🌎  Server is running ` + `http://${host}:${port}\n`);
});

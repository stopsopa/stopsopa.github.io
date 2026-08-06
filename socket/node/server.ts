/**
 * NODE_OPTIONS= HOST=0.0.0.0 PORT=8080 SOCKET=var/socket.sock node socket/node/server.ts
 */

import http from "node:http";
import net from "node:net";
import fs from "node:fs";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 8080);
const SOCKET = process.env.SOCKET;

if (!SOCKET) {
  console.error("SOCKET env variable is required");
  process.exit(1);
}

if (!fs.existsSync(SOCKET)) {
  console.error(`Socket does not exist: ${SOCKET}`);
  process.exit(1);
}

const clients = new Set<http.ServerResponse>();

const events: string[] = [];
const MAX_EVENTS = 200;

function addEvent(line: string) {
  line = line.trim();

  if (!line) {
    return;
  }

  events.unshift(line);

  if (events.length > MAX_EVENTS) {
    events.pop();
  }

  const payload = `data: ${JSON.stringify(line)}\n\n`;

  for (const client of clients) {
    client.write(payload);
  }
}

const socket = net.createConnection(SOCKET);

socket.on("connect", () => {
  console.log(`connected to ${SOCKET}`);
});

socket.on("error", (error) => {
  console.error("socket error:", error.message);
  process.exit(1);
});

let buffer = "";

socket.on("data", (chunk) => {
  buffer += chunk.toString();

  while (true) {
    const index = buffer.indexOf("\n");

    if (index === -1) {
      break;
    }

    const line = buffer.slice(0, index);

    buffer = buffer.slice(index + 1);

    addEvent(line);
  }
});

function sendEvent(line: string) {
  socket.write(line.trim() + "\n");
}

const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">

<title>Event Stream</title>

<style>
body {
    margin: 0;
    height: 100vh;
    display: flex;
    font-family: monospace;
}

.panel {
    width: 50%;
    padding: 20px;
    box-sizing: border-box;
}

.left {
    border-right: 1px solid #ccc;
}

textarea {
    width: 100%;
    height: 100px;
    font-family: monospace;
}

button {
    margin-top: 10px;
}

#log {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.event {
    padding: 4px;
    border-bottom: 1px solid #eee;
}
</style>

</head>

<body>

<div class="panel left">

<h3>Emit event</h3>

<form id="form">

<textarea id="input"
placeholder="event path/to/file.ts"></textarea>

<br>

<button>
Send
</button>

</form>

</div>


<div class="panel">

<h3>Events</h3>

<div id="log"></div>

</div>


<script>

const input = document.getElementById("input");
const log = document.getElementById("log");


function addEvent(value) {
    const div = document.createElement("div");

    div.className = "event";
    div.textContent = value;

    log.prepend(div);
}


const source = new EventSource("/events");


source.onmessage = event => {
    addEvent(JSON.parse(event.data));
};


document
.getElementById("form")
.addEventListener("submit", async e => {

    e.preventDefault();

    const value = input.value.trim();

    if (!value) {
        return;
    }


    await fetch("/emit", {
        method: "POST",
        body: value
    });


    input.value = "";

});

</script>

</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, {
      "content-type": "text/html",
    });

    res.end(html);

    return;
  }

  if (req.url === "/events" && req.method === "GET") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });

    // send existing history
    for (const event of events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    clients.add(res);

    req.on("close", () => {
      clients.delete(res);
    });

    return;
  }

  if (req.url === "/emit" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      sendEvent(body);

      res.writeHead(204);

      res.end();
    });

    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`http://${HOST}:${PORT}`);
});

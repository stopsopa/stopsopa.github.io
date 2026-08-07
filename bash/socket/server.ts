/**
 * NODE_OPTIONS= HOST=0.0.0.0 PORT=8080 SOCKET=var/socket.sock node bash/socket/server.ts
 */

import http from "node:http";
import fs from "node:fs";
import { createConnection } from "./libs/createConnection.ts";
import { checkIfSocket } from "./libs/checkIfSocket.ts";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 8080);
const SOCKET = process.env.SOCKET as string;

checkIfSocket(SOCKET, true);

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

/**
 * Managed socket connection using createConnection.
 */
const conn = createConnection({
  socket: SOCKET,
  onLine: (line) => {
    addEvent(line);
  },
  onConnected: () => {
    console.log(`connected to ${SOCKET}`);
    addEvent(`[status] connected to ${SOCKET}`);
  },
  onClosed: () => {
    console.log(`socket connection closed to ${SOCKET}`);
    addEvent(`[status] socket connection closed to ${SOCKET}`);
  },
});

function sendEvent(line: string) {
  const success = conn.send(line);
  if (!success) {
    console.error("Cannot send event: socket is not connected");
    addEvent(`[status] error: cannot send event, socket is not connected`);
  }
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

.status-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.status-dot.disconnected {
    background-color: #ff4d4f;
    box-shadow: 0 0 6px #ff4d4f;
}

.status-dot.connected {
    background-color: #52c41a;
    box-shadow: 0 0 6px #52c41a;
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

<div class="status-container">
    <h3>Events</h3>
    <span id="status-dot" class="status-dot disconnected" title="Socket status"></span>
</div>

<div id="log"></div>

</div>


<script>

const input = document.getElementById("input");
const log = document.getElementById("log");
const statusDot = document.getElementById("status-dot");

function updateStatus(value) {
    if (value.includes("[status] connected to")) {
        statusDot.className = "status-dot connected";
    } else if (value.includes("[status]")) {
        statusDot.className = "status-dot disconnected";
    }
}

function addEvent(value) {
    const div = document.createElement("div");

    div.className = "event";
    div.textContent = value;

    log.prepend(div);
}


const source = new EventSource("/events");


source.onmessage = event => {
    const data = JSON.parse(event.data);
    updateStatus(data);
    addEvent(data);
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

    // send existing history in chronological order (oldest first so newest updates client status last)
    for (let i = events.length - 1; i >= 0; i--) {
      res.write(`data: ${JSON.stringify(events[i])}\n\n`);
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

const http = require("http");
const { execSync, exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

let currentModel = null;
let activeRequests = 0;
let pendingSwapModel = null;
const queue = [];

async function stopModel(model) {
  if (!model) return;
  try {
    await execAsync(`ollama stop ${model}`);
  } catch (_) {}
}

function getTimestamp() {
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    " " +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes())
  );
}

async function performSwap() {
  console.log(`${getTimestamp()} Performing swap: ${currentModel} → ${pendingSwapModel}`);
  await stopModel(currentModel);
  currentModel = pendingSwapModel;
  pendingSwapModel = null;
  console.log(`${getTimestamp()} Swap complete. Resuming queue.`);
  await processQueue();
}

function forward({ req, res, bodyBuffer }) {
  activeRequests++;

  const proxyReq = http.request(
    {
      hostname: "localhost",
      port: 11434,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  const onFinish = async () => {
    activeRequests--;
    res.removeListener("finish", onFinish);
    res.removeListener("close", onFinish);
    proxyReq.removeListener("error", onError);

    if (pendingSwapModel && activeRequests === 0) {
      await performSwap();
    } else {
      await processQueue();
    }
  };

  const onError = (err) => {
    console.error(`${getTimestamp()} Proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(`Proxy error: ${err.message}`);
    }
    onFinish();
  };

  res.on("finish", onFinish);
  res.on("close", onFinish); // Handle aborted requests
  proxyReq.on("error", onError);

  proxyReq.write(bodyBuffer);
  proxyReq.end();
}

let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || pendingSwapModel) return;
  isProcessingQueue = true;

  try {
    while (queue.length > 0) {
      const next = queue[0];
      const { requestedModel } = next;

      // Initialization: first request sets the current model
      if (currentModel === null && requestedModel) {
        currentModel = requestedModel;
      }

      // Check if swap is needed
      if (requestedModel && currentModel && requestedModel !== currentModel) {
        pendingSwapModel = requestedModel;
        console.log(
          `${getTimestamp()} Swap detected: ${currentModel} → ${requestedModel}. Waiting for ${activeRequests} active requests to drain.`
        );
        if (activeRequests === 0) {
          await performSwap();
        }
        return; // Stop processing and keep items in queue
      }

      // No swap needed or not a model-switching request, forward it
      queue.shift();
      forward(next);
    }
  } finally {
    isProcessingQueue = false;
  }
}

const server = http.createServer((req, res) => {
  let chunks = [];

  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", async () => {
    const bodyBuffer = Buffer.concat(chunks);
    const bodyString = bodyBuffer.toString();

    let requestedModel = null;

    try {
      const json = JSON.parse(bodyString);

      if (json && typeof json.model === "string" && json.model.length > 0) {
        requestedModel = json.model;
      }
    } catch (_) {}

    const isDifferentModel = requestedModel && currentModel && requestedModel !== currentModel;

    if (!isDifferentModel && !pendingSwapModel && queue.length === 0) {
      // 🚀 Fast Path: No swap pending, no queue, same model. Forward in parallel.
      if (currentModel === null && requestedModel) {
        currentModel = requestedModel;
      }
      forward({ req, res, bodyBuffer });
    } else {
      // 🐢 Slow Path: Swap needed, or already swapping, or queue has items.
      queue.push({ req, res, bodyBuffer, requestedModel });
      await processQueue();
    }
  });
});

server.listen(3000, () => {
  console.log("🧠 Concurrent Ollama proxy with smart swapping running on :3000");
});

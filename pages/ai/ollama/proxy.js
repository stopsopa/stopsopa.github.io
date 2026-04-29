/**
 *  $(asdf which node | tr -d '\n') proxy.js $(which ollama | tr -d '\n')
 * DEBUG=1 $(asdf which node | tr -d '\n') proxy.js $(which ollama | tr -d '\n')
 */

const http = require("http");
const { execSync, exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

const DEBUG = process.env.DEBUG === "1";

let currentModel = null;
let activeRequests = 0;
let pendingSwapModel = null;
const queue = [];

const ollamaBin = process.argv[2] || "ollama";

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

const log = (...args) => console.log(getTimestamp(), ...args);
const logError = (...args) => console.error(getTimestamp(), ...args);
const debug = (...args) => { if (DEBUG) log(...args); };
const debugError = (...args) => { if (DEBUG) logError(...args); };

async function stopModel(model) {
  if (!model) return;
  const cmd = `${ollamaBin} stop ${model}`;
  debug(`Executing: ${cmd}`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout && stdout.trim()) debug(`stopModel stdout:\n${stdout.trim()}`);
    if (stderr && stderr.trim()) debugError(`stopModel stderr:\n${stderr.trim()}`);
  } catch (error) {
    debugError(`stopModel error (code ${error.code || 'unknown'}): ${error.message}`);
    if (error.stdout && error.stdout.trim()) debug(`stopModel error stdout:\n${error.stdout.trim()}`);
    if (error.stderr && error.stderr.trim()) debugError(`stopModel error stderr:\n${error.stderr.trim()}`);
  }
}

async function performSwap() {
  log(`Performing swap: ${currentModel} → ${pendingSwapModel}`);
  await stopModel(currentModel);
  currentModel = pendingSwapModel;
  pendingSwapModel = null;
  debug(`Swap complete.`);
}

function forward({ req, res, bodyBuffer }) {
  activeRequests++;
  const id = Math.random().toString(36).substring(7);
  debug(`[${id}] Forwarding ${req.method} ${req.url} (active: ${activeRequests})`);

  const proxyReq = http.request(
    {
      hostname: "localhost",
      port: 11434,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      debug(`[${id}] Response: ${proxyRes.statusCode}`);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  let finished = false;
  const handleFinish = () => onFinish("finish");
  const handleClose = () => onFinish("close");

  const onFinish = async (reason) => {
    if (finished) return;
    finished = true;
    activeRequests--;
    debug(`[${id}] Finished (${reason}). Remaining active: ${activeRequests}`);
    res.removeListener("finish", handleFinish);
    res.removeListener("close", handleClose);
    proxyReq.removeListener("error", onError);

    if (pendingSwapModel && activeRequests === 0) {
      await performSwap();
    }
    await processQueue();
  };

  const onError = (err) => {
    debugError(`[${id}] Proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(`Proxy error: ${err.message}`);
    }
    onFinish("error");
  };

  res.on("finish", handleFinish);
  res.on("close", handleClose); // Handle aborted requests
  proxyReq.on("error", onError);

  proxyReq.write(bodyBuffer);
  proxyReq.end();
}

let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) {
    debug(`processQueue: Already processing, skipping.`);
    return;
  }
  if (pendingSwapModel) {
    debug(`processQueue: Swap pending (${pendingSwapModel}), skipping.`);
    return;
  }
  isProcessingQueue = true;
  debug(`processQueue: Starting (queue size: ${queue.length})`);

  try {
    while (queue.length > 0) {
      const next = queue[0];
      const { requestedModel } = next;

      // Initialization: first request sets the current model
      if (currentModel === null && requestedModel) {
        currentModel = requestedModel;
        debug(`Initialized currentModel to: ${currentModel}`);
      }

      // Check if swap is needed
      if (requestedModel && currentModel && requestedModel !== currentModel) {
        pendingSwapModel = requestedModel;
        debug(
          `Swap detected: ${currentModel} → ${requestedModel}. Waiting for ${activeRequests} active requests to drain.`
        );
        if (activeRequests === 0) {
          await performSwap();
          continue;
        }
        return; // Stop processing and keep items in queue
      }

      // No swap needed or not a model-switching request, forward it
      queue.shift();
      forward(next);
    }
  } finally {
    debug(`processQueue: Finished.`);
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
      debug(`Enqueuing request for ${requestedModel} (queue size: ${queue.length + 1})`);
      queue.push({ req, res, bodyBuffer, requestedModel });
      await processQueue();
    }
  });
});

server.listen(3000, () => {
  console.log("🧠 Concurrent Ollama proxy with smart swapping running on :3000");
});

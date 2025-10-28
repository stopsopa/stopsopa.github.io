#!/usr/bin/env node

/**
 * node intercept.js -- node node_modules/.bin/mcp-server-filesystem . 
 * node intercept.js -- node node_modules/.bin/mcp-server-filesystem ./files
 * 
 * Later I have found https://github.com/modelcontextprotocol/inspector
 *   but after I wrote this interceptor...
 *   found it here: https://github.com/modelcontextprotocol/servers/tree/2025.9.25/src/fetch#debugging
 *     and that I found here: https://youtu.be/oM2dXJnD80c?t=219
 * 
 * 
 */

import { spawn } from "child_process";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

const error = (...args) => console.error('[intercept.js]', ...args);

// Parse command line arguments
const separatorIndex = process.argv.indexOf("--");
if (separatorIndex === -1 || separatorIndex === process.argv.length - 1) {
  error("Usage: intercept.js -- <command> [args...]");
  error("Example: intercept.js -- node server.js");
  process.exit(1);
}

const commandArgs = process.argv.slice(separatorIndex + 1);
const [command, ...args] = commandArgs;

// Ensure ./var directory exists
// create deep directory but avoid using mkdirp library

const varDir = path.join(process.cwd(), "var", "intercept.js");
if (!existsSync(varDir)) {
  error(`Creating directory: ${varDir}`);
  mkdirSync(varDir, { recursive: true });
}

// Generate timestamped log filename in ./var/
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace(/\.\d{3}Z$/, "");
const logFile = path.join(varDir, `${timestamp}-log.log`);

error(`Logging to: ${logFile}`);
error(`Executing: ${command} ${args.join(" ")}`);

// Track pending requests for matching with responses
const pendingRequests = new Map();

// Spawn the actual command
const child = spawn(command, args, {
  stdio: ["pipe", "pipe", "pipe"],
});

if (!child || !child.stdin || !child.stdout) {
  error("Failed to spawn child process");
  process.exit(1);
}

// Logging functions
function logEntry(entry) {
  try {
    appendFileSync(logFile, entry + "\n");
  } catch (err) {
    error("Failed to write to log:", err.message);
  }
}

function logRequestResponse(request, response, duration) {
  const entry = `
${new Date().toISOString()}
REQUEST:
${JSON.stringify(request, null, 2)}
RESPONSE:
${JSON.stringify(response, null, 2)}
DURATION: ${duration}ms --------------------------------------------------------

${"=".repeat(80)}
`;
  logEntry(entry);
}

function logOrphanedRequest(request) {
  const entry = `
${new Date().toISOString()}
REQUEST (no response received):
${JSON.stringify(request, null, 2)}

${"=".repeat(80)}
`;
  logEntry(entry);
}

function logOrphanedResponse(response) {
  const entry = `
${new Date().toISOString()}
RESPONSE (no matching request):
${JSON.stringify(response, null, 2)}

${"=".repeat(80)}
`;
  logEntry(entry);
}

// Setup stdin interception (parent → child)
let stdinBuffer = "";
process.stdin.on("data", (chunk) => {
  const data = chunk.toString();
  stdinBuffer += data;

  // Parse complete JSON messages (newline-delimited)
  const lines = stdinBuffer.split("\n");
  stdinBuffer = lines.pop() || ""; // Keep incomplete line

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        const startTime = Date.now();

        // Store request for later matching (if it has an ID)
        if (message.id !== undefined) {
          pendingRequests.set(message.id, {
            request: message,
            startTime,
          });
        } else {
          // Notification or malformed - log immediately
          logOrphanedRequest(message);
        }
      } catch (err) {
        // Not valid JSON - just forward it
        error(
          "Failed to parse stdin JSON:",
          err.message
        );
      }
    }
  }

  // Forward raw data to child stdin
  child.stdin.write(chunk);
});

// Setup stdout interception (child → parent)
let stdoutBuffer = "";
child.stdout.on("data", (chunk) => {
  const data = chunk.toString();
  stdoutBuffer += data;

  // Parse complete JSON messages
  const lines = stdoutBuffer.split("\n");
  stdoutBuffer = lines.pop() || "";

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);

        // Try to match with request
        if (message.id !== undefined && pendingRequests.has(message.id)) {
          const { request, startTime } = pendingRequests.get(message.id);
          const duration = Date.now() - startTime;

          // Log complete pair
          logRequestResponse(request, message, duration);

          // Cleanup
          pendingRequests.delete(message.id);
        } else {
          // Response without matching request or notification
          logOrphanedResponse(message);
        }
      } catch (err) {
        // Not valid JSON - just forward it
        error(
          "Failed to parse stdout JSON:",
          err.message
        );
      }
    }
  }

  // Forward raw data to parent stdout
  process.stdout.write(chunk);
});

// Pass stderr through transparently
child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

// Handle stdin end
process.stdin.on("end", () => {
  child.stdin.end();
});

// Handle child exit
child.on("exit", (code, signal) => {
  // Log any remaining unmatched requests
  if (pendingRequests.size > 0) {
    const entry = `
${new Date().toISOString()}
UNMATCHED REQUESTS AT EXIT (${pendingRequests.size}):
${Array.from(pendingRequests.values())
  .map(
    ({ request }) => `  - ID ${request.id}: ${request.method || "unknown"}`
  )
  .join("\n")}

${"=".repeat(80)}
`;
    logEntry(entry);
  }

  error(
    `Child exited with code ${code} signal ${signal}`
  );
  process.exit(code || 0);
});

child.on("error", (err) => {
  error("Child process error:", err);
  process.exit(1);
});

// Handle signals
process.on("SIGINT", () => {
  error("Received SIGINT, forwarding to child");
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  error("Received SIGTERM, forwarding to child");
  child.kill("SIGTERM");
});

// Log startup
logEntry(`${"=".repeat(80)}
INTERCEPT SESSION STARTED: ${new Date().toISOString()}
COMMAND: ${command} ${args.join(" ")}
${"=".repeat(80)}
`);

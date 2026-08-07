//
// SOCKET=var/socket.sock node bash/socket/subscribe.ts
// SOCKET=var/socket.sock node bash/socket/subscribe.ts --fresh
// SOCKET=var/socket.sock node bash/socket/subscribe.ts --regex '^(open|close)'
// SOCKET=var/socket.sock node bash/socket/subscribe.ts --regex '/^(open|close)$/i'
//
// USE this format, works the best:
//   SOCKET=var/socket.sock node bash/socket/subscribe.ts --regex "/^(abc|def)( .*)*\$/i"
//    test runs against entire message, except the part with timestamp
//    1786059828261_00001 def fdjksaflds
//                        |------------|--> this part is tested against regex
//
// Script should just try to connect to socket - exponentional backoff
//
// once it will connect it should start taking messages and print to the console.
//
//
// if connection lost it should just try to acquire connection - exponentional backoff
// and once connected it should try to continue
//
// all messages have format like
//
// "1786055195162_00001 fsfds"
//
// where first segment is unique id
//
// before forwarding message as is with that id to stdout we should extract it (simple split and take of rist segment up until first space)
//
// then store it in local MEMORY
// but before that we have to take old value from memory and check with first segment if MEMORY first segment is smaller than incomming log first segment then just forward to stdout
// if these are the same but second segment from new message is biggr than second segment from memory then also forward
// but if any of them is smaller than wait for new message
//
// only when we find newer incomming message we should update our local Memory with that timesegment like 1786055195162_00001 in our local memory
// and keep updating with each new incomming message
//
// What I'm trying to do here is to implement memory in this script to persist between loosing connection with server and be able to never repeat the same message to stdout
//
// Options:
//  --fresh / --from-now : Initializes memoryId with a fresh timestamp ID at startup to ignore historical messages from broker and only display new incoming messages.
//  --regex              : Regular expression pattern to filter the event payload (the portion after the initial ID segment).
//                         Supports standard string patterns or JS regex notation like "/pattern/i".
//                         IMPORTANT SHELL NOTE: In bash/zsh, double quotes ("...") expand dollar signs ($) as variables.
//                         Use single quotes ('...') or escape the dollar sign (\$) when using end-of-line anchors:
//                           --regex '/^(open|close)$/i'
//                           --regex "/^(transpile|esbuild_sh)\$/i"
//
// This module can also be imported as a library - see createSubscriber export.
// When run directly it replicates the same behaviour as before.
//

import net from "node:net";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Centralized error factory — prepends the module preamble to every thrown error.
function th(msg: string) {
  return new Error("subscribe.ts error: " + msg);
}

/**
 * Checks whether the specified path exists and is a valid Unix domain socket file.
 * When shouldThrow is true, throws via th() with a specific message instead of returning false.
 *
 * @param SOCKET Absolute or relative path to the Unix socket file
 * @param shouldThrow If true, throws on invalid socket instead of returning false
 * @returns true if path exists and is a socket file, false otherwise
 */
export function checkIfSocket(SOCKET: string, shouldThrow: boolean = false): boolean {
  if (typeof SOCKET !== "string" || !SOCKET.trim()) {
    if (shouldThrow) throw th("checkIfSocket: SOCKET path is required");
    return false;
  }

  if (!fs.existsSync(SOCKET)) {
    if (shouldThrow) throw th(`checkIfSocket: path does not exist >${SOCKET}<`);
    return false;
  }

  try {
    const stat = fs.statSync(SOCKET);
    const isSocket = stat.isSocket();
    if (!isSocket && shouldThrow) throw th(`checkIfSocket: path exists but is not a socket >${SOCKET}<`);
    return isSocket;
  } catch (err: any) {
    if (shouldThrow) throw th(`checkIfSocket: failed to stat >${SOCKET}<: ${err?.message ?? err}`);
    return false;
  }
}

/**
 * Creates an ID generator matching the broker format (13 digits + _ + 5 digits).
 */
export function createIdGenerator() {
  let lastValue = 0;
  let counter = 0;

  return function nextId() {
    const value = new Date().getTime();
    if (value === lastValue) {
      counter += 1;
    } else {
      lastValue = value;
      counter = 1;
    }

    return `${value}_${String(counter).padStart(5, "0")}`;
  };
}

export const stringToRegex = (function () {
  /**
   * @param {string} v
   */
  return (v: string): RegExp => {
    try {
      const vv = v.match(/(\\.|[^/])+/g);

      if (!vv || vv.length > 2) {
        throw th(`stringToRegex: param '${v}' should split to one or two segments`);
      }

      return new RegExp(vv[0], vv[1]);
    } catch (e: any) {
      throw th(`stringToRegex: string '${v}' error: ${e?.message ?? e}`);
    }
  };
})();

/**
 * Parses --regex CLI argument into a RegExp instance using stringToRegex.
 */
export function getRegexArg(): RegExp | null {
  const index = process.argv.indexOf("--regex");
  if (index !== -1 && index + 1 < process.argv.length) {
    const rawPattern = process.argv[index + 1].trim();
    if (!rawPattern) {
      return null;
    }

    try {
      return stringToRegex(rawPattern);
    } catch (err: any) {
      console.error(`subscribe.ts error: Invalid regex pattern provided to --regex: ${err?.message ?? err}`);
      process.exit(1);
    }
  }
  return null;
}

/**
 * Parses an ID string formatted as "<segment1>_<segment2>" into numerical components.
 * Returns null if parsing fails.
 *
 * @param id ID string such as "1786055195162_00001"
 */
export function parseId(id: string | null): { seg1: number; seg2: number } | null {
  if (!id) {
    return null;
  }
  const parts = id.split("_");
  if (parts.length !== 2) {
    return null;
  }
  const seg1 = Number(parts[0]);
  const seg2 = Number(parts[1]);
  if (Number.isNaN(seg1) || Number.isNaN(seg2)) {
    return null;
  }
  return { seg1, seg2 };
}

/**
 * Compares incoming ID against a reference ID.
 * Returns true if incoming ID is strictly newer than reference ID.
 *
 * Rule:
 * 1. If reference ID is null/empty, incoming ID is considered newer.
 * 2. Compare first segment (numeric timestamp / sequence).
 * 3. If first segments are equal, compare second segment (numeric index).
 *
 * @param incomingId ID extracted from incoming message
 * @param referenceId Reference ID to compare against (e.g. memoryId or last seen ID)
 */
export function isNewer(incomingId: string | null, referenceId: string | null): boolean {
  if (!incomingId) {
    return false;
  }
  if (!referenceId) {
    return true;
  }

  const incomingParsed = parseId(incomingId);
  const referenceParsed = parseId(referenceId);

  // If IDs do not follow segment_segment format, fall back to string comparison
  if (!incomingParsed || !referenceParsed) {
    return incomingId > referenceId;
  }

  if (incomingParsed.seg1 > referenceParsed.seg1) {
    return true;
  }

  if (incomingParsed.seg1 === referenceParsed.seg1 && incomingParsed.seg2 > referenceParsed.seg2) {
    return true;
  }

  return false;
}

export interface SubscriberOptions {
  socket: string;
  filterRegex?: RegExp | null;
  fresh?: boolean;
  // called for each accepted line, defaults to console.log
  onLine?: (line: string) => void;
}

/**
 * Creates a subscriber that connects to the Unix domain socket with exponential backoff,
 * deduplicates messages across reconnects using memoryId, and filters with optional regex.
 *
 * Returns an object with stop() to cancel any pending reconnect timers.
 *
 * Usage example:
 *   const { stop } = createSubscriber({
 *     socket: "var/socket.sock",
 *     fresh: true,
 *     filterRegex: /^open/,
 *     onLine: (line) => console.log("got:", line),
 *   });
 *   // later: stop();
 *
 * @param options SubscriberOptions
 */
export function createSubscriber(options: SubscriberOptions): { stop: () => void } {
  const { socket, filterRegex = null, fresh = false, onLine = (line: string) => console.log(line) } = options;

  checkIfSocket(socket, true);

  const nextId = createIdGenerator();

  // Exponential backoff configuration
  let reconnectTimer: NodeJS.Timeout | null = null;
  let attempt = 0;
  const INITIAL_BACKOFF_MS = 1000;
  const MAX_BACKOFF_MS = 30000;
  const BACKOFF_FACTOR = 2;

  let stopped = false;

  /**
   * Stores the last processed message ID segment (e.g., "1786055195162_00001").
   * Keeps track across socket reconnects to prevent duplicate or out-of-order logs from being output.
   * If fresh option is true, initialize memoryId with current timestamp ID to ignore past history.
   */
  let memoryId: string | null = fresh ? nextId() : null;

  /**
   * Processes incoming socket line:
   * 1. Extracts first segment (unique ID) and verifies if it is newer than local memoryId.
   * 2. Updates local memoryId to keep track of state across socket reconnects.
   * 3. Extracts remaining payload (event + data) and evaluates against filterRegex if present.
   * 4. Calls onLine with original line only if it is newer AND matches the regex filter.
   *
   * @param line Single log line received from socket
   */
  function processLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    // Extract first segment up until first space (e.g. "1786055195162_00001")
    const spaceIndex = trimmed.indexOf(" ");
    const incomingId = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
    const payload = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1);

    // Check if incoming message is newer than what we have in memory
    if (isNewer(incomingId, memoryId)) {
      // Always update memoryId so we advance our sequence tracking
      memoryId = incomingId;

      // Evaluate regex filter on the payload (event + data after unique ID)
      if (!filterRegex || filterRegex.test(payload)) {
        onLine(trimmed);
      }
    }
  }

  /**
   * Connect to Unix socket with exponential backoff strategy.
   */
  function connectSocket() {
    if (stopped) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    const client = net.createConnection(socket);

    client.on("connect", () => {
      attempt = 0;
    });

    let buffer = "";

    client.on("data", (chunk) => {
      buffer += chunk.toString();

      while (true) {
        const index = buffer.indexOf("\n");
        if (index === -1) {
          break;
        }

        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);

        processLine(line);
      }
    });

    client.on("error", () => {
      // Error handler prevents unhandled error exception; close listener handles reconnect
    });

    client.on("close", () => {
      scheduleReconnect();
    });
  }

  /**
   * Schedule reconnection using exponential backoff delay.
   */
  function scheduleReconnect() {
    if (stopped) {
      return;
    }

    const delay = Math.min(INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt), MAX_BACKOFF_MS);
    attempt++;

    reconnectTimer = setTimeout(() => {
      connectSocket();
    }, delay);
  }

  // Start initial connection attempt
  connectSocket();

  return {
    stop() {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    },
  };
}

// Detect if this module was run directly (not imported as a library).
// When run directly, parse CLI args and start the subscriber.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  // Read socket path from environment variable
  const SOCKET = process.env.SOCKET;

  if (!SOCKET) {
    console.error("subscribe.ts error: SOCKET env variable is required");
    process.exit(1);
  }

  const isFresh = process.argv.includes("--fresh") || process.argv.includes("--from-now");

  const filterRegex = getRegexArg();

  createSubscriber({ socket: SOCKET, filterRegex, fresh: isFresh });
}

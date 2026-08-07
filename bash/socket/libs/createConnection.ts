import net from "node:net";
import { checkIfSocket } from "./checkIfSocket.ts";
import { createIdGenerator, isNewer } from "./idUtils.ts";

/**
 * Options for createConnection.
 *
 * socket      - Path to the Unix domain socket file.
 * fresh       - If true, initializes memoryId with a fresh timestamp ID at startup to
 *               ignore historical messages from broker and only display new incoming ones.
 * filterRegex - Optional RegExp to filter incoming messages against the payload portion
 *               (everything after the leading ID segment).
 * onLine      - Called for each accepted incoming line. Defaults to console.log.
 *               Receives the full trimmed line including the leading ID segment.
 */
export interface CreateConnectionOptions {
  socket: string;
  fresh?: boolean;
  filterRegex?: RegExp | null;
  onLine?: (line: string) => void;
}

/**
 * The object returned by createConnection.
 *
 * send          - Writes a message to the socket. Returns true on success, false if socket
 *                 is not yet writable (e.g. still connecting / reconnecting).
 * getFreshClient - Returns the current underlying net.Socket instance.
 *                  The connection uses exponential backoff reconnect, so the underlying
 *                  client instance is replaced on every reconnect. Always call getFreshClient()
 *                  at the moment you need the socket rather than caching its return value.
 * stop          - Cancels any pending reconnect timers and prevents further reconnects.
 */
export interface ManagedConnection {
  send: (message: string) => boolean;
  /**
   * Returns the current underlying net.Socket instance.
   *
   * Why getFreshClient() and not a plain `client` property:
   * The connection automatically reconnects with exponential backoff whenever the socket
   * closes or errors. Each reconnect creates a brand-new net.Socket object and replaces
   * the previous one. Exposing a plain `client` property would freeze the reference at
   * the moment of creation and the caller would hold a stale, destroyed socket.
   * getFreshClient() always resolves to the latest live socket, keeping the caller safe
   * even across multiple reconnect cycles.
   */
  getFreshClient: () => net.Socket | null;
  stop: () => void;
}

/**
 * Creates a managed connection to a Unix domain socket with:
 * - Exponential backoff reconnect on disconnect/error.
 * - Incoming message deduplication via memoryId (survives reconnects).
 * - Optional regex filtering of incoming message payloads.
 * - send() method to write outgoing messages at any point (silently no-ops when not writable).
 *
 * This is the single low-level building block used by both createPublisher and createSubscriber.
 *
 * Usage example:
 *   const conn = createConnection({
 *     socket: "var/socket.sock",
 *     fresh: true,
 *     filterRegex: /^open/,
 *     onLine: (line) => console.log("got:", line),
 *   });
 *   conn.send("transpile file.ts");
 *   // later:
 *   conn.stop();
 *
 * @param options CreateConnectionOptions
 */
export function createConnection(options: CreateConnectionOptions): ManagedConnection {
  const {
    socket,
    fresh = false,
    filterRegex = null,
    onLine = (line: string) => console.log(line),
  } = options;

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

  // Current active socket instance. Replaced on every reconnect.
  let currentClient: net.Socket | null = null;

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

  /**
   * Connect to Unix socket with exponential backoff strategy.
   * Replaces currentClient with a new net.Socket on every attempt.
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
    currentClient = client;

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
      if (currentClient === client) {
        currentClient = null;
      }
      scheduleReconnect();
    });
  }

  // Start initial connection attempt
  connectSocket();

  return {
    send(message: string): boolean {
      const trimmed = message.trim();
      if (!trimmed) {
        return false;
      }
      if (!currentClient || currentClient.destroyed || !currentClient.writable) {
        return false;
      }
      return currentClient.write(`${trimmed}\n`);
    },

    /**
     * Returns the current underlying net.Socket instance.
     *
     * Why getFreshClient() and not a plain `client` property:
     * The connection automatically reconnects with exponential backoff whenever the socket
     * closes or errors. Each reconnect creates a brand-new net.Socket object and replaces
     * the previous one. Exposing a plain `client` property would freeze the reference at
     * the moment of creation and the caller would hold a stale, destroyed socket.
     * getFreshClient() always resolves to the latest live socket, keeping the caller safe
     * even across multiple reconnect cycles. May return null if currently between reconnects.
     */
    getFreshClient(): net.Socket | null {
      return currentClient;
    },

    stop() {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (currentClient && !currentClient.destroyed) {
        currentClient.destroy();
        currentClient = null;
      }
    },
  };
}

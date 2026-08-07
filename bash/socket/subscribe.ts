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
//                        |------------|-->  this part is tested against regex
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

import { fileURLToPath } from "node:url";
import { createConnection, type ManagedConnection } from "./libs/createConnection.ts";

export { checkIfSocket } from "./libs/checkIfSocket.ts";
export { createIdGenerator, parseId, isNewer } from "./libs/idUtils.ts";
export { stringToRegex, getRegexArg } from "./libs/regex.ts";

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
 *   // later: stop()
 *
 * @param options SubscriberOptions
 */
export function createSubscriber(options: SubscriberOptions): { stop: () => void } {
  const { socket, filterRegex = null, fresh = false, onLine = (line: string) => console.log(line) } = options;

  const conn: ManagedConnection = createConnection({ socket, fresh, filterRegex, onLine });

  return {
    stop() {
      conn.stop();
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

  // Import getRegexArg lazily after checking isMain to avoid any side-effects at import time
  const { getRegexArg } = await import("./libs/regex.ts");
  const filterRegex = getRegexArg();

  createSubscriber({ socket: SOCKET, filterRegex, fresh: isFresh });
}

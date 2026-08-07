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
// This module can also be imported as a library - see createConnection export from libs/createConnection.ts.
// When run directly it replicates the same behaviour as before.
//

import { fileURLToPath } from "node:url";
import { createConnection } from "./libs/createConnection.ts";
import { checkIfSocket } from "./libs/checkIfSocket.ts";

export { createIdGenerator, parseId, isNewer, stringToRegex } from "./libs/idUtils.ts";
export { createConnection } from "./libs/createConnection.ts";
export { checkIfSocket } from "./libs/checkIfSocket.ts";

// Detect if this module was run directly (not imported as a library).
// When run directly, parse CLI args and start the subscriber.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const SOCKET = process.env.SOCKET as string;

  checkIfSocket(SOCKET, true);

  const isFresh = process.argv.includes("--fresh") || process.argv.includes("--from-now");

  const regexIdx = process.argv.indexOf("--regex");
  const filterRegex = regexIdx !== -1 && regexIdx + 1 < process.argv.length ? process.argv[regexIdx + 1] : null;

  createConnection({
    socket: SOCKET,
    filterRegex,
    fresh: isFresh,
    // replace this function with any custom logic to handle each incoming line
    onLine: (line: string) => {
      console.log(line);
    },
  });
}

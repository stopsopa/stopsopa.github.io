//
// SOCKET=var/socket.sock node socket/node/subscribeDemo.ts
// SOCKET=var/socket.sock node socket/node/subscribeDemo.ts --fresh
// SOCKET=var/socket.sock node socket/node/subscribeDemo.ts --regex '^(open|close)'
// SOCKET=var/socket.sock node socket/node/subscribeDemo.ts --regex '/^(open|close)$/i'
//
// USE this format, works the best:
//   SOCKET=var/socket.sock node socket/node/subscribeDemo.ts --regex "/^(abc|def)( .*)*\$/i"
//
// Demo: replicates subscribe.ts direct-run behavior using exported library functions.
// No custom logic - just wiring createSubscriber with parsed CLI args.
//

import { createSubscriber, getRegexArg } from "./subscribe.ts";

// Read socket path from environment variable
const SOCKET = process.env.SOCKET;

if (!SOCKET) {
  console.error("SOCKET env variable is required");
  process.exit(1);
}

const isFresh = process.argv.includes("--fresh") || process.argv.includes("--from-now");

const filterRegex = getRegexArg();

createSubscriber({
  socket: SOCKET,
  filterRegex,
  fresh: isFresh,
  // replace this function with any custom logic to handle each incoming line
  onLine: (line: string) => {
    console.log(line);
  },
});

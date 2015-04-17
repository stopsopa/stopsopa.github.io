import fs from "node:fs";

// Centralized error factory — prepends the module preamble to every thrown error.
function th(msg: string) {
  return new Error("checkIfSocket error: " + msg);
}

/**
 * Checks whether the specified path exists and is a valid Unix domain socket file.
 * When shouldThrow is true, throws via th() with a specific message instead of returning false.
 *
 * @param SOCKET Absolute or relative path to the Unix socket file
 * @param shouldThrow If true, throws on invalid socket instead of returning false
 * @returns true if path exists and is a socket file, false otherwise
 */
export function checkIfSocket(SOCKET: string): boolean {
  if (typeof SOCKET !== "string" || !SOCKET.trim()) {
    throw th("SOCKET path is required");
  }

  if (!fs.existsSync(SOCKET)) {
    throw th(`path does not exist >${SOCKET}<`);
  }

  try {
    const stat = fs.statSync(SOCKET);
    const isSocket = stat.isSocket();
    if (!isSocket) {
      throw th(`path exists but is not a socket >${SOCKET}<`);
    }
    return isSocket;
  } catch (err: any) {
    throw th(`failed to stat >${SOCKET}<: ${err?.message ?? err}`);
  }
}

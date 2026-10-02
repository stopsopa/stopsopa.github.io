/**
 * Interactive fuzzy search filter for terminal pipelines and file selection.
 *
 * Can receive piped lines from stdin (e.g. find ... | fuzzy.ts) or
 * defaults to searching files using find command if stdin is a terminal.
 *
 * Interactive display and key handling are directed to /dev/tty,
 * while the final chosen line is written to stdout so it can be captured
 * into a bash variable like:
 *   FOUND="$(bash/file/fuzzy.ts)"
 *   FOUND="$(find . -iname '*.e2e*' | bash/file/fuzzy.ts)"
 *   FOUND="$(node --experimental-strip-types bash/file/fuzzy.ts)"
 *
 * find . \( -type d \( -name 'node_modules' -o -name '.git' -o -name '.venv' \) -prune \) -o \( -type f -iname '*.e2e*' -print \) | NODE_OPTIONS= node bash/file/fuzzy.ts
 */

import fs from "node:fs";
import tty from "node:tty";
import readline from "node:readline";
import { execFile } from "node:child_process";

interface FuzzyMatch {
  line: string;
  indices: number[];
  score: number;
}

/**
 * Case-insensitive fuzzy search matching a single token against a target string.
 * Characters in token must appear in order in target string.
 * Prioritizes contiguous matches, word boundaries, and shorter spans.
 */
function fuzzyMatch(line: string, token: string): { indices: number[]; score: number } | null {
  if (token.length === 0) {
    return { indices: [], score: 0 };
  }

  const lowerLine = line.toLowerCase();
  const lowerToken = token.toLowerCase();

  // Check for contiguous substring match first
  const subIdx = lowerLine.indexOf(lowerToken);
  if (subIdx !== -1) {
    const indices: number[] = [];
    for (let i = 0; i < lowerToken.length; i++) {
      indices.push(subIdx + i);
    }
    // High base score for contiguous match; bonus for matching closer to filename end
    const score = 1000 + subIdx * 2;
    return { indices, score };
  }

  // Subsequence matching
  let tIdx = 0;
  const indices: number[] = [];
  for (let i = 0; i < line.length && tIdx < lowerToken.length; i++) {
    if (lowerLine[i] === lowerToken[tIdx]) {
      indices.push(i);
      tIdx++;
    }
  }

  if (tIdx === lowerToken.length) {
    let score = 0;
    let prev = -2;
    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      if (idx === prev + 1) {
        score += 25; // Consecutive character bonus
      }
      if (idx === 0 || "/_.-".includes(line[idx - 1])) {
        score += 20; // Word or directory boundary bonus
      }
      if (line[idx] === token[k]) {
        score += 5; // Exact case match bonus
      }
      prev = idx;
    }
    const span = indices[indices.length - 1] - indices[0];
    score -= span;
    score -= line.length * 0.1;
    return { indices, score };
  } else {
    return null;
  }
}

/**
 * Matches target line against search query containing one or more space-separated tokens.
 * All tokens must match for the line to be included.
 */
function matchLine(line: string, query: string): { indices: number[]; score: number } | null {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { indices: [], score: 0 };
  }

  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  const combinedIndices: number[] = [];
  let totalScore = 0;

  for (const token of tokens) {
    const match = fuzzyMatch(line, token);
    if (match === null) {
      return null;
    }
    combinedIndices.push(...match.indices);
    totalScore += match.score;
  }

  return { indices: combinedIndices, score: totalScore };
}

/**
 * Formats a candidate line for terminal display.
 * Selected row is highlighted in yellow.
 * Matched character indices are highlighted using ANSI REVERSE video.
 */
function formatHighlightedLine(line: string, indices: number[], isSelected: boolean): string {
  const REVERSE = "\x1b[7m";
  const RESET_REVERSE = "\x1b[27m";
  const RESET = "\x1b[0m";

  const indexSet = new Set(indices);
  let highlighted = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (indexSet.has(i)) {
      highlighted += `${REVERSE}${char}${RESET_REVERSE}`;
    } else {
      highlighted += char;
    }
  }

  if (isSelected) {
    // Yellow styling for selected row
    const YELLOW = "\x1b[1;33m";
    return `${YELLOW}> ${highlighted}${RESET}`;
  } else {
    return `  ${highlighted}${RESET}`;
  }
}

/**
 * Reads lines piped via standard input.
 */
async function readStdinLines(): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  const lines: string[] = [];
  for await (const line of rl) {
    if (line.trim().length > 0) {
      lines.push(line.trim());
    }
  }
  return lines;
}

/**
 * Runs default find command when stdin is an interactive terminal.
 */
async function runDefaultFind(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const args = [
      ".",
      "(",
      "-type",
      "d",
      "(",
      "-name",
      "node_modules",
      "-o",
      "-name",
      ".git",
      "-o",
      "-name",
      ".venv",
      ")",
      "-prune",
      ")",
      "-o",
      "(",
      "-type",
      "f",
      "-iname",
      "*.e2e*",
      "-print",
      ")",
    ];

    execFile("find", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        const lines = stdout
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        resolve(lines);
      }
    });
  });
}

/**
 * Main entry point: prepares data, connects to /dev/tty, and runs interactive event loop.
 */
async function main(): Promise<void> {
  let allLines: string[] = [];

  // Determine source of lines: piped stdin or default find command
  if (process.stdin.isTTY) {
    allLines = await runDefaultFind();
  } else {
    allLines = await readStdinLines();
  }

  // Print exact error to stderr and exit 1 if input stream is empty
  if (allLines.length === 0) {
    process.stderr.write("fuzzy.ts error: input stream is empty\n");
    process.exit(1);
  }

  // Open /dev/tty for interactive user interface
  let ttyInFd: number;
  let ttyOutFd: number;
  try {
    ttyInFd = fs.openSync("/dev/tty", "r");
    ttyOutFd = fs.openSync("/dev/tty", "w");
  } catch (err) {
    process.stderr.write(
      `fuzzy.ts error: cannot open /dev/tty (${err instanceof Error ? err.message : String(err)})\n`
    );
    process.exit(1);
  }

  const ttyIn = new tty.ReadStream(ttyInFd);
  const ttyOut = new tty.WriteStream(ttyOutFd);

  let query = "";
  let cursorIndex = 0;
  let selectedIndex = 0;
  let scrollOffset = 0;
  let renderedLineCount = 0;
  let filtered: FuzzyMatch[] = [];

  /**
   * Filters and sorts candidate lines according to current search query.
   */
  function updateFiltered(): void {
    if (query.trim().length === 0) {
      filtered = allLines.map((line) => ({
        line,
        indices: [],
        score: 0,
      }));
    } else {
      const matches: FuzzyMatch[] = [];
      for (const line of allLines) {
        const match = matchLine(line, query);
        if (match !== null) {
          matches.push({
            line,
            indices: match.indices,
            score: match.score,
          });
        }
      }
      matches.sort((a, b) => b.score - a.score);
      filtered = matches;
    }
  }

  /**
   * Cleans up terminal state and exits process.
   * Prints error to stderr if no line was selected.
   */
  function cleanupAndExit(selectedLine: string | null, exitCode: number): void {
    let clearBuf = "";
    if (renderedLineCount > 0) {
      clearBuf += `\r\x1b[${renderedLineCount}A`;
      for (let i = 0; i < renderedLineCount; i++) {
        clearBuf += `\r\x1b[2K\r\n`;
      }
      clearBuf += `\x1b[${renderedLineCount}A\r`;
    }
    clearBuf += "\x1b[?7h\x1b[?25h"; // Restore autowrap and cursor
    ttyOut.write(clearBuf);

    try {
      ttyIn.setRawMode(false);
      ttyIn.pause();
      fs.closeSync(ttyInFd);
      fs.closeSync(ttyOutFd);
    } catch {
      // Ignore cleanup close errors
    }

    if (selectedLine !== null && exitCode === 0) {
      process.stdout.write(selectedLine, () => {
        process.exit(0);
      });
    } else {
      process.stderr.write("fuzzy.ts error: nothing selected\n");
      process.exit(1);
    }
  }

  /**
   * Renders the interactive prompt and candidate rows to /dev/tty.
   */
  function render(): void {
    const terminalHeight = ttyOut.rows || 24;
    const maxVisible = Math.max(3, Math.min(15, terminalHeight - 3));

    // Keep selectedIndex within valid bounds
    if (filtered.length === 0) {
      selectedIndex = 0;
    } else if (selectedIndex >= filtered.length) {
      selectedIndex = filtered.length - 1;
    } else if (selectedIndex < 0) {
      selectedIndex = 0;
    }

    // Keep cursorIndex within valid bounds
    if (cursorIndex < 0) {
      cursorIndex = 0;
    } else if (cursorIndex > query.length) {
      cursorIndex = query.length;
    }

    // Adjust scrolling window
    if (selectedIndex < scrollOffset) {
      scrollOffset = selectedIndex;
    } else if (selectedIndex >= scrollOffset + maxVisible) {
      scrollOffset = selectedIndex - maxVisible + 1;
    }

    const visibleItems = filtered.slice(scrollOffset, scrollOffset + maxVisible);
    const linesToRender: string[] = [];

    // Prompt header with cursor position
    const countStr = ` (${filtered.length}/${allLines.length})`;
    let queryWithCursor = "";
    if (cursorIndex < query.length) {
      const before = query.slice(0, cursorIndex);
      const at = query[cursorIndex];
      const after = query.slice(cursorIndex + 1);
      queryWithCursor = `${before}\x1b[7m${at}\x1b[27m${after}`;
    } else {
      queryWithCursor = `${query}\x1b[7m \x1b[27m`;
    }

    linesToRender.push(`> ${queryWithCursor}\x1b[90m${countStr}\x1b[0m`);

    // Visible item rows
    for (let i = 0; i < visibleItems.length; i++) {
      const itemIndex = scrollOffset + i;
      const isSelected = itemIndex === selectedIndex;
      const match = visibleItems[i];
      linesToRender.push(formatHighlightedLine(match.line, match.indices, isSelected));
    }

    if (visibleItems.length === 0) {
      linesToRender.push("  \x1b[90m(no matches)\x1b[0m");
    }

    let buf = "\x1b[?7l\x1b[?25l"; // Disable autowrap and hide cursor during redraw

    if (renderedLineCount > 0) {
      buf += `\r\x1b[${renderedLineCount}A`;
    }

    for (let i = 0; i < linesToRender.length; i++) {
      buf += `\r\x1b[2K${linesToRender[i]}\r\n`;
    }

    if (renderedLineCount > linesToRender.length) {
      const diff = renderedLineCount - linesToRender.length;
      for (let i = 0; i < diff; i++) {
        buf += "\r\x1b[2K\r\n";
      }
      buf += `\x1b[${diff}A`;
    }

    renderedLineCount = linesToRender.length;
    ttyOut.write(buf);
  }

  // Handle process termination signals
  process.on("SIGINT", () => cleanupAndExit(null, 1));
  process.on("SIGTERM", () => cleanupAndExit(null, 1));

  // Configure tty input stream
  ttyIn.setRawMode(true);
  ttyIn.resume();
  ttyIn.setEncoding("utf8");

  // Initial filter and render
  updateFiltered();
  render();

  // Listen for user keystrokes
  ttyIn.on("data", (chunk: string) => {
    // Ctrl+C
    if (chunk === "\u0003") {
      cleanupAndExit(null, 1);
      return;
    }

    // Ctrl+D
    if (chunk === "\u0004") {
      cleanupAndExit(null, 1);
      return;
    }

    // Enter / Return
    if (chunk === "\r" || chunk === "\n") {
      if (filtered.length > 0) {
        cleanupAndExit(filtered[selectedIndex].line, 0);
      } else {
        cleanupAndExit(null, 1);
      }
      return;
    }

    // Backspace
    if (chunk === "\x7f" || chunk === "\x08") {
      if (cursorIndex > 0) {
        query = query.slice(0, cursorIndex - 1) + query.slice(cursorIndex);
        cursorIndex -= 1;
        selectedIndex = 0;
        updateFiltered();
        render();
      }
      return;
    }

    // Forward Delete key
    if (chunk === "\u001b[3~") {
      if (cursorIndex < query.length) {
        query = query.slice(0, cursorIndex) + query.slice(cursorIndex + 1);
        selectedIndex = 0;
        updateFiltered();
        render();
      }
      return;
    }

    // Left Arrow: move cursor left in query
    if (chunk === "\u001b[D" || chunk === "\u001bOD") {
      if (cursorIndex > 0) {
        cursorIndex -= 1;
        render();
      }
      return;
    }

    // Right Arrow: move cursor right in query
    if (chunk === "\u001b[C" || chunk === "\u001bOC") {
      if (cursorIndex < query.length) {
        cursorIndex += 1;
        render();
      }
      return;
    }

    // Home or Ctrl+A: move cursor to start of query
    if (
      chunk === "\u001b[H" ||
      chunk === "\u001b[1~" ||
      chunk === "\u001b[7~" ||
      chunk === "\u001bOH" ||
      chunk === "\u0001"
    ) {
      cursorIndex = 0;
      render();
      return;
    }

    // End or Ctrl+E: move cursor to end of query
    if (
      chunk === "\u001b[F" ||
      chunk === "\u001b[4~" ||
      chunk === "\u001b[8~" ||
      chunk === "\u001bOF" ||
      chunk === "\u0005"
    ) {
      cursorIndex = query.length;
      render();
      return;
    }

    // Up Arrow or Ctrl+P: navigate candidates list up
    if (chunk === "\u001b[A" || chunk === "\u001bOA" || chunk === "\u0010") {
      if (filtered.length > 0) {
        selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
        render();
      }
      return;
    }

    // Down Arrow or Ctrl+N: navigate candidates list down
    if (chunk === "\u001b[B" || chunk === "\u001bOB" || chunk === "\u000e") {
      if (filtered.length > 0) {
        selectedIndex = (selectedIndex + 1) % filtered.length;
        render();
      }
      return;
    }

    // Page Up
    if (chunk === "\u001b[5~") {
      if (filtered.length > 0) {
        selectedIndex = Math.max(0, selectedIndex - 5);
        render();
      }
      return;
    }

    // Page Down
    if (chunk === "\u001b[6~") {
      if (filtered.length > 0) {
        selectedIndex = Math.min(filtered.length - 1, selectedIndex + 5);
        render();
      }
      return;
    }

    // Escape
    if (chunk === "\u001b") {
      cleanupAndExit(null, 1);
      return;
    }

    // Ctrl+U (clear line)
    if (chunk === "\u0015") {
      query = "";
      cursorIndex = 0;
      selectedIndex = 0;
      updateFiltered();
      render();
      return;
    }

    // Ctrl+W (delete previous word)
    if (chunk === "\u0017") {
      if (cursorIndex > 0) {
        const before = query.slice(0, cursorIndex);
        const after = query.slice(cursorIndex);
        const trimmed = before.trimEnd();
        const lastSpace = trimmed.lastIndexOf(" ");
        const newBefore = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : "";
        cursorIndex = newBefore.length;
        query = newBefore + after;
        selectedIndex = 0;
        updateFiltered();
        render();
      }
      return;
    }

    // Ignore unrecognized escape sequences
    if (chunk.startsWith("\u001b")) {
      return;
    }

    // Printable characters: insert at current cursor position
    if (chunk.charCodeAt(0) >= 32 && chunk.charCodeAt(0) !== 127) {
      query = query.slice(0, cursorIndex) + chunk + query.slice(cursorIndex);
      cursorIndex += chunk.length;
      selectedIndex = 0;
      updateFiltered();
      render();
    }
  });
}

// Top level execution with try-catch
try {
  await main();
} catch (err) {
  process.stderr.write(`fuzzy.ts error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}

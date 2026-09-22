/**
 * NES Tetris - Web Version
 *
 * Board size: 10 columns x 20 rows (identical to NES Tetris).
 * Controls:
 * - Z: Rotate left (counter-clockwise)
 * - X / W / ArrowUp: Rotate right (clockwise)
 * - A / ArrowLeft: Move left
 * - D / ArrowRight: Move right
 * - S / ArrowDown: Soft drop
 * - Space: Hard drop
 * - P: Pause
 * - R: Restart after game over
 */

// 10x20 playfield
const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20;

/*
 * Tetromino shapes in 4 rotations (4x4 matrix).
 * 0: I piece
 * 1: J piece
 * 2: L piece
 * 3: O piece
 * 4: S piece
 * 5: T piece
 * 6: Z piece
 */
const TETROMINOES: number[][][][] = [
  // 0: I
  [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  // 1: J
  [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  // 2: L
  [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  // 3: O
  [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  // 4: S
  [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  // 5: T
  [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  // 6: Z
  [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
];

/*
 * Authentic color palette and textures for each tetromino.
 */
interface PieceStyle {
  color: string;
  light: string;
  dark: string;
  pattern: string; // 'solid' | 'shade-dark' | 'shade-med' | 'shade-light'
}

const PIECE_STYLES: PieceStyle[] = [
  { color: "#00e5ff", light: "#80f2ff", dark: "#008ba3", pattern: "solid" }, // 0: I (Cyan)
  { color: "#2979ff", light: "#75a7ff", dark: "#1c54b2", pattern: "shade-dark" }, // 1: J (Blue)
  { color: "#ff9100", light: "#ffb74d", dark: "#b26500", pattern: "shade-med" }, // 2: L (Orange)
  { color: "#ffd600", light: "#ffea00", dark: "#b29500", pattern: "solid" }, // 3: O (Yellow)
  { color: "#00e676", light: "#69f0ae", dark: "#00a152", pattern: "shade-light" }, // 4: S (Green)
  { color: "#d500f9", light: "#e040fb", dark: "#9500ae", pattern: "shade-dark" }, // 5: T (Purple)
  { color: "#ff1744", light: "#ff5252", dark: "#b2102f", pattern: "shade-med" }, // 6: Z (Red)
];

/*
 * Complete game state interface.
 */
interface GameState {
  board: number[][];
  currentType: number;
  currentRotation: number;
  currentX: number;
  currentY: number;
  nextType: number;
  score: number;
  lines: number;
  level: number;
  stats: number[];
  gameOver: boolean;
  paused: boolean;
  bag: number[];
  bagIndex: number;
  lastDropTime: number;
}

const game: GameState = {
  board: Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)),
  currentType: 0,
  currentRotation: 0,
  currentX: 3,
  currentY: 0,
  nextType: 0,
  score: 0,
  lines: 0,
  level: 0,
  stats: [0, 0, 0, 0, 0, 0, 0],
  gameOver: false,
  paused: false,
  bag: [],
  bagIndex: 0,
  lastDropTime: 0,
};

// Canvas elements and contexts
const boardCanvas = document.getElementById("board-canvas") as HTMLCanvasElement;
const boardCtx = boardCanvas.getContext("2d")!;
const nextCanvas = document.getElementById("next-canvas") as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext("2d")!;

// UI labels
const scoreEl = document.getElementById("score-val") as HTMLElement;
const linesEl = document.getElementById("lines-val") as HTMLElement;
const levelEl = document.getElementById("level-val") as HTMLElement;
const overlayEl = document.getElementById("game-overlay") as HTMLElement;
const overlayTitle = document.getElementById("overlay-title") as HTMLElement;
const overlaySub = document.getElementById("overlay-sub") as HTMLElement;

/*
 * Refill 7-bag randomizer to guarantee fair piece distribution.
 */
function refillBag(): void {
  game.bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = game.bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = game.bag[i];
    game.bag[i] = game.bag[j];
    game.bag[j] = temp;
  }
  game.bagIndex = 0;
}

/*
 * Fetch next piece type from 7-bag.
 */
function getNextPiece(): number {
  if (game.bagIndex >= game.bag.length) {
    refillBag();
  }
  return game.bag[game.bagIndex++];
}

/*
 * Check if given piece fits without collision.
 */
function pieceFits(type: number, rotation: number, px: number, py: number): boolean {
  const shape = TETROMINOES[type][rotation];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (shape[r][c]) {
        const bx = px + c;
        const by = py + r;

        if (bx < 0 || bx >= BOARD_WIDTH) return false;
        if (by >= BOARD_HEIGHT) return false;
        if (by >= 0 && game.board[by][bx] !== 0) return false;
      }
    }
  }
  return true;
}

/*
 * Spawn new active piece from preview queue.
 */
function spawnPiece(): void {
  game.currentType = game.nextType;
  game.nextType = getNextPiece();
  game.currentRotation = 0;
  game.currentX = 3;
  game.currentY = 0;
  game.stats[game.currentType]++;

  updateStatsDisplay();

  if (!pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY)) {
    game.gameOver = true;
    showOverlay("GAME OVER", "Press R to Play Again");
  }
}

/*
 * Lock active piece into board and check for completed lines.
 */
function lockAndClear(): void {
  const shape = TETROMINOES[game.currentType][game.currentRotation];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (shape[r][c]) {
        const bx = game.currentX + c;
        const by = game.currentY + r;
        if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
          game.board[by][bx] = game.currentType + 1;
        }
      }
    }
  }

  let cleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (game.board[y][x] === 0) {
        full = false;
        break;
      }
    }

    if (full) {
      cleared++;
      for (let k = y; k > 0; k--) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          game.board[k][x] = game.board[k - 1][x];
        }
      }
      for (let x = 0; x < BOARD_WIDTH; x++) {
        game.board[0][x] = 0;
      }
      y++;
    }
  }

  if (cleared > 0) {
    const basePoints = [0, 40, 100, 300, 1200];
    game.score += basePoints[cleared] * (game.level + 1);
    game.lines += cleared;
    game.level = Math.floor(game.lines / 10);
    updateScoreDisplay();
  }

  spawnPiece();
}

/*
 * Calculate ghost drop destination.
 */
function calculateGhostY(): number {
  let gy = game.currentY;
  while (pieceFits(game.currentType, game.currentRotation, game.currentX, gy + 1)) {
    gy++;
  }
  return gy;
}

/*
 * Calculate drop speed interval based on level.
 */
function getDropInterval(level: number): number {
  if (level <= 0) return 800;
  if (level === 1) return 716;
  if (level === 2) return 633;
  if (level === 3) return 550;
  if (level === 4) return 466;
  if (level === 5) return 383;
  if (level === 6) return 300;
  if (level === 7) return 216;
  if (level === 8) return 133;
  if (level === 9) return 100;
  if (level >= 10 && level <= 12) return 80;
  if (level >= 13 && level <= 15) return 60;
  if (level >= 16 && level <= 18) return 50;
  return 30;
}

/*
 * Draw a single styled block on canvas.
 */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  typeIndex: number,
  isGhost: boolean = false
): void {
  const style = PIECE_STYLES[typeIndex];

  if (isGhost) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    return;
  }

  // Block base
  ctx.fillStyle = style.color;
  ctx.fillRect(x, y, size, size);

  // NES style beveled 3D borders
  const bevel = Math.max(2, Math.floor(size / 6));

  // Top & Left highlight
  ctx.fillStyle = style.light;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size - bevel, y + bevel);
  ctx.lineTo(x + bevel, y + bevel);
  ctx.lineTo(x + bevel, y + size - bevel);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();

  // Bottom & Right shadow
  ctx.fillStyle = style.dark;
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x + bevel, y + size - bevel);
  ctx.lineTo(x + size - bevel, y + size - bevel);
  ctx.lineTo(x + size - bevel, y + bevel);
  ctx.closePath();
  ctx.fill();

  // Inner pattern/shade accent
  if (style.pattern === "shade-dark" || style.pattern === "shade-med") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x + bevel, y + bevel, size - bevel * 2, size - bevel * 2);
  } else if (style.pattern === "shade-light") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(x + bevel, y + bevel, size - bevel * 2, size - bevel * 2);
  }
}

/*
 * Render playfield board and preview canvas.
 */
function render(): void {
  const cellSize = boardCanvas.width / BOARD_WIDTH;

  // Clear board with retro background
  boardCtx.fillStyle = "#0a0a12";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  // Subtle background grid
  boardCtx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  boardCtx.lineWidth = 1;
  for (let c = 0; c <= BOARD_WIDTH; c++) {
    boardCtx.beginPath();
    boardCtx.moveTo(c * cellSize, 0);
    boardCtx.lineTo(c * cellSize, boardCanvas.height);
    boardCtx.stroke();
  }
  for (let r = 0; r <= BOARD_HEIGHT; r++) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, r * cellSize);
    boardCtx.lineTo(boardCanvas.width, r * cellSize);
    boardCtx.stroke();
  }

  // Render locked blocks on board
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (game.board[y][x] > 0) {
        drawBlock(boardCtx, x * cellSize, y * cellSize, cellSize, game.board[y][x] - 1);
      }
    }
  }

  // Render ghost piece & active piece
  if (!game.gameOver) {
    const shape = TETROMINOES[game.currentType][game.currentRotation];
    const ghostY = calculateGhostY();

    // Ghost piece
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (shape[r][c]) {
          const bx = game.currentX + c;
          const by = ghostY + r;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            drawBlock(boardCtx, bx * cellSize, by * cellSize, cellSize, game.currentType, true);
          }
        }
      }
    }

    // Active piece
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (shape[r][c]) {
          const bx = game.currentX + c;
          const by = game.currentY + r;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            drawBlock(boardCtx, bx * cellSize, by * cellSize, cellSize, game.currentType, false);
          }
        }
      }
    }
  }

  // Render Next Piece preview canvas
  nextCtx.fillStyle = "#0a0a12";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  const nextShape = TETROMINOES[game.nextType][0];
  const previewCellSize = nextCanvas.width / 4;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (nextShape[r][c]) {
        drawBlock(nextCtx, c * previewCellSize, r * previewCellSize, previewCellSize, game.nextType, false);
      }
    }
  }
}

/*
 * Update text counters on the screen.
 */
function updateScoreDisplay(): void {
  scoreEl.textContent = game.score.toString().padStart(6, "0");
  linesEl.textContent = game.lines.toString().padStart(3, "0");
  levelEl.textContent = game.level.toString().padStart(2, "0");
}

/*
 * Update statistics column numbers.
 */
function updateStatsDisplay(): void {
  const pieceIds = ["stat-t", "stat-j", "stat-z", "stat-o", "stat-s", "stat-l", "stat-i"];
  const mapIndices = [5, 1, 6, 3, 4, 2, 0];
  mapIndices.forEach((typeIdx, i) => {
    const el = document.getElementById(pieceIds[i]);
    if (el) {
      el.textContent = game.stats[typeIdx].toString().padStart(3, "0");
    }
  });
}

/*
 * Show pause or game over modal overlay.
 */
function showOverlay(title: string, subtitle: string): void {
  overlayTitle.textContent = title;
  overlaySub.textContent = subtitle;
  overlayEl.classList.remove("hidden");
}

/*
 * Hide modal overlay.
 */
function hideOverlay(): void {
  overlayEl.classList.add("hidden");
}

/*
 * Reset game to start a new match.
 */
function resetGame(): void {
  game.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  game.score = 0;
  game.lines = 0;
  game.level = 0;
  game.gameOver = false;
  game.paused = false;
  game.stats = [0, 0, 0, 0, 0, 0, 0];

  refillBag();
  game.nextType = getNextPiece();
  spawnPiece();
  updateScoreDisplay();
  hideOverlay();
  game.lastDropTime = performance.now();
}

/*
 * Keyboard controls:
 * - Z: Rotate left (counter-clockwise)
 * - X: Rotate right (clockwise)
 */
window.addEventListener("keydown", (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();

  if (key === "q") return;

  if (game.gameOver) {
    if (key === "r") {
      resetGame();
    }
    return;
  }

  if (key === "p") {
    game.paused = !game.paused;
    if (game.paused) {
      showOverlay("PAUSED", "Press P to Resume");
    } else {
      hideOverlay();
      game.lastDropTime = performance.now();
    }
    return;
  }

  if (game.paused) return;

  if (key === "a" || e.key === "ArrowLeft") {
    // Move Left
    if (pieceFits(game.currentType, game.currentRotation, game.currentX - 1, game.currentY)) {
      game.currentX--;
      render();
    }
  } else if (key === "d" || e.key === "ArrowRight") {
    // Move Right
    if (pieceFits(game.currentType, game.currentRotation, game.currentX + 1, game.currentY)) {
      game.currentX++;
      render();
    }
  } else if (key === "z") {
    // Z: Rotate left (counter-clockwise)
    const nextRot = (game.currentRotation + 3) % 4;
    if (pieceFits(game.currentType, nextRot, game.currentX, game.currentY)) {
      game.currentRotation = nextRot;
      render();
    } else if (pieceFits(game.currentType, nextRot, game.currentX - 1, game.currentY)) {
      game.currentX--;
      game.currentRotation = nextRot;
      render();
    } else if (pieceFits(game.currentType, nextRot, game.currentX + 1, game.currentY)) {
      game.currentX++;
      game.currentRotation = nextRot;
      render();
    }
  } else if (key === "x" || key === "w" || e.key === "ArrowUp") {
    // X: Rotate right (clockwise)
    const nextRot = (game.currentRotation + 1) % 4;
    if (pieceFits(game.currentType, nextRot, game.currentX, game.currentY)) {
      game.currentRotation = nextRot;
      render();
    } else if (pieceFits(game.currentType, nextRot, game.currentX - 1, game.currentY)) {
      game.currentX--;
      game.currentRotation = nextRot;
      render();
    } else if (pieceFits(game.currentType, nextRot, game.currentX + 1, game.currentY)) {
      game.currentX++;
      game.currentRotation = nextRot;
      render();
    }
  } else if (key === "s" || e.key === "ArrowDown") {
    // Soft drop
    if (pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY + 1)) {
      game.currentY++;
      game.score += 1;
      game.lastDropTime = performance.now();
      updateScoreDisplay();
      render();
    } else {
      lockAndClear();
      game.lastDropTime = performance.now();
      render();
    }
  } else if (e.key === " ") {
    // Hard drop
    e.preventDefault();
    let dropped = 0;
    while (pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY + 1)) {
      game.currentY++;
      dropped++;
    }
    game.score += dropped * 2;
    updateScoreDisplay();
    lockAndClear();
    game.lastDropTime = performance.now();
    render();
  }
});

/*
 * Main game animation loop with gravity drop timer.
 */
function gameLoop(time: number): void {
  if (!game.gameOver && !game.paused) {
    const interval = getDropInterval(game.level);
    if (time - game.lastDropTime >= interval) {
      if (pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY + 1)) {
        game.currentY++;
      } else {
        lockAndClear();
      }
      game.lastDropTime = time;
      render();
    }
  }
  requestAnimationFrame(gameLoop);
}

// Mobile on-screen button bindings
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    if (!action) return;

    if (action === "left") {
      if (pieceFits(game.currentType, game.currentRotation, game.currentX - 1, game.currentY)) {
        game.currentX--;
        render();
      }
    } else if (action === "right") {
      if (pieceFits(game.currentType, game.currentRotation, game.currentX + 1, game.currentY)) {
        game.currentX++;
        render();
      }
    } else if (action === "rot-l") {
      const nextRot = (game.currentRotation + 3) % 4;
      if (pieceFits(game.currentType, nextRot, game.currentX, game.currentY)) {
        game.currentRotation = nextRot;
        render();
      }
    } else if (action === "rot-r") {
      const nextRot = (game.currentRotation + 1) % 4;
      if (pieceFits(game.currentType, nextRot, game.currentX, game.currentY)) {
        game.currentRotation = nextRot;
        render();
      }
    } else if (action === "down") {
      if (pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY + 1)) {
        game.currentY++;
        game.score += 1;
        updateScoreDisplay();
        render();
      } else {
        lockAndClear();
        render();
      }
    } else if (action === "drop") {
      while (pieceFits(game.currentType, game.currentRotation, game.currentX, game.currentY + 1)) {
        game.currentY++;
        game.score += 2;
      }
      updateScoreDisplay();
      lockAndClear();
      render();
    } else if (action === "pause") {
      game.paused = !game.paused;
      if (game.paused) showOverlay("PAUSED", "Press P to Resume");
      else hideOverlay();
    } else if (action === "restart") {
      resetGame();
    }
  });
});

// Initialize game
resetGame();
requestAnimationFrame(gameLoop);

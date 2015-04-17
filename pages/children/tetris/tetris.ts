/**
 * NES Tetris - Web Version with Native Web Audio Chiptune Synthesizer
 *
 * Board size: 10 columns x 20 rows (identical to NES Tetris).
 * Audio:
 * - Native Web Audio API (Square-wave chiptune synthesizer matching NES 2A03 APU)
 * - Authentic Korobeiniki (Theme A) transcription: Complete Section A & B with exact note durations & 90% gate separation
 * - Sound is ON by default (auto-starts on first user interaction per browser policy)
 * - Sound toggle keyboard binding: 'M' (Mute / Unmute)
 *
 * Controls:
 * - Z: Rotate left (counter-clockwise)
 * - X / W: Rotate right (clockwise)
 * - A / ArrowLeft: Move left
 * - D / ArrowRight: Move right
 * - S / ArrowDown: Soft drop
 * - ArrowUp / Space: Hard drop (+2 pts per cell)
 * - M: Toggle music / sound
 * - P: Pause
 * - R: Restart after game over
 */

// 10x20 playfield
const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20;

/*
 * Tetromino shapes in 4 rotations (4x4 matrix).
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
  pattern: string;
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
  soundEnabled: boolean;
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
  soundEnabled: true,
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
const soundStatusEl = document.getElementById("sound-status") as HTMLElement;
const overlayEl = document.getElementById("game-overlay") as HTMLElement;
const overlayTitle = document.getElementById("overlay-title") as HTMLElement;
const overlaySub = document.getElementById("overlay-sub") as HTMLElement;

/*
 * ============================================================================
 * Native Web Audio Chiptune Synthesizer (NES 2A03 APU)
 * Complete Authentic Korobeiniki (Theme A) score with Section A and Section B.
 * ============================================================================
 */
class ChiptuneSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = true;
  private schedulerTimer: number | null = null;
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;

  // Standard A4=440Hz tempered tuning
  private static readonly NOTE_FREQS: { [key: string]: number } = {
    REST: 0,
    E3: 164.81,
    GS3: 207.65,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    GS4: 415.3,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    GS5: 830.61,
    A5: 880.0,
  };

  // Authentic Tetris Theme A melody: [Note, duration divider (negative = dotted note)]
  private static readonly MELODY_SCORE: [string, number][] = [
    // Section A - First Part
    ["E5", 4],
    ["B4", 8],
    ["C5", 8],
    ["D5", 4],
    ["C5", 8],
    ["B4", 8],
    ["A4", 4],
    ["A4", 8],
    ["C5", 8],
    ["E5", 4],
    ["D5", 8],
    ["C5", 8],
    ["B4", -4],
    ["C5", 8],
    ["D5", 4],
    ["E5", 4],
    ["C5", 4],
    ["A4", 4],
    ["A4", 4],
    ["REST", 4],

    ["REST", 8],
    ["D5", 4],
    ["F5", 8],
    ["A5", 4],
    ["G5", 8],
    ["F5", 8],
    ["E5", -4],
    ["C5", 8],
    ["E5", 4],
    ["D5", 8],
    ["C5", 8],
    ["B4", 4],
    ["B4", 8],
    ["C5", 8],
    ["D5", 4],
    ["E5", 4],
    ["C5", 4],
    ["A4", 4],
    ["A4", 4],
    ["REST", 4],

    // Section B (Lyrical variation)
    ["E5", 2],
    ["C5", 2],
    ["D5", 2],
    ["B4", 2],
    ["C5", 2],
    ["A4", 2],
    ["GS4", 1],

    ["E5", 2],
    ["C5", 2],
    ["D5", 2],
    ["B4", 2],
    ["C5", 4],
    ["E5", 4],
    ["A5", 2],
    ["GS5", 1],

    // Section A - Repeat
    ["E5", 4],
    ["B4", 8],
    ["C5", 8],
    ["D5", 4],
    ["C5", 8],
    ["B4", 8],
    ["A4", 4],
    ["A4", 8],
    ["C5", 8],
    ["E5", 4],
    ["D5", 8],
    ["C5", 8],
    ["B4", -4],
    ["C5", 8],
    ["D5", 4],
    ["E5", 4],
    ["C5", 4],
    ["A4", 4],
    ["A4", 4],
    ["REST", 4],

    ["REST", 8],
    ["D5", 4],
    ["F5", 8],
    ["A5", 4],
    ["G5", 8],
    ["F5", 8],
    ["REST", 8],
    ["E5", 4],
    ["C5", 8],
    ["E5", 4],
    ["D5", 8],
    ["C5", 8],
    ["REST", 8],
    ["B4", 4],
    ["C5", 8],
    ["D5", 4],
    ["E5", 4],
    ["REST", 8],
    ["C5", 4],
    ["A4", 8],
    ["A4", 4],
    ["REST", 4],
  ];

  private init(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public ensureStarted(): void {
    this.init();
    if (this.isPlaying && this.schedulerTimer === null) {
      this.startMusic();
    }
  }

  public toggle(enable?: boolean): boolean {
    this.init();
    if (enable === undefined) {
      this.isPlaying = !this.isPlaying;
    } else {
      this.isPlaying = enable;
    }

    if (this.isPlaying) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.isPlaying;
  }

  private startMusic(): void {
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.noteIndex = 0;
    this.scheduleNotes();
  }

  private stopMusic(): void {
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /*
   * Look-ahead scheduler for authentic 144 BPM NES rhythm.
   */
  private scheduleNotes = (): void => {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const tempo = 144;
    const wholeNoteSec = (60.0 / tempo) * 4.0;

    while (this.nextNoteTime < this.ctx.currentTime + 0.3) {
      const [noteName, divider] = ChiptuneSynth.MELODY_SCORE[this.noteIndex];

      // Calculate note duration: negative numbers represent dotted notes
      let noteDurationSec = 0;
      if (divider > 0) {
        noteDurationSec = wholeNoteSec / divider;
      } else {
        noteDurationSec = (wholeNoteSec / Math.abs(divider)) * 1.5;
      }

      const freq = ChiptuneSynth.NOTE_FREQS[noteName];
      if (freq > 0) {
        // 90% note duration gate for crisp NES 8-bit staccato articulation
        this.playTone(freq, this.nextNoteTime, noteDurationSec * 0.9, "square", 0.16);

        // Add subtle bass counter-octave for richer sound
        this.playTone(freq / 2, this.nextNoteTime, noteDurationSec * 0.85, "triangle", 0.12);
      }

      this.nextNoteTime += noteDurationSec;
      this.noteIndex = (this.noteIndex + 1) % ChiptuneSynth.MELODY_SCORE.length;
    }

    this.schedulerTimer = window.setTimeout(this.scheduleNotes, 40);
  };

  /*
   * Generate raw hardware-like wave tone with quick attack and decay envelope.
   */
  private playTone(freq: number, startTime: number, duration: number, type: OscillatorType, gainLevel: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Retro envelope (instant attack, subtle decay)
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public playLineClear(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      this.playTone(f, now + idx * 0.05, 0.08, "square", 0.2);
    });
  }

  public playDrop(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.playTone(180, now, 0.05, "triangle", 0.22);
  }
}

const synth = new ChiptuneSynth();

// Start sound on first user gesture to satisfy browser autoplay policy
const unlockAudio = (): void => {
  if (game.soundEnabled) {
    synth.ensureStarted();
  }
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("click", unlockAudio);
  window.removeEventListener("touchstart", unlockAudio);
};
window.addEventListener("keydown", unlockAudio);
window.addEventListener("click", unlockAudio);
window.addEventListener("touchstart", unlockAudio);

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
    synth.playLineClear();
  } else {
    synth.playDrop();
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

  ctx.fillStyle = style.color;
  ctx.fillRect(x, y, size, size);

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

  boardCtx.fillStyle = "#0a0a12";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

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

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (game.board[y][x] > 0) {
        drawBlock(boardCtx, x * cellSize, y * cellSize, cellSize, game.board[y][x] - 1);
      }
    }
  }

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

  // Render Next Piece preview
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
 * Toggle music playback on/off.
 */
function toggleSound(enable?: boolean): void {
  game.soundEnabled = synth.toggle(enable);
  if (soundStatusEl) {
    soundStatusEl.textContent = game.soundEnabled ? "ON" : "OFF";
    soundStatusEl.style.color = game.soundEnabled ? "#4ade80" : "#f87171";
  }
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
 * - U: Toggle sound
 * - Z / N: Rotate left (counter-clockwise)
 * - X / M: Rotate right (clockwise)
 */
window.addEventListener("keydown", (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();

  if (key === "u") {
    toggleSound();
    return;
  }

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
    if (pieceFits(game.currentType, game.currentRotation, game.currentX - 1, game.currentY)) {
      game.currentX--;
      render();
    }
  } else if (key === "d" || e.key === "ArrowRight") {
    if (pieceFits(game.currentType, game.currentRotation, game.currentX + 1, game.currentY)) {
      game.currentX++;
      render();
    }
  } else if (key === "z" || key === "n") {
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
  } else if (key === "x" || key === "m") {
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
  } else if (e.key === " " || e.key === "ArrowUp" || key === "w") {
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

// On-screen buttons
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    if (!action) return;

    if (action === "sound") {
      toggleSound();
    } else if (action === "left") {
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

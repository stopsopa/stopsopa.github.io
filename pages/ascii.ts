/**
 * ASCII Art & Diagram Editor - Stage 1
 *
 * Core engine for infinite canvas ASCII editing with text typing,
 * box-drawing line tools (point-to-point, zigzag with bend compensation),
 * selection & clipboard operations, and smart line dragging with perpendicular junction stretching.
 * Full support for all Unicode Box Drawing frames (Single, Heavy, Double, Rounded, Mixed, Dashed) and Classic ASCII tables (+, -, |).
 */

// Tool enumeration
export type ToolType = "select" | "text" | "zigzag" | "line" | "rect" | "eraser";

export const TOOLS: Record<string, ToolType> = {
  SELECT: "select",
  TEXT: "text",
  ZIGZAG: "zigzag",
  LINE: "line",
  RECT: "rect",
  ERASER: "eraser",
};

// Line style variants matching frames.txt
export type LineStyle =
  | "box-single"
  | "box-heavy"
  | "box-double"
  | "box-rounded"
  | "box-double-h-single-v"
  | "box-single-h-double-v"
  | "box-heavy-h-light-v"
  | "box-light-h-heavy-v"
  | "box-dashed-light"
  | "box-dashed-heavy"
  | "ascii";

// Direction bitmask flags for junction calculations
export const DIR_UP = 1;
export const DIR_RIGHT = 2;
export const DIR_DOWN = 4;
export const DIR_LEFT = 8;

export interface Point {
  x: number;
  y: number;
}

export interface CharPoint extends Point {
  char?: string;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface HorizontalSegment {
  type: "horizontal";
  y: number;
  startX: number;
  endX: number;
}

export interface VerticalSegment {
  type: "vertical";
  x: number;
  startY: number;
  endY: number;
}

export type LineSegment = HorizontalSegment | VerticalSegment;

export interface BoxSet {
  name: string;
  h: string;
  v: string;
  junctions: Record<number, string>;
  allChars: Set<string>;
  sampleGrid: string;
  miniPreview: string;
}

/**
 * Box-drawing Character Sets and Junction Lookup Maps
 * Bitmask index: [UP(1) | RIGHT(2) | DOWN(4) | LEFT(8)]
 */
export const BOX_SETS: Record<LineStyle, BoxSet> = {
  "box-single": {
    name: "Single",
    h: "─",
    v: "│",
    junctions: {
      0: " ",
      1: "│",
      2: "─",
      3: "└",
      4: "│",
      5: "│",
      6: "┌",
      7: "├",
      8: "─",
      9: "┘",
      10: "─",
      11: "┴",
      12: "┐",
      13: "┤",
      14: "┬",
      15: "┼",
    },
    allChars: new Set(["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼"]),
    sampleGrid: "┌─┬─┐\n│ │ │\n├─┼─┤\n│ │ │\n└─┴─┘",
    miniPreview: "┌─┬─┐\n│ │ │\n└─┴─┘",
  },
  "box-heavy": {
    name: "Heavy",
    h: "━",
    v: "┃",
    junctions: {
      0: " ",
      1: "┃",
      2: "━",
      3: "┗",
      4: "┃",
      5: "┃",
      6: "┏",
      7: "┣",
      8: "━",
      9: "┛",
      10: "━",
      11: "┻",
      12: "┓",
      13: "┫",
      14: "┳",
      15: "╋",
    },
    allChars: new Set(["━", "┃", "┏", "┓", "┗", "┛", "┣", "┫", "┳", "┻", "╋"]),
    sampleGrid: "┏━┳━┓\n┃ ┃ ┃\n┣━╋━┫\n┃ ┃ ┃\n┗━┻━┛",
    miniPreview: "┏━┳━┓\n┃ ┃ ┃\n┗━┻━┛",
  },
  "box-double": {
    name: "Double",
    h: "═",
    v: "║",
    junctions: {
      0: " ",
      1: "║",
      2: "═",
      3: "╚",
      4: "║",
      5: "║",
      6: "╔",
      7: "╠",
      8: "═",
      9: "╝",
      10: "═",
      11: "╩",
      12: "╗",
      13: "╣",
      14: "╦",
      15: "╬",
    },
    allChars: new Set(["═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬"]),
    sampleGrid: "╔═╦═╗\n║ ║ ║\n╠═╬═╣\n║ ║ ║\n╚═╩═╝",
    miniPreview: "╔═╦═╗\n║ ║ ║\n╚═╩═╝",
  },
  "box-rounded": {
    name: "Rounded",
    h: "─",
    v: "│",
    junctions: {
      0: " ",
      1: "│",
      2: "─",
      3: "╰",
      4: "│",
      5: "│",
      6: "╭",
      7: "├",
      8: "─",
      9: "╯",
      10: "─",
      11: "┴",
      12: "╮",
      13: "┤",
      14: "┬",
      15: "┼",
    },
    allChars: new Set(["─", "│", "╭", "╮", "╰", "╯", "├", "┤", "┬", "┴", "┼"]),
    sampleGrid: "╭─┬─╮\n│ │ │\n├─┼─┤\n│ │ │\n╰─┴─╯",
    miniPreview: "╭─┬─╮\n│ │ │\n╰─┴─╯",
  },
  "box-double-h-single-v": {
    name: "Double-H / Single-V",
    h: "═",
    v: "│",
    junctions: {
      0: " ",
      1: "│",
      2: "═",
      3: "╘",
      4: "│",
      5: "│",
      6: "╒",
      7: "╞",
      8: "═",
      9: "╛",
      10: "═",
      11: "╧",
      12: "╕",
      13: "╡",
      14: "╤",
      15: "╪",
    },
    allChars: new Set(["═", "│", "╒", "╕", "╘", "╛", "╞", "╡", "╤", "╧", "╪"]),
    sampleGrid: "╒═╤═╕\n│ │ │\n╞═╪═╡\n│ │ │\n╘═╧═╛",
    miniPreview: "╒═╤═╕\n│ │ │\n╘═╧═╛",
  },
  "box-single-h-double-v": {
    name: "Single-H / Double-V",
    h: "─",
    v: "║",
    junctions: {
      0: " ",
      1: "║",
      2: "─",
      3: "╙",
      4: "║",
      5: "║",
      6: "╓",
      7: "╟",
      8: "─",
      9: "╜",
      10: "─",
      11: "╨",
      12: "╖",
      13: "╢",
      14: "╥",
      15: "╫",
    },
    allChars: new Set(["─", "║", "╓", "╖", "╙", "╜", "╟", "╢", "╥", "╨", "╫"]),
    sampleGrid: "╓─╥─╖\n║ ║ ║\n╟─╫─╢\n║ ║ ║\n╙─╨─╜",
    miniPreview: "╓─╥─╖\n║ ║ ║\n╙─╨─╜",
  },
  "box-heavy-h-light-v": {
    name: "Heavy-H / Light-V",
    h: "━",
    v: "│",
    junctions: {
      0: " ",
      1: "│",
      2: "━",
      3: "┕",
      4: "│",
      5: "│",
      6: "┍",
      7: "┝",
      8: "━",
      9: "┙",
      10: "━",
      11: "┷",
      12: "┑",
      13: "┥",
      14: "┯",
      15: "┿",
    },
    allChars: new Set(["━", "│", "┍", "┑", "┕", "┙", "┝", "┥", "┯", "┷", "┿"]),
    sampleGrid: "┍━┯━┑\n│ │ │\n┝━┿━┥\n│ │ │\n┕━┷━┙",
    miniPreview: "┍━┯━┑\n│ │ │\n┕━┷━┙",
  },
  "box-light-h-heavy-v": {
    name: "Light-H / Heavy-V",
    h: "─",
    v: "┃",
    junctions: {
      0: " ",
      1: "┃",
      2: "─",
      3: "┖",
      4: "┃",
      5: "┃",
      6: "┎",
      7: "┠",
      8: "─",
      9: "┚",
      10: "─",
      11: "┸",
      12: "┒",
      13: "┨",
      14: "┰",
      15: "╂",
    },
    allChars: new Set(["─", "┃", "┎", "┒", "┖", "┚", "┠", "┨", "┰", "┸", "╂"]),
    sampleGrid: "┎─┰─┒\n┃ ┃ ┃\n┠─╂─┨\n┃ ┃ ┃\n┖─┸─┚",
    miniPreview: "┎─┰─┒\n┃ ┃ ┃\n┖─┸─┚",
  },
  "box-dashed-light": {
    name: "Dashed Light",
    h: "┄",
    v: "┆",
    junctions: {
      0: " ",
      1: "┆",
      2: "┄",
      3: "└",
      4: "┆",
      5: "┆",
      6: "┌",
      7: "├",
      8: "┄",
      9: "┘",
      10: "┄",
      11: "┴",
      12: "┐",
      13: "┤",
      14: "┬",
      15: "┼",
    },
    allChars: new Set(["┄", "┆", "┈", "┊", "─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼"]),
    sampleGrid: "┌┄┬┄┐\n┆ ┆ ┆\n├┄┼┄┤\n┆ ┆ ┆\n└┄┴┄┘",
    miniPreview: "┌┄┬┄┐\n┆ ┆ ┆\n└┄┴┄┘",
  },
  "box-dashed-heavy": {
    name: "Dashed Heavy",
    h: "┅",
    v: "┇",
    junctions: {
      0: " ",
      1: "┇",
      2: "┅",
      3: "┗",
      4: "┇",
      5: "┇",
      6: "┏",
      7: "┣",
      8: "┅",
      9: "┛",
      10: "┅",
      11: "┻",
      12: "┓",
      13: "┫",
      14: "┳",
      15: "╋",
    },
    allChars: new Set(["┅", "┇", "┉", "┋", "━", "┃", "┏", "┓", "┗", "┛", "┣", "┫", "┳", "┻", "╋"]),
    sampleGrid: "┏┅┳┅┓\n┇ ┇ ┇\n┣┅╋┅┫\n┇ ┇ ┇\n┗┅┻┅┛",
    miniPreview: "┏┅┳┅┓\n┇ ┇ ┇\n┗┅┻┅┛",
  },
  ascii: {
    name: "Classic ASCII",
    h: "-",
    v: "|",
    junctions: {
      0: " ",
      1: "|",
      2: "-",
      3: "+",
      4: "|",
      5: "|",
      6: "+",
      7: "+",
      8: "-",
      9: "+",
      10: "-",
      11: "+",
      12: "+",
      13: "+",
      14: "+",
      15: "+",
    },
    allChars: new Set(["-", "|", "+"]),
    sampleGrid: "+-+-+\n| | |\n+-+-+\n| | |\n+-+-+",
    miniPreview: "+-+-+\n| | |\n+-+-+",
  },
};

/**
 * Global Port Map constructed across all box styles
 */
export const GLOBAL_CHAR_PORTS: Record<string, number> = {
  // Single & Rounded
  "─": DIR_LEFT | DIR_RIGHT,
  "│": DIR_UP | DIR_DOWN,
  "┌": DIR_RIGHT | DIR_DOWN,
  "┐": DIR_LEFT | DIR_DOWN,
  "└": DIR_UP | DIR_RIGHT,
  "┘": DIR_UP | DIR_LEFT,
  "├": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "┤": DIR_UP | DIR_LEFT | DIR_DOWN,
  "┬": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "┴": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "┼": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,
  "╭": DIR_RIGHT | DIR_DOWN,
  "╮": DIR_LEFT | DIR_DOWN,
  "╯": DIR_UP | DIR_LEFT,
  "╰": DIR_UP | DIR_RIGHT,

  // Heavy / Bold
  "━": DIR_LEFT | DIR_RIGHT,
  "┃": DIR_UP | DIR_DOWN,
  "┏": DIR_RIGHT | DIR_DOWN,
  "┓": DIR_LEFT | DIR_DOWN,
  "┗": DIR_UP | DIR_RIGHT,
  "┛": DIR_UP | DIR_LEFT,
  "┣": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "┫": DIR_UP | DIR_LEFT | DIR_DOWN,
  "┳": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "┻": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "╋": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  // Double
  "═": DIR_LEFT | DIR_RIGHT,
  "║": DIR_UP | DIR_DOWN,
  "╔": DIR_RIGHT | DIR_DOWN,
  "╗": DIR_LEFT | DIR_DOWN,
  "╚": DIR_UP | DIR_RIGHT,
  "╝": DIR_UP | DIR_LEFT,
  "╠": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "╣": DIR_UP | DIR_LEFT | DIR_DOWN,
  "╦": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "╩": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "╬": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  // Mixed Single / Double
  "╒": DIR_RIGHT | DIR_DOWN,
  "╕": DIR_LEFT | DIR_DOWN,
  "╘": DIR_UP | DIR_RIGHT,
  "╛": DIR_UP | DIR_LEFT,
  "╞": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "╡": DIR_UP | DIR_LEFT | DIR_DOWN,
  "╤": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "╧": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "╪": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  "╓": DIR_RIGHT | DIR_DOWN,
  "╖": DIR_LEFT | DIR_DOWN,
  "╙": DIR_UP | DIR_RIGHT,
  "╜": DIR_UP | DIR_LEFT,
  "╟": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "╢": DIR_UP | DIR_LEFT | DIR_DOWN,
  "╥": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "╨": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "╫": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  // Mixed Heavy / Light
  "┍": DIR_RIGHT | DIR_DOWN,
  "┑": DIR_LEFT | DIR_DOWN,
  "┕": DIR_UP | DIR_RIGHT,
  "┙": DIR_UP | DIR_LEFT,
  "┝": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "┥": DIR_UP | DIR_LEFT | DIR_DOWN,
  "┯": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "┷": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "┿": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  "┎": DIR_RIGHT | DIR_DOWN,
  "┒": DIR_LEFT | DIR_DOWN,
  "┖": DIR_UP | DIR_RIGHT,
  "┚": DIR_UP | DIR_LEFT,
  "┠": DIR_UP | DIR_RIGHT | DIR_DOWN,
  "┨": DIR_UP | DIR_LEFT | DIR_DOWN,
  "┰": DIR_LEFT | DIR_RIGHT | DIR_DOWN,
  "┸": DIR_UP | DIR_LEFT | DIR_RIGHT,
  "╂": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,

  // Dashed variants
  "┄": DIR_LEFT | DIR_RIGHT,
  "┈": DIR_LEFT | DIR_RIGHT,
  "┆": DIR_UP | DIR_DOWN,
  "┊": DIR_UP | DIR_DOWN,
  "┅": DIR_LEFT | DIR_RIGHT,
  "┉": DIR_LEFT | DIR_RIGHT,
  "┇": DIR_UP | DIR_DOWN,
  "┋": DIR_UP | DIR_DOWN,

  // ASCII
  "-": DIR_LEFT | DIR_RIGHT,
  "|": DIR_UP | DIR_DOWN,
  "+": DIR_UP | DIR_RIGHT | DIR_DOWN | DIR_LEFT,
};

export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DrawingPreview {
  tool: ToolType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  shiftKey: boolean;
}

export type LineDragMode = "shift" | "extend_start" | "extend_end";

export interface LineDragState {
  segment: LineSegment;
  mode: LineDragMode;
  dx: number;
  dy: number;
  duplicate?: boolean;
  newStartX?: number;
  newEndX?: number;
  newStartY?: number;
  newEndY?: number;
}

export type DragState =
  | { type: "create_selection"; startX: number; startY: number }
  | {
      type: "move_selection";
      startX: number;
      startY: number;
      initialX1: number;
      initialY1: number;
      initialX2: number;
      initialY2: number;
      cells: Array<{ relX: number; relY: number; char: string }>;
      duplicate?: boolean;
    }
  | {
      type: "drag_line";
      segment: LineSegment;
      hSeg: HorizontalSegment | null;
      vSeg: VerticalSegment | null;
      startX: number;
      startY: number;
    }
  | { type: "draw"; startX: number; startY: number }
  | { type: "erase" };

export interface AppState {
  tool: ToolType;
  style: LineStyle;
  panX: number;
  panY: number;
  zoom: number;
  cellWidth: number;
  cellHeight: number;
  cursor: { x: number; y: number; visible: boolean };
  caretBlinkTimer: any;
  selection: SelectionRect | null;
  drag: DragState | null;
  lineDrag: LineDragState | null;
  drawingPreview: DrawingPreview | null;
  isSpacePressed: boolean;
  isPanning: boolean;
  panStart: { x: number; y: number; initialPanX: number; initialPanY: number };
  hoverGrid: Point;
}

/**
 * Global State Container
 */
export const state: AppState = {
  tool: TOOLS.SELECT,
  style: "box-single",
  // Viewport parameters
  panX: 0,
  panY: 0,
  zoom: 1.0,
  // Character cell dimensions (measured dynamically)
  cellWidth: 10,
  cellHeight: 20,
  // Caret position for text typing
  cursor: { x: 5, y: 5, visible: true },
  caretBlinkTimer: null,
  // Selection bounding box in grid coordinates: { x1, y1, x2, y2 } or null
  selection: null,
  // Dragging interactions state
  drag: null,
  // Line dragging state in select mode
  lineDrag: null,
  // Live drawing preview state
  drawingPreview: null,
  // Space key state for infinite canvas panning
  isSpacePressed: false,
  isPanning: false,
  panStart: { x: 0, y: 0, initialPanX: 0, initialPanY: 0 },
  // Mouse grid coordinates
  hoverGrid: { x: 0, y: 0 },
};

/**
 * Grid Storage Model
 * Stores characters sparsely in a Map keyed by "x,y"
 */
export class AsciiGrid {
  private cells: Map<string, string>;

  constructor() {
    this.cells = new Map<string, string>();
  }

  /**
   * Returns character at (x, y) or a single space ' ' if empty
   */
  get(x: number, y: number): string {
    return this.cells.get(`${x},${y}`) || " ";
  }

  /**
   * Sets character at (x, y). Deletes cell if set to space ' '
   */
  set(x: number, y: number, char: string): void {
    const key = `${x},${y}`;
    if (!char || char === " ") {
      this.cells.delete(key);
    } else {
      this.cells.set(key, char);
    }
  }

  /**
   * Deletes character at (x, y)
   */
  delete(x: number, y: number): void {
    this.cells.delete(`${x},${y}`);
  }

  /**
   * Clears all cells from the grid
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Checks if cell at (x, y) is non-empty
   */
  has(x: number, y: number): boolean {
    const c = this.get(x, y);
    return c !== " ";
  }

  /**
   * Clones the current grid state into a new AsciiGrid instance
   */
  clone(): AsciiGrid {
    const copy = new AsciiGrid();
    for (const [k, v] of this.cells.entries()) {
      copy.cells.set(k, v);
    }
    return copy;
  }

  /**
   * Exports all grid data as a plain JavaScript object for history serialization
   */
  toJSON(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.cells.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  /**
   * Restores grid state from a plain JavaScript object
   */
  fromJSON(obj: Record<string, string> | null): void {
    this.cells.clear();
    if (!obj) return;
    for (const k of Object.keys(obj)) {
      this.cells.set(k, obj[k]);
    }
  }

  /**
   * Calculates the bounding box of all populated characters in the grid
   */
  getBounds(): Bounds | null {
    if (this.cells.size === 0) {
      return null;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const key of this.cells.keys()) {
      const [xStr, yStr] = key.split(",");
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
  }
}

export const grid = new AsciiGrid();

/**
 * History / Undo-Redo Manager
 */
export class HistoryManager {
  private undoStack: Array<Record<string, string>>;
  private redoStack: Array<Record<string, string>>;
  private maxHistory: number;

  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
  }

  /**
   * Saves a snapshot of the current grid state
   */
  saveState(): void {
    this.undoStack.push(grid.toJSON());
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  /**
   * Reverts to the previous snapshot
   */
  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(grid.toJSON());
    const previousState = this.undoStack.pop();
    grid.fromJSON(previousState || null);
    requestRender();
    showToast("Undo");
  }

  /**
   * Re-applies the next undone snapshot
   */
  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(grid.toJSON());
    const nextState = this.redoStack.pop();
    grid.fromJSON(nextState || null);
    requestRender();
    showToast("Redo");
  }
}

export const history = new HistoryManager();

/**
 * DOM Element References
 */
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let hiddenInput: HTMLTextAreaElement;
let toolPanel: HTMLElement;
let panelHandle: HTMLElement;
let stylePopover: HTMLElement;
let styleTriggerBtn: HTMLElement;
let styleCurrentPreview: HTMLElement;
let styleCurrentLabel: HTMLElement;
let styleGridList: HTMLElement;
let statusTool: HTMLElement;
let statusCoords: HTMLElement;
let statusSelection: HTMLElement;
let statusZoom: HTMLElement;
let toastEl: HTMLElement;

/**
 * Utility: Display floating toast notification
 */
let toastTimeout: any = null;
export function showToast(message: string): void {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 1800);
}

/**
 * Character Dimensions Measurement
 * Accurately measures monospace font width and height
 */
export function measureFont(): void {
  const testCanvas = document.createElement("canvas");
  const testCtx = testCanvas.getContext("2d");
  if (testCtx) {
    testCtx.font = "16px monospace";
    const metrics = testCtx.measureText("M");
    state.cellWidth = Math.ceil(metrics.width) || 10;
  } else {
    state.cellWidth = 10;
  }
  state.cellHeight = 20;
}

/**
 * Viewport Coordinate Conversion Helpers
 */
export function screenToGrid(screenX: number, screenY: number): Point {
  const gx = Math.floor((screenX - state.panX) / (state.cellWidth * state.zoom));
  const gy = Math.floor((screenY - state.panY) / (state.cellHeight * state.zoom));
  return { x: gx, y: gy };
}

export function gridToScreen(gridX: number, gridY: number): Point {
  const sx = state.panX + gridX * state.cellWidth * state.zoom;
  const sy = state.panY + gridY * state.cellHeight * state.zoom;
  return { x: sx, y: sy };
}

/**
 * Resizes the canvas to match window dimensions with HiDPI support
 */
export function resizeCanvas(): void {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.scale(dpr, dpr);
  requestRender();
}

/**
 * Center viewport around canvas origin or existing content
 */
export function resetView(): void {
  state.zoom = 1.0;
  const bounds = grid.getBounds();
  if (bounds) {
    const centerGridX = (bounds.minX + bounds.maxX) / 2;
    const centerGridY = (bounds.minY + bounds.maxY) / 2;
    state.panX = window.innerWidth / 2 - centerGridX * state.cellWidth;
    state.panY = window.innerHeight / 2 - centerGridY * state.cellHeight;
  } else {
    state.panX = 80;
    state.panY = 80;
  }
  updateStatus();
  requestRender();
  showToast("Centered view");
}

/**
 * Box-Drawing & ASCII Character Identification
 */
export function getCharStyle(char: string): LineStyle {
  for (const [key, set] of Object.entries(BOX_SETS) as Array<[LineStyle, BoxSet]>) {
    if (set.allChars.has(char)) {
      return key;
    }
  }
  return state.style;
}

export function isAnyLineChar(char: string): boolean {
  if (!char || char === " ") return false;
  return GLOBAL_CHAR_PORTS[char] !== undefined;
}

export function isBoxChar(char: string, styleKey?: LineStyle): boolean {
  if (!char || char === " ") return false;
  if (styleKey) {
    const set = BOX_SETS[styleKey];
    return set ? set.allChars.has(char) : false;
  }
  return isAnyLineChar(char);
}

/**
 * Gets port connection bitmask for a character
 */
export function getCharPorts(char: string): number {
  if (!char || char === " ") return 0;
  return GLOBAL_CHAR_PORTS[char] || 0;
}

/**
 * Computes and updates proper junction character at (x, y) based on existing neighbor connectivity.
 * IMPORTANT: NEVER writes into empty cells ' '. Only resolves non-empty line characters!
 */
export function resolveJunction(x: number, y: number, gridInstance: AsciiGrid = grid, forcedStyle?: LineStyle): void {
  const char = gridInstance.get(x, y);
  if (!char || char === " " || !isAnyLineChar(char)) return;

  const styleKey = forcedStyle || getCharStyle(char) || state.style;
  let mask = 0;

  // Check UP neighbor
  const upChar = gridInstance.get(x, y - 1);
  if (upChar !== " " && getCharPorts(upChar) & DIR_DOWN) {
    mask |= DIR_UP;
  }

  // Check RIGHT neighbor
  const rightChar = gridInstance.get(x + 1, y);
  if (rightChar !== " " && getCharPorts(rightChar) & DIR_LEFT) {
    mask |= DIR_RIGHT;
  }

  // Check DOWN neighbor
  const downChar = gridInstance.get(x, y + 1);
  if (downChar !== " " && getCharPorts(downChar) & DIR_UP) {
    mask |= DIR_DOWN;
  }

  // Check LEFT neighbor
  const leftChar = gridInstance.get(x - 1, y);
  if (leftChar !== " " && getCharPorts(leftChar) & DIR_RIGHT) {
    mask |= DIR_LEFT;
  }

  // If mask is 0 (isolated point), keep original char
  if (mask === 0) return;

  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const resolvedChar = set.junctions[mask];

  if (resolvedChar && resolvedChar !== " ") {
    gridInstance.set(x, y, resolvedChar);
  }
}

/**
 * Resolves junctions for modified points and their immediately connected neighbors
 */
export function resolveJunctionsAround(points: Point[], gridInstance: AsciiGrid = grid, forcedStyle?: LineStyle): void {
  const checked = new Set<string>();
  for (const pt of points) {
    const neighbors = [
      { x: pt.x, y: pt.y },
      { x: pt.x, y: pt.y - 1 },
      { x: pt.x + 1, y: pt.y },
      { x: pt.x, y: pt.y + 1 },
      { x: pt.x - 1, y: pt.y },
    ];
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (!checked.has(key)) {
        checked.add(key);
        const cellChar = gridInstance.get(n.x, n.y);
        if (cellChar && cellChar !== " " && isAnyLineChar(cellChar)) {
          resolveJunction(n.x, n.y, gridInstance, forcedStyle);
        }
      }
    }
  }
}

/**
 * Path Generators for Drawing Tools
 */

/**
 * Generates straight line path between (x1, y1) and (x2, y2)
 */
export function getStraightLinePath(x1: number, y1: number, x2: number, y2: number): CharPoint[] {
  const points: CharPoint[] = [];
  const set = BOX_SETS[state.style] || BOX_SETS["box-single"];

  if (y1 === y2) {
    // Pure horizontal line
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: y1, char: set.h });
    }
    return points;
  }

  if (x1 === x2) {
    // Pure vertical line
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      points.push({ x: x1, y, char: set.v });
    }
    return points;
  }

  // Diagonal Bresenham line
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let cx = x1;
  let cy = y1;
  const isHorizDominant = dx >= dy;

  while (true) {
    points.push({ x: cx, y: cy, char: isHorizDominant ? set.h : set.v });
    if (cx === x2 && cy === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
  return points;
}

/**
 * Generates Zigzag line path
 * Default (prefer horizontal with middle vertical):
 *   Horizontal from x1 to midX -> Vertical from y1 to y2 -> Horizontal from midX to x2
 * Shift pressed (prefer vertical with middle horizontal):
 *   Vertical from y1 to midY -> Horizontal from x1 to x2 -> Vertical from midY to y2
 */
export function getZigzagPath(x1: number, y1: number, x2: number, y2: number, shiftPressed: boolean): CharPoint[] {
  const points: CharPoint[] = [];
  const set = BOX_SETS[state.style] || BOX_SETS["box-single"];

  if (y1 === y2) {
    // Straight horizontal
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: y1, char: set.h });
    }
    return points;
  }

  if (x1 === x2) {
    // Straight vertical
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      points.push({ x: x1, y, char: set.v });
    }
    return points;
  }

  if (!shiftPressed) {
    // Default: Horizontal first, vertical in middle, horizontal to end
    const midX = Math.floor((x1 + x2) / 2);
    const stepX1 = x1 <= midX ? 1 : -1;
    const stepX2 = midX <= x2 ? 1 : -1;
    const stepY = y1 <= y2 ? 1 : -1;

    // 1. Horizontal segment from x1 to midX (exclusive of midX)
    for (let x = x1; x !== midX; x += stepX1) {
      points.push({ x, y: y1, char: set.h });
    }

    // 2. Corner 1 at (midX, y1)
    let corner1 = set.h;
    if (x1 <= x2 && y1 <= y2) corner1 = set.junctions[DIR_LEFT | DIR_DOWN];
    else if (x1 <= x2 && y1 > y2) corner1 = set.junctions[DIR_LEFT | DIR_UP];
    else if (x1 > x2 && y1 <= y2) corner1 = set.junctions[DIR_RIGHT | DIR_DOWN];
    else corner1 = set.junctions[DIR_RIGHT | DIR_UP];
    points.push({ x: midX, y: y1, char: corner1 });

    // 3. Vertical segment at midX between y1 and y2 (exclusive of y1 and y2)
    for (let y = y1 + stepY; y !== y2; y += stepY) {
      points.push({ x: midX, y, char: set.v });
    }

    // 4. Corner 2 at (midX, y2)
    let corner2 = set.h;
    if (x1 <= x2 && y1 <= y2) corner2 = set.junctions[DIR_UP | DIR_RIGHT];
    else if (x1 <= x2 && y1 > y2) corner2 = set.junctions[DIR_DOWN | DIR_RIGHT];
    else if (x1 > x2 && y1 <= y2) corner2 = set.junctions[DIR_UP | DIR_LEFT];
    else corner2 = set.junctions[DIR_DOWN | DIR_LEFT];
    points.push({ x: midX, y: y2, char: corner2 });

    // 5. Horizontal segment from midX+stepX2 to x2
    for (let x = midX + stepX2; stepX2 > 0 ? x <= x2 : x >= x2; x += stepX2) {
      points.push({ x, y: y2, char: set.h });
    }
  } else {
    // Shift pressed: Vertical first, horizontal in middle, vertical to end
    const midY = Math.floor((y1 + y2) / 2);
    const stepY1 = y1 <= midY ? 1 : -1;
    const stepY2 = midY <= y2 ? 1 : -1;
    const stepX = x1 <= x2 ? 1 : -1;

    // 1. Vertical segment from y1 to midY (exclusive of midY)
    for (let y = y1; y !== midY; y += stepY1) {
      points.push({ x: x1, y, char: set.v });
    }

    // 2. Corner 1 at (x1, midY)
    let corner1 = set.v;
    if (y1 <= y2 && x1 <= x2) corner1 = set.junctions[DIR_UP | DIR_RIGHT];
    else if (y1 <= y2 && x1 > x2) corner1 = set.junctions[DIR_UP | DIR_LEFT];
    else if (y1 > y2 && x1 <= x2) corner1 = set.junctions[DIR_DOWN | DIR_RIGHT];
    else corner1 = set.junctions[DIR_DOWN | DIR_LEFT];
    points.push({ x: x1, y: midY, char: corner1 });

    // 3. Horizontal segment at midY between x1 and x2 (exclusive of x1 and x2)
    for (let x = x1 + stepX; x !== x2; x += stepX) {
      points.push({ x, y: midY, char: set.h });
    }

    // 4. Corner 2 at (x2, midY)
    let corner2 = set.v;
    if (y1 <= y2 && x1 <= x2) corner2 = set.junctions[DIR_LEFT | DIR_DOWN];
    else if (y1 <= y2 && x1 > x2) corner2 = set.junctions[DIR_RIGHT | DIR_DOWN];
    else if (y1 > y2 && x1 <= x2) corner2 = set.junctions[DIR_LEFT | DIR_UP];
    else corner2 = set.junctions[DIR_RIGHT | DIR_UP];
    points.push({ x: x2, y: midY, char: corner2 });

    // 5. Vertical segment from midY+stepY2 to y2
    for (let y = midY + stepY2; stepY2 > 0 ? y <= y2 : y >= y2; y += stepY2) {
      points.push({ x: x2, y, char: set.v });
    }
  }

  return points;
}

/**
 * Generates Rectangle outline path
 */
export function getRectanglePath(x1: number, y1: number, x2: number, y2: number): CharPoint[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const points: CharPoint[] = [];
  const set = BOX_SETS[state.style] || BOX_SETS["box-single"];

  if (minX === maxX && minY === maxY) {
    return [{ x: minX, y: minY, char: set.h }];
  }

  if (minX === maxX) {
    for (let y = minY; y <= maxY; y++) {
      points.push({ x: minX, y, char: set.v });
    }
    return points;
  }

  if (minY === maxY) {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: minY, char: set.h });
    }
    return points;
  }

  // Corners
  points.push({ x: minX, y: minY, char: set.junctions[DIR_RIGHT | DIR_DOWN] });
  points.push({ x: maxX, y: minY, char: set.junctions[DIR_LEFT | DIR_DOWN] });
  points.push({ x: minX, y: maxY, char: set.junctions[DIR_RIGHT | DIR_UP] });
  points.push({ x: maxX, y: maxY, char: set.junctions[DIR_LEFT | DIR_UP] });

  // Top & bottom horizontal edges
  for (let x = minX + 1; x < maxX; x++) {
    points.push({ x, y: minY, char: set.h });
    points.push({ x, y: maxY, char: set.h });
  }

  // Left & right vertical edges
  for (let y = minY + 1; y < maxY; y++) {
    points.push({ x: minX, y, char: set.v });
    points.push({ x: maxX, y, char: set.v });
  }

  return points;
}

/**
 * Line Detection & Shifting for Select Mode
 */

/**
 * Finds contiguous horizontal line segment passing through (x, y)
 */
export function findHorizontalSegment(x: number, y: number): HorizontalSegment | null {
  const char = grid.get(x, y);
  if (!char || char === " ") return null;
  const ports = getCharPorts(char);
  if ((ports & (DIR_LEFT | DIR_RIGHT)) === 0) return null;

  // Expand left
  let startX = x;
  while (true) {
    const curChar = grid.get(startX, y);
    if ((getCharPorts(curChar) & DIR_LEFT) === 0) break;
    const leftChar = grid.get(startX - 1, y);
    if ((getCharPorts(leftChar) & DIR_RIGHT) === 0) break;
    startX--;
  }

  // Expand right
  let endX = x;
  while (true) {
    const curChar = grid.get(endX, y);
    if ((getCharPorts(curChar) & DIR_RIGHT) === 0) break;
    const rightChar = grid.get(endX + 1, y);
    if ((getCharPorts(rightChar) & DIR_LEFT) === 0) break;
    endX++;
  }

  if (startX === endX) {
    return null;
  }

  return { type: "horizontal", y, startX, endX };
}

/**
 * Finds contiguous vertical line segment passing through (x, y)
 */
export function findVerticalSegment(x: number, y: number): VerticalSegment | null {
  const char = grid.get(x, y);
  if (!char || char === " ") return null;
  const ports = getCharPorts(char);
  if ((ports & (DIR_UP | DIR_DOWN)) === 0) return null;

  // Expand up
  let startY = y;
  while (true) {
    const curChar = grid.get(x, startY);
    if ((getCharPorts(curChar) & DIR_UP) === 0) break;
    const upChar = grid.get(x, startY - 1);
    if ((getCharPorts(upChar) & DIR_DOWN) === 0) break;
    startY--;
  }

  // Expand down
  let endY = y;
  while (true) {
    const curChar = grid.get(x, endY);
    if ((getCharPorts(curChar) & DIR_DOWN) === 0) break;
    const downChar = grid.get(x, endY + 1);
    if ((getCharPorts(downChar) & DIR_UP) === 0) break;
    endY++;
  }

  if (startY === endY) {
    return null;
  }

  return { type: "vertical", x, startY, endY };
}

/**
 * Detects if (x, y) is over a draggable line segment
 */
export function detectLineAt(x: number, y: number): LineSegment | null {
  const hSeg = findHorizontalSegment(x, y);
  const vSeg = findVerticalSegment(x, y);

  const hLen = hSeg ? hSeg.endX - hSeg.startX : 0;
  const vLen = vSeg ? vSeg.endY - vSeg.startY : 0;

  if (hLen > 0 && vLen > 0) {
    return vLen >= hLen ? vSeg : hSeg;
  }
  if (hSeg && hLen > 0) return hSeg;
  if (vSeg && vLen > 0) return vSeg;
  return null;
}

/**
 * Executes dragging of a horizontal line up/down, stretching/shrinking perpendicular connections.
 * If duplicate is true, preserves the original line and stretches connections to pull a new row.
 */
export function applyHorizontalLineDrag(segment: HorizontalSegment, dy: number, duplicate: boolean = false): void {
  if (dy === 0) return;
  history.saveState();

  const oldY = segment.y;
  const newY = oldY + dy;
  const segmentChar = grid.get(segment.startX, oldY);
  const styleKey = getCharStyle(segmentChar) || state.style;
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];

  // Find perpendicular vertical connections along the horizontal segment
  const connections: Array<{ x: number; hasUp: boolean; hasDown: boolean }> = [];
  for (let x = segment.startX; x <= segment.endX; x++) {
    const curChar = grid.get(x, oldY);
    const upChar = grid.get(x, oldY - 1);
    const downChar = grid.get(x, oldY + 1);
    const hasUp = upChar !== " " && (getCharPorts(upChar) & DIR_DOWN) !== 0;
    const hasDown = downChar !== " " && (getCharPorts(downChar) & DIR_UP) !== 0;
    const curPorts = curChar !== " " ? getCharPorts(curChar) : 0;
    if (
      hasUp ||
      hasDown ||
      (duplicate && (x === segment.startX || x === segment.endX || (curPorts & (DIR_UP | DIR_DOWN)) !== 0))
    ) {
      connections.push({
        x,
        hasUp: hasUp || (curPorts & DIR_UP) !== 0,
        hasDown: hasDown || (curPorts & DIR_DOWN) !== 0,
      });
    }
  }

  // 1. Erase old horizontal line cells (only when not duplicating)
  if (!duplicate) {
    for (let x = segment.startX; x <= segment.endX; x++) {
      grid.delete(x, oldY);
    }
  }

  // 2. Adjust vertical perpendicular lines
  for (const conn of connections) {
    const x = conn.x;
    if (dy > 0) {
      // Dragged DOWN
      if (duplicate) {
        for (let y = oldY + 1; y < newY; y++) {
          grid.set(x, y, set.v);
        }
      } else {
        if (conn.hasUp && conn.hasDown) {
          // Vertical line continues through the moved horizontal line
          for (let y = oldY; y < newY; y++) {
            grid.set(x, y, set.v);
          }
        } else if (conn.hasUp) {
          // Vertical line from above extends down to newY
          for (let y = oldY; y < newY; y++) {
            grid.set(x, y, set.v);
          }
        } else if (conn.hasDown) {
          // Vertical line below shrinks from oldY to newY
          for (let y = oldY + 1; y < newY; y++) {
            grid.delete(x, y);
          }
        }
      }
    } else {
      // Dragged UP
      if (duplicate) {
        for (let y = newY + 1; y < oldY; y++) {
          grid.set(x, y, set.v);
        }
      } else {
        if (conn.hasUp && conn.hasDown) {
          // Vertical line continues through the moved horizontal line
          for (let y = newY + 1; y <= oldY; y++) {
            grid.set(x, y, set.v);
          }
        } else if (conn.hasUp) {
          // Vertical line above shrinks from oldY back up to newY
          for (let y = newY + 1; y <= oldY; y++) {
            grid.delete(x, y);
          }
        } else if (conn.hasDown) {
          // Vertical line below extends up to newY
          for (let y = newY + 1; y <= oldY; y++) {
            grid.set(x, y, set.v);
          }
        }
      }
    }
  }

  // 3. Draw new horizontal line at newY
  const affectedPoints: Point[] = [];
  for (let x = segment.startX; x <= segment.endX; x++) {
    grid.set(x, newY, set.h);
    affectedPoints.push({ x, y: newY });
    affectedPoints.push({ x, y: oldY });
  }

  for (const conn of connections) {
    const minY = Math.min(oldY, newY) - 1;
    const maxY = Math.max(oldY, newY) + 1;
    for (let y = minY; y <= maxY; y++) {
      affectedPoints.push({ x: conn.x, y });
    }
  }

  // 4. Resolve junctions for all affected non-empty cells
  resolveJunctionsAround(affectedPoints, grid, styleKey);
}

/**
 * Executes dragging of a vertical line left/right, stretching/shrinking perpendicular connections.
 * If duplicate is true, preserves the original line and stretches connections to pull a new column.
 */
export function applyVerticalLineDrag(segment: VerticalSegment, dx: number, duplicate: boolean = false): void {
  if (dx === 0) return;
  history.saveState();

  const oldX = segment.x;
  const newX = oldX + dx;
  const segmentChar = grid.get(oldX, segment.startY);
  const styleKey = getCharStyle(segmentChar) || state.style;
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];

  // Find perpendicular horizontal connections along the vertical segment
  const connections: Array<{ y: number; hasLeft: boolean; hasRight: boolean }> = [];
  for (let y = segment.startY; y <= segment.endY; y++) {
    const curChar = grid.get(oldX, y);
    const leftChar = grid.get(oldX - 1, y);
    const rightChar = grid.get(oldX + 1, y);
    const hasLeft = leftChar !== " " && (getCharPorts(leftChar) & DIR_RIGHT) !== 0;
    const hasRight = rightChar !== " " && (getCharPorts(rightChar) & DIR_LEFT) !== 0;
    const curPorts = curChar !== " " ? getCharPorts(curChar) : 0;
    if (
      hasLeft ||
      hasRight ||
      (duplicate && (y === segment.startY || y === segment.endY || (curPorts & (DIR_LEFT | DIR_RIGHT)) !== 0))
    ) {
      connections.push({
        y,
        hasLeft: hasLeft || (curPorts & DIR_LEFT) !== 0,
        hasRight: hasRight || (curPorts & DIR_RIGHT) !== 0,
      });
    }
  }

  // 1. Erase old vertical line cells (only when not duplicating)
  if (!duplicate) {
    for (let y = segment.startY; y <= segment.endY; y++) {
      grid.delete(oldX, y);
    }
  }

  // 2. Adjust horizontal perpendicular lines
  for (const conn of connections) {
    const y = conn.y;
    if (dx > 0) {
      // Dragged RIGHT
      if (duplicate) {
        for (let x = oldX + 1; x < newX; x++) {
          grid.set(x, y, set.h);
        }
      } else {
        if (conn.hasLeft && conn.hasRight) {
          // Horizontal line continues through the moved vertical line
          for (let x = oldX; x < newX; x++) {
            grid.set(x, y, set.h);
          }
        } else if (conn.hasLeft) {
          // Horizontal line from left extends right to newX
          for (let x = oldX; x < newX; x++) {
            grid.set(x, y, set.h);
          }
        } else if (conn.hasRight) {
          // Horizontal line on right shrinks from oldX to newX
          for (let x = oldX + 1; x < newX; x++) {
            grid.delete(x, y);
          }
        }
      }
    } else {
      // Dragged LEFT
      if (duplicate) {
        for (let x = newX + 1; x < oldX; x++) {
          grid.set(x, y, set.h);
        }
      } else {
        if (conn.hasLeft && conn.hasRight) {
          // Horizontal line continues through the moved vertical line
          for (let x = newX + 1; x <= oldX; x++) {
            grid.set(x, y, set.h);
          }
        } else if (conn.hasLeft) {
          // Horizontal line on left shrinks from oldX back to newX
          for (let x = newX + 1; x <= oldX; x++) {
            grid.delete(x, y);
          }
        } else if (conn.hasRight) {
          // Horizontal line on right extends left to newX
          for (let x = newX + 1; x <= oldX; x++) {
            grid.set(x, y, set.h);
          }
        }
      }
    }
  }

  // 3. Draw new vertical line at newX
  const affectedPoints: Point[] = [];
  for (let y = segment.startY; y <= segment.endY; y++) {
    grid.set(newX, y, set.v);
    affectedPoints.push({ x: newX, y });
    affectedPoints.push({ x: oldX, y });
  }

  for (const conn of connections) {
    const minX = Math.min(oldX, newX) - 1;
    const maxX = Math.max(oldX, newX) + 1;
    for (let x = minX; x <= maxX; x++) {
      affectedPoints.push({ x, y: conn.y });
    }
  }

  // 4. Resolve junctions for all affected non-empty cells
  resolveJunctionsAround(affectedPoints, grid, styleKey);
}

/**
 * Executes prolonging or shortening of a horizontal line from either endpoint
 */
export function applyHorizontalLineExtend(segment: HorizontalSegment, newStartX: number, newEndX: number): void {
  if (newStartX === segment.startX && newEndX === segment.endX) return;
  history.saveState();

  const y = segment.y;
  const segmentChar = grid.get(segment.startX, y);
  const styleKey = getCharStyle(segmentChar) || state.style;
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const affectedPoints: Point[] = [];

  // Handle startX modification (left side)
  if (newStartX < segment.startX) {
    // Extend left
    for (let x = newStartX; x < segment.startX; x++) {
      grid.set(x, y, set.h);
      affectedPoints.push({ x, y });
    }
  } else if (newStartX > segment.startX) {
    // Shrink from left
    for (let x = segment.startX; x < newStartX; x++) {
      const cur = grid.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_UP | DIR_DOWN)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        grid.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Handle endX modification (right side)
  if (newEndX > segment.endX) {
    // Extend right
    for (let x = segment.endX + 1; x <= newEndX; x++) {
      grid.set(x, y, set.h);
      affectedPoints.push({ x, y });
    }
  } else if (newEndX < segment.endX) {
    // Shrink from right
    for (let x = newEndX + 1; x <= segment.endX; x++) {
      const cur = grid.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_UP | DIR_DOWN)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        grid.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Collect boundary neighborhood for junction adjustments
  const minX = Math.min(newStartX, segment.startX) - 1;
  const maxX = Math.max(newEndX, segment.endX) + 1;
  for (let x = minX; x <= maxX; x++) {
    affectedPoints.push({ x, y });
    affectedPoints.push({ x, y: y - 1 });
    affectedPoints.push({ x, y: y + 1 });
  }

  resolveJunctionsAround(affectedPoints, grid, styleKey);
}

/**
 * Executes prolonging or shortening of a vertical line from either endpoint
 */
export function applyVerticalLineExtend(segment: VerticalSegment, newStartY: number, newEndY: number): void {
  if (newStartY === segment.startY && newEndY === segment.endY) return;
  history.saveState();

  const x = segment.x;
  const segmentChar = grid.get(x, segment.startY);
  const styleKey = getCharStyle(segmentChar) || state.style;
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const affectedPoints: Point[] = [];

  // Handle startY modification (top side)
  if (newStartY < segment.startY) {
    // Extend up
    for (let y = newStartY; y < segment.startY; y++) {
      grid.set(x, y, set.v);
      affectedPoints.push({ x, y });
    }
  } else if (newStartY > segment.startY) {
    // Shrink from top
    for (let y = segment.startY; y < newStartY; y++) {
      const cur = grid.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_LEFT | DIR_RIGHT)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        grid.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Handle endY modification (bottom side)
  if (newEndY > segment.endY) {
    // Extend down
    for (let y = segment.endY + 1; y <= newEndY; y++) {
      grid.set(x, y, set.v);
      affectedPoints.push({ x, y });
    }
  } else if (newEndY < segment.endY) {
    // Shrink from bottom
    for (let y = newEndY + 1; y <= segment.endY; y++) {
      const cur = grid.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_LEFT | DIR_RIGHT)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        grid.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Collect boundary neighborhood for junction adjustments
  const minY = Math.min(newStartY, segment.startY) - 1;
  const maxY = Math.max(newEndY, segment.endY) + 1;
  for (let y = minY; y <= maxY; y++) {
    affectedPoints.push({ x, y });
    affectedPoints.push({ x: x - 1, y });
    affectedPoints.push({ x: x + 1, y });
  }

  resolveJunctionsAround(affectedPoints, grid, styleKey);
}

/**
 * Selection & Clipboard Operations
 */

/**
 * Checks if grid coordinate (x, y) is inside the current selection bounding box
 */
export function isInsideSelection(x: number, y: number): boolean {
  if (!state.selection) return false;
  const minX = Math.min(state.selection.x1, state.selection.x2);
  const maxX = Math.max(state.selection.x1, state.selection.x2);
  const minY = Math.min(state.selection.y1, state.selection.y2);
  const maxY = Math.max(state.selection.y1, state.selection.y2);
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

/**
 * Formats selected rectangular area or whole canvas as ASCII text
 */
export function getSelectionText(): string {
  let bounds: Bounds | null = null;
  if (state.selection) {
    bounds = {
      minX: Math.min(state.selection.x1, state.selection.x2),
      maxX: Math.max(state.selection.x1, state.selection.x2),
      minY: Math.min(state.selection.y1, state.selection.y2),
      maxY: Math.max(state.selection.y1, state.selection.y2),
    };
  } else {
    bounds = grid.getBounds();
  }

  if (!bounds) return "";

  const lines: string[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    let row = "";
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      row += grid.get(x, y);
    }
    // Trim trailing whitespace on each line
    lines.push(row.replace(/\s+$/, ""));
  }

  return lines.join("\n");
}

/**
 * Copies selected ASCII region to clipboard
 */
export async function copySelectionToClipboard(): Promise<void> {
  const text = getSelectionText();
  if (!text) {
    showToast("Nothing to copy");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  } catch (err) {
    // Fallback using textarea
    if (hiddenInput) {
      hiddenInput.value = text;
      hiddenInput.select();
      document.execCommand("copy");
      showToast("Copied to clipboard");
    }
  }
}

/**
 * Cuts selected ASCII region to clipboard and deletes it from canvas
 */
export async function cutSelectionToClipboard(): Promise<void> {
  if (!state.selection) {
    showToast("No selection to cut");
    return;
  }
  await copySelectionToClipboard();
  deleteSelection();
  showToast("Cut to clipboard");
}

/**
 * Pastes text at specified grid location
 */
export function pasteAsciiText(text: string, targetX: number, targetY: number): void {
  if (!text) return;
  history.saveState();

  const lines = text.split(/\r?\n/);
  let maxLineLen = 0;

  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    if (line.length > maxLineLen) maxLineLen = line.length;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      grid.set(targetX + c, targetY + r, char);
    }
  }

  // Set selection around the pasted content
  state.selection = {
    x1: targetX,
    y1: targetY,
    x2: targetX + maxLineLen - 1,
    y2: targetY + lines.length - 1,
  };

  updateStatus();
  requestRender();
  showToast("Pasted");
}

/**
 * Deletes all characters in current selection
 */
export function deleteSelection(): void {
  if (!state.selection) return;
  history.saveState();

  const minX = Math.min(state.selection.x1, state.selection.x2);
  const maxX = Math.max(state.selection.x1, state.selection.x2);
  const minY = Math.min(state.selection.y1, state.selection.y2);
  const maxY = Math.max(state.selection.y1, state.selection.y2);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      grid.delete(x, y);
    }
  }

  state.selection = null;
  updateStatus();
  requestRender();
  showToast("Deleted");
}

/**
 * Text Input Handling
 */
export function handleTextInputChar(char: string): void {
  history.saveState();
  grid.set(state.cursor.x, state.cursor.y, char);
  state.cursor.x++;
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function handleBackspace(): void {
  history.saveState();
  state.cursor.x--;
  grid.delete(state.cursor.x, state.cursor.y);
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function handleEnter(): void {
  state.cursor.x = 5;
  state.cursor.y++;
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

/**
 * Caret Blinker Timer
 */
export function startCaretBlinker(): void {
  if (state.caretBlinkTimer) clearInterval(state.caretBlinkTimer);
  state.caretBlinkTimer = setInterval(() => {
    state.cursor.visible = !state.cursor.visible;
    if (state.tool === TOOLS.TEXT) {
      requestRender();
    }
  }, 500);
}

/**
 * Tool Switcher
 */
export function setTool(toolName: ToolType): void {
  state.tool = toolName;
  state.selection = null; // Clear selection when changing tool
  document.querySelectorAll<HTMLElement>(".tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === toolName);
  });
  if (toolName === TOOLS.TEXT && hiddenInput) {
    hiddenInput.focus();
  }
  updateStatus();
  requestRender();
}

/**
 * Select Line Style & Update Popover / Panel UI
 */
export function selectStyle(styleKey: LineStyle): void {
  state.style = styleKey;
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];

  if (styleCurrentPreview) {
    styleCurrentPreview.textContent = set.miniPreview;
  }
  if (styleCurrentLabel) {
    styleCurrentLabel.textContent = set.name;
  }

  // Update active highlight on popover cards
  document.querySelectorAll<HTMLElement>(".style-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.styleKey === styleKey);
  });

  // Close popover if open
  if (stylePopover && (stylePopover as any).hidePopover) {
    try {
      (stylePopover as any).hidePopover();
    } catch (err) {}
  }

  requestRender();
  showToast(`Style: ${set.name}`);
}

/**
 * Renders style selector cards into Popover
 */
export function renderStyleSelector(): void {
  if (!styleGridList) return;
  styleGridList.innerHTML = "";

  for (const [key, set] of Object.entries(BOX_SETS) as Array<[LineStyle, BoxSet]>) {
    const card = document.createElement("div");
    card.className = `style-card ${key === state.style ? "active" : ""}`;
    card.dataset.styleKey = key;
    card.title = set.name;

    const sampleDiv = document.createElement("div");
    sampleDiv.className = "style-sample-grid";
    sampleDiv.textContent = set.sampleGrid;

    const nameSpan = document.createElement("span");
    nameSpan.className = "style-card-name";
    nameSpan.textContent = set.name;

    card.appendChild(sampleDiv);
    card.appendChild(nameSpan);

    card.addEventListener("click", () => {
      selectStyle(key);
    });

    styleGridList.appendChild(card);
  }
}

/**
 * Update UI Status Bar Display
 */
export function updateStatus(): void {
  if (!statusTool || !statusCoords || !statusSelection || !statusZoom) return;
  statusTool.textContent = state.tool.charAt(0).toUpperCase() + state.tool.slice(1);
  statusCoords.textContent = `${state.hoverGrid.x}, ${state.hoverGrid.y}`;
  statusZoom.textContent = `${Math.round(state.zoom * 100)}%`;

  if (state.selection) {
    const w = Math.abs(state.selection.x2 - state.selection.x1) + 1;
    const h = Math.abs(state.selection.y2 - state.selection.y1) + 1;
    statusSelection.textContent = `${w} × ${h}`;
  } else {
    statusSelection.textContent = "None";
  }
}

/**
 * Canvas Rendering Engine
 */
let renderRequested = false;
export function requestRender(): void {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(render);
  }
}

export function render(): void {
  renderRequested = false;
  if (!ctx) return;
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw Grid Background
  const startGridX = Math.floor(-state.panX / (state.cellWidth * state.zoom)) - 1;
  const endGridX = Math.ceil((width - state.panX) / (state.cellWidth * state.zoom)) + 1;
  const startGridY = Math.floor(-state.panY / (state.cellHeight * state.zoom)) - 1;
  const endGridY = Math.ceil((height - state.panY) / (state.cellHeight * state.zoom)) + 1;

  ctx.save();

  // Draw subtle cell grid dots/lines
  ctx.fillStyle = "#d5cebf";
  for (let gx = startGridX; gx <= endGridX; gx++) {
    const sx = state.panX + gx * state.cellWidth * state.zoom;
    for (let gy = startGridY; gy <= endGridY; gy++) {
      const sy = state.panY + gy * state.cellHeight * state.zoom;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Origin marker (0, 0)
  const origin = gridToScreen(0, 0);
  if (origin.x >= -50 && origin.x <= width + 50 && origin.y >= -50 && origin.y <= height + 50) {
    ctx.strokeStyle = "#b8b0a2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(origin.x - 6, origin.y);
    ctx.lineTo(origin.x + 6, origin.y);
    ctx.moveTo(origin.x, origin.y - 6);
    ctx.lineTo(origin.x, origin.y + 6);
    ctx.stroke();
  }

  // 2. Setup Font & Monospace Text Rendering
  const fontSize = Math.max(8, Math.round(16 * state.zoom));
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#2e2c29";

  const isMovingSelection = state.drag && state.drag.type === "move_selection";
  const moveDrag = isMovingSelection ? (state.drag as any) : null;

  // Draw stored characters (skipping cells actively moving with selection drag or shortened line drag)
  for (let gy = startGridY; gy <= endGridY; gy++) {
    for (let gx = startGridX; gx <= endGridX; gx++) {
      if (moveDrag && !moveDrag.duplicate) {
        if (
          gx >= moveDrag.initialX1 &&
          gx <= moveDrag.initialX2 &&
          gy >= moveDrag.initialY1 &&
          gy <= moveDrag.initialY2
        ) {
          continue;
        }
      }
      const char = grid.get(gx, gy);
      if (char !== " ") {
        if (state.lineDrag && state.lineDrag.mode !== "shift") {
          const ld = state.lineDrag;
          if (ld.segment.type === "horizontal" && gy === ld.segment.y) {
            const startX = ld.newStartX !== undefined ? ld.newStartX : ld.segment.startX;
            const endX = ld.newEndX !== undefined ? ld.newEndX : ld.segment.endX;
            if (gx >= ld.segment.startX && gx <= ld.segment.endX && (gx < startX || gx > endX)) {
              const ports = getCharPorts(char);
              if ((ports & (DIR_UP | DIR_DOWN)) === 0) {
                continue;
              }
            }
          } else if (ld.segment.type === "vertical" && gx === ld.segment.x) {
            const startY = ld.newStartY !== undefined ? ld.newStartY : ld.segment.startY;
            const endY = ld.newEndY !== undefined ? ld.newEndY : ld.segment.endY;
            if (gy >= ld.segment.startY && gy <= ld.segment.endY && (gy < startY || gy > endY)) {
              const ports = getCharPorts(char);
              if ((ports & (DIR_LEFT | DIR_RIGHT)) === 0) {
                continue;
              }
            }
          }
        }
        const spos = gridToScreen(gx, gy);
        ctx.fillText(char, spos.x, spos.y + 2 * state.zoom);
      }
    }
  }

  // Live render of moving selection block characters
  if (moveDrag) {
    const dx = state.hoverGrid.x - moveDrag.startX;
    const dy = state.hoverGrid.y - moveDrag.startY;
    ctx.fillStyle = "#544e45";
    for (const item of moveDrag.cells) {
      if (item.char !== " ") {
        const targetX = moveDrag.initialX1 + dx + item.relX;
        const targetY = moveDrag.initialY1 + dy + item.relY;
        const spos = gridToScreen(targetX, targetY);
        ctx.fillText(item.char, spos.x, spos.y + 2 * state.zoom);
      }
    }
  }

  // 3. Draw Active Tool Drawing Preview
  if (state.drawingPreview) {
    const prev = state.drawingPreview;
    let previewPoints: CharPoint[] = [];

    if (prev.tool === TOOLS.ZIGZAG) {
      previewPoints = getZigzagPath(prev.startX, prev.startY, prev.currentX, prev.currentY, prev.shiftKey);
    } else if (prev.tool === TOOLS.LINE) {
      previewPoints = getStraightLinePath(prev.startX, prev.startY, prev.currentX, prev.currentY);
    } else if (prev.tool === TOOLS.RECT) {
      previewPoints = getRectanglePath(prev.startX, prev.startY, prev.currentX, prev.currentY);
    }

    ctx.fillStyle = "#544e45";
    for (const pt of previewPoints) {
      const spos = gridToScreen(pt.x, pt.y);
      ctx.fillText(pt.char || "─", spos.x, spos.y + 2 * state.zoom);
    }
  }

  // 4. Draw Line Drag Preview in Select Mode
  if (state.lineDrag) {
    const ld = state.lineDrag;
    const segmentChar = grid.get(
      ld.segment.type === "horizontal" ? ld.segment.startX : ld.segment.x,
      ld.segment.type === "horizontal" ? ld.segment.y : ld.segment.startY
    );
    const styleKey = getCharStyle(segmentChar) || state.style;
    const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
    ctx.fillStyle = "#6e6659";

    if (ld.mode === "shift") {
      if (ld.segment.type === "horizontal") {
        const targetY = ld.segment.y + ld.dy;
        for (let x = ld.segment.startX; x <= ld.segment.endX; x++) {
          const spos = gridToScreen(x, targetY);
          ctx.fillText(set.h, spos.x, spos.y + 2 * state.zoom);
        }
        if (ld.duplicate) {
          const minY = Math.min(ld.segment.y, targetY);
          const maxY = Math.max(ld.segment.y, targetY);
          for (let x = ld.segment.startX; x <= ld.segment.endX; x++) {
            const curChar = grid.get(x, ld.segment.y);
            const upChar = grid.get(x, ld.segment.y - 1);
            const downChar = grid.get(x, ld.segment.y + 1);
            const hasUp = upChar !== " " && (getCharPorts(upChar) & DIR_DOWN) !== 0;
            const hasDown = downChar !== " " && (getCharPorts(downChar) & DIR_UP) !== 0;
            const curPorts = curChar !== " " ? getCharPorts(curChar) : 0;
            if (
              hasUp ||
              hasDown ||
              x === ld.segment.startX ||
              x === ld.segment.endX ||
              (curPorts & (DIR_UP | DIR_DOWN)) !== 0
            ) {
              for (let y = minY + 1; y < maxY; y++) {
                const spos = gridToScreen(x, y);
                ctx.fillText(set.v, spos.x, spos.y + 2 * state.zoom);
              }
            }
          }
        }
      } else {
        const targetX = ld.segment.x + ld.dx;
        for (let y = ld.segment.startY; y <= ld.segment.endY; y++) {
          const spos = gridToScreen(targetX, y);
          ctx.fillText(set.v, spos.x, spos.y + 2 * state.zoom);
        }
        if (ld.duplicate) {
          const minX = Math.min(ld.segment.x, targetX);
          const maxX = Math.max(ld.segment.x, targetX);
          for (let y = ld.segment.startY; y <= ld.segment.endY; y++) {
            const curChar = grid.get(ld.segment.x, y);
            const leftChar = grid.get(ld.segment.x - 1, y);
            const rightChar = grid.get(ld.segment.x + 1, y);
            const hasLeft = leftChar !== " " && (getCharPorts(leftChar) & DIR_RIGHT) !== 0;
            const hasRight = rightChar !== " " && (getCharPorts(rightChar) & DIR_LEFT) !== 0;
            const curPorts = curChar !== " " ? getCharPorts(curChar) : 0;
            if (
              hasLeft ||
              hasRight ||
              y === ld.segment.startY ||
              y === ld.segment.endY ||
              (curPorts & (DIR_LEFT | DIR_RIGHT)) !== 0
            ) {
              for (let x = minX + 1; x < maxX; x++) {
                const spos = gridToScreen(x, y);
                ctx.fillText(set.h, spos.x, spos.y + 2 * state.zoom);
              }
            }
          }
        }
      }
    } else {
      if (ld.segment.type === "horizontal") {
        const y = ld.segment.y;
        const startX = ld.newStartX !== undefined ? ld.newStartX : ld.segment.startX;
        const endX = ld.newEndX !== undefined ? ld.newEndX : ld.segment.endX;
        for (let x = startX; x <= endX; x++) {
          const spos = gridToScreen(x, y);
          ctx.fillText(set.h, spos.x, spos.y + 2 * state.zoom);
        }
      } else {
        const x = ld.segment.x;
        const startY = ld.newStartY !== undefined ? ld.newStartY : ld.segment.startY;
        const endY = ld.newEndY !== undefined ? ld.newEndY : ld.segment.endY;
        for (let y = startY; y <= endY; y++) {
          const spos = gridToScreen(x, y);
          ctx.fillText(set.v, spos.x, spos.y + 2 * state.zoom);
        }
      }
    }
  }

  // 5. Draw Selected Area or Selection Drag Preview
  if (state.selection) {
    const minX = Math.min(state.selection.x1, state.selection.x2);
    const maxX = Math.max(state.selection.x1, state.selection.x2);
    const minY = Math.min(state.selection.y1, state.selection.y2);
    const maxY = Math.max(state.selection.y1, state.selection.y2);

    const tl = gridToScreen(minX, minY);
    const br = gridToScreen(maxX + 1, maxY + 1);
    const selW = br.x - tl.x;
    const selH = br.y - tl.y;

    ctx.fillStyle = "rgba(84, 78, 69, 0.12)";
    ctx.fillRect(tl.x, tl.y, selW, selH);

    ctx.strokeStyle = "#544e45";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(tl.x, tl.y, selW, selH);
    ctx.setLineDash([]);
  }

  // 6. Draw Text Cursor Caret
  if (state.tool === TOOLS.TEXT && state.cursor.visible) {
    const curScreen = gridToScreen(state.cursor.x, state.cursor.y);
    const curH = state.cellHeight * state.zoom;

    ctx.fillStyle = "#2e2c29";
    ctx.fillRect(curScreen.x, curScreen.y, 2, curH);
  }

  // 7. Hover cell indicator (in select or text mode)
  if (!state.isPanning && !state.isSpacePressed) {
    const hpos = gridToScreen(state.hoverGrid.x, state.hoverGrid.y);
    const cellW = state.cellWidth * state.zoom;
    const cellH = state.cellHeight * state.zoom;

    ctx.strokeStyle = "rgba(84, 78, 69, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(hpos.x, hpos.y, cellW, cellH);
  }

  ctx.restore();
}

/**
 * Setup All Event Listeners on Initialization
 */
export function setupEventListeners(): void {
  const container = document.getElementById("canvas-container");
  if (!container) return;

  // Mouse Move Handler
  container.addEventListener("mousemove", (e: MouseEvent) => {
    const gridPos = screenToGrid(e.clientX, e.clientY);
    state.hoverGrid = gridPos;
    updateStatus();

    // Panning drag
    if (state.isPanning) {
      const dx = e.clientX - state.panStart.x;
      const dy = e.clientY - state.panStart.y;
      state.panX = state.panStart.initialPanX + dx;
      state.panY = state.panStart.initialPanY + dy;
      requestRender();
      return;
    }

    // Tool previews and interaction updates
    if (state.drag) {
      if (state.drag.type === "create_selection") {
        state.selection = {
          x1: state.drag.startX,
          y1: state.drag.startY,
          x2: gridPos.x,
          y2: gridPos.y,
        };
        updateStatus();
        requestRender();
      } else if (state.drag.type === "move_selection") {
        const dx = gridPos.x - state.drag.startX;
        const dy = gridPos.y - state.drag.startY;
        state.drag.duplicate = e.altKey;
        state.selection = {
          x1: state.drag.initialX1 + dx,
          y1: state.drag.initialY1 + dy,
          x2: state.drag.initialX2 + dx,
          y2: state.drag.initialY2 + dy,
        };
        requestRender();
      } else if (state.drag.type === "drag_line") {
        const dx = gridPos.x - state.drag.startX;
        const dy = gridPos.y - state.drag.startY;
        const hSeg = state.drag.hSeg;
        const vSeg = state.drag.vSeg;
        const isAlt = e.altKey;

        if (hSeg && vSeg) {
          // Corner or junction clicked
          if (isAlt) {
            if (Math.abs(dy) >= Math.abs(dx)) {
              state.lineDrag = { segment: hSeg, mode: "shift", dx: 0, dy, duplicate: true };
            } else {
              state.lineDrag = { segment: vSeg, mode: "shift", dx, dy: 0, duplicate: true };
            }
          } else if (Math.abs(dx) >= Math.abs(dy)) {
            const isLeft = state.drag.startX <= (hSeg.startX + hSeg.endX) / 2;
            if (isLeft) {
              const newStartX = Math.min(hSeg.endX, hSeg.startX + dx);
              state.lineDrag = { segment: hSeg, mode: "extend_start", dx, dy: 0, newStartX };
            } else {
              const newEndX = Math.max(hSeg.startX, hSeg.endX + dx);
              state.lineDrag = { segment: hSeg, mode: "extend_end", dx, dy: 0, newEndX };
            }
          } else {
            const isTop = state.drag.startY <= (vSeg.startY + vSeg.endY) / 2;
            if (isTop) {
              const newStartY = Math.min(vSeg.endY, vSeg.startY + dy);
              state.lineDrag = { segment: vSeg, mode: "extend_start", dx: 0, dy, newStartY };
            } else {
              const newEndY = Math.max(vSeg.startY, vSeg.endY + dy);
              state.lineDrag = { segment: vSeg, mode: "extend_end", dx: 0, dy, newEndY };
            }
          }
        } else if (hSeg) {
          // Horizontal line
          if (isAlt) {
            state.lineDrag = { segment: hSeg, mode: "shift", dx: 0, dy, duplicate: true };
          } else if (Math.abs(dx) >= Math.abs(dy)) {
            const isLeft = state.drag.startX <= (hSeg.startX + hSeg.endX) / 2;
            if (isLeft) {
              const newStartX = Math.min(hSeg.endX, hSeg.startX + dx);
              state.lineDrag = { segment: hSeg, mode: "extend_start", dx, dy: 0, newStartX };
            } else {
              const newEndX = Math.max(hSeg.startX, hSeg.endX + dx);
              state.lineDrag = { segment: hSeg, mode: "extend_end", dx, dy: 0, newEndX };
            }
          } else {
            state.lineDrag = { segment: hSeg, mode: "shift", dx: 0, dy, duplicate: false };
          }
        } else if (vSeg) {
          // Vertical line
          if (isAlt) {
            state.lineDrag = { segment: vSeg, mode: "shift", dx, dy: 0, duplicate: true };
          } else if (Math.abs(dy) >= Math.abs(dx)) {
            const isTop = state.drag.startY <= (vSeg.startY + vSeg.endY) / 2;
            if (isTop) {
              const newStartY = Math.min(vSeg.endY, vSeg.startY + dy);
              state.lineDrag = { segment: vSeg, mode: "extend_start", dx: 0, dy, newStartY };
            } else {
              const newEndY = Math.max(vSeg.startY, vSeg.endY + dy);
              state.lineDrag = { segment: vSeg, mode: "extend_end", dx: 0, dy, newEndY };
            }
          } else {
            state.lineDrag = { segment: vSeg, mode: "shift", dx, dy: 0, duplicate: false };
          }
        }
        requestRender();
      } else if (state.drag.type === "draw") {
        state.drawingPreview = {
          tool: state.tool,
          startX: state.drag.startX,
          startY: state.drag.startY,
          currentX: gridPos.x,
          currentY: gridPos.y,
          shiftKey: e.shiftKey,
        };
        requestRender();
      } else if (state.drag.type === "erase") {
        grid.delete(gridPos.x, gridPos.y);
        requestRender();
      }
    } else {
      // Update cursor icon dynamically in select mode
      if (state.isSpacePressed) {
        container.style.cursor = "grab";
      } else if (state.tool === TOOLS.SELECT) {
        if (state.selection) {
          if (isInsideSelection(gridPos.x, gridPos.y)) {
            container.style.cursor = "move";
          } else {
            container.style.cursor = "default";
          }
        } else {
          const hSeg = findHorizontalSegment(gridPos.x, gridPos.y);
          const vSeg = findVerticalSegment(gridPos.x, gridPos.y);
          if (hSeg && vSeg) {
            container.style.cursor = "move";
          } else if (hSeg) {
            container.style.cursor = "ns-resize";
          } else if (vSeg) {
            container.style.cursor = "ew-resize";
          } else {
            container.style.cursor = "default";
          }
        }
      } else if (state.tool === TOOLS.TEXT) {
        container.style.cursor = "text";
      } else {
        container.style.cursor = "crosshair";
      }
      requestRender();
    }
  });

  // Mouse Down Handler
  container.addEventListener("mousedown", (e: MouseEvent) => {
    // Middle click or Space + Left click initiates panning
    if (e.button === 1 || (e.button === 0 && state.isSpacePressed)) {
      state.isPanning = true;
      state.panStart = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: state.panX,
        initialPanY: state.panY,
      };
      container.style.cursor = "grabbing";
      return;
    }

    if (e.button !== 0) return;

    const gridPos = screenToGrid(e.clientX, e.clientY);

    if (state.tool === TOOLS.SELECT) {
      if (state.selection) {
        if (isInsideSelection(gridPos.x, gridPos.y)) {
          // Start moving (or copying with Alt) existing selection block
          const blockCells: Array<{ relX: number; relY: number; char: string }> = [];
          const minX = Math.min(state.selection.x1, state.selection.x2);
          const maxX = Math.max(state.selection.x1, state.selection.x2);
          const minY = Math.min(state.selection.y1, state.selection.y2);
          const maxY = Math.max(state.selection.y1, state.selection.y2);

          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              blockCells.push({ relX: x - minX, relY: y - minY, char: grid.get(x, y) });
            }
          }

          state.drag = {
            type: "move_selection",
            startX: gridPos.x,
            startY: gridPos.y,
            initialX1: minX,
            initialY1: minY,
            initialX2: maxX,
            initialY2: maxY,
            cells: blockCells,
            duplicate: e.altKey,
          };
        } else {
          // Clicked outside existing selection -> clear selection and start creating a new selection
          state.selection = null;
          state.drag = {
            type: "create_selection",
            startX: gridPos.x,
            startY: gridPos.y,
          };
          updateStatus();
          requestRender();
        }
      } else {
        // No active selection: detect lines for table/line editing, or create selection
        const hSeg = findHorizontalSegment(gridPos.x, gridPos.y);
        const vSeg = findVerticalSegment(gridPos.x, gridPos.y);
        const line = detectLineAt(gridPos.x, gridPos.y);

        if (line) {
          // Start dragging line segment
          state.drag = {
            type: "drag_line",
            segment: line,
            hSeg,
            vSeg,
            startX: gridPos.x,
            startY: gridPos.y,
          };
        } else {
          // Start creating new rectangular selection
          state.drag = {
            type: "create_selection",
            startX: gridPos.x,
            startY: gridPos.y,
          };
        }
      }
    } else if (state.tool === TOOLS.TEXT) {
      state.cursor.x = gridPos.x;
      state.cursor.y = gridPos.y;
      state.cursor.visible = true;
      if (hiddenInput) hiddenInput.focus();
      requestRender();
      updateStatus();
    } else if (state.tool === TOOLS.ERASER) {
      history.saveState();
      grid.delete(gridPos.x, gridPos.y);
      state.drag = { type: "erase" };
      requestRender();
    } else {
      // Line, Zigzag, Rect drawing tools
      state.drag = {
        type: "draw",
        startX: gridPos.x,
        startY: gridPos.y,
      };
      state.drawingPreview = {
        tool: state.tool,
        startX: gridPos.x,
        startY: gridPos.y,
        currentX: gridPos.x,
        currentY: gridPos.y,
        shiftKey: e.shiftKey,
      };
      requestRender();
    }
  });

  // Mouse Up Handler
  window.addEventListener("mouseup", (e: MouseEvent) => {
    if (state.isPanning) {
      state.isPanning = false;
      container.style.cursor = state.isSpacePressed ? "grab" : "default";
    }

    if (state.drag) {
      const gridPos = screenToGrid(e.clientX, e.clientY);

      if (state.drag.type === "drag_line") {
        if (state.lineDrag) {
          if (state.lineDrag.mode === "shift") {
            if (state.lineDrag.segment.type === "horizontal") {
              applyHorizontalLineDrag(state.lineDrag.segment, state.lineDrag.dy, !!state.lineDrag.duplicate);
            } else {
              applyVerticalLineDrag(state.lineDrag.segment, state.lineDrag.dx, !!state.lineDrag.duplicate);
            }
          } else {
            if (state.lineDrag.segment.type === "horizontal") {
              const newStartX =
                state.lineDrag.newStartX !== undefined ? state.lineDrag.newStartX : state.lineDrag.segment.startX;
              const newEndX =
                state.lineDrag.newEndX !== undefined ? state.lineDrag.newEndX : state.lineDrag.segment.endX;
              applyHorizontalLineExtend(state.lineDrag.segment, newStartX, newEndX);
            } else {
              const newStartY =
                state.lineDrag.newStartY !== undefined ? state.lineDrag.newStartY : state.lineDrag.segment.startY;
              const newEndY =
                state.lineDrag.newEndY !== undefined ? state.lineDrag.newEndY : state.lineDrag.segment.endY;
              applyVerticalLineExtend(state.lineDrag.segment, newStartY, newEndY);
            }
          }
        }
        state.lineDrag = null;
      } else if (state.drag.type === "move_selection") {
        const dx = gridPos.x - state.drag.startX;
        const dy = gridPos.y - state.drag.startY;
        if (dx !== 0 || dy !== 0) {
          history.saveState();
          if (!state.drag.duplicate) {
            // Clear old bounds only when not duplicating
            for (let y = state.drag.initialY1; y <= state.drag.initialY2; y++) {
              for (let x = state.drag.initialX1; x <= state.drag.initialX2; x++) {
                grid.delete(x, y);
              }
            }
          }
          // Write to new position
          for (const item of state.drag.cells) {
            if (item.char !== " ") {
              grid.set(state.drag.initialX1 + dx + item.relX, state.drag.initialY1 + dy + item.relY, item.char);
            }
          }
          state.selection = {
            x1: state.drag.initialX1 + dx,
            y1: state.drag.initialY1 + dy,
            x2: state.drag.initialX2 + dx,
            y2: state.drag.initialY2 + dy,
          };
        }
      } else if (state.drag.type === "draw") {
        history.saveState();
        let points: CharPoint[] = [];
        const startX = state.drag.startX;
        const startY = state.drag.startY;

        if (state.tool === TOOLS.ZIGZAG) {
          points = getZigzagPath(startX, startY, gridPos.x, gridPos.y, e.shiftKey);
        } else if (state.tool === TOOLS.LINE) {
          points = getStraightLinePath(startX, startY, gridPos.x, gridPos.y);
        } else if (state.tool === TOOLS.RECT) {
          points = getRectanglePath(startX, startY, gridPos.x, gridPos.y);
        }

        // Apply points to grid
        for (const pt of points) {
          grid.set(pt.x, pt.y, pt.char || "─");
        }

        // Resolve junctions for all newly drawn points and connected neighbors
        resolveJunctionsAround(points, grid, state.style);
        state.drawingPreview = null;
      }

      state.drag = null;
      requestRender();
      updateStatus();
    }
  });

  // Mouse Wheel Zoom and Pan
  container.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(state.zoom * zoomFactor, 0.4), 3.0);

        // Zoom centered around mouse pointer
        const mouseScreenX = e.clientX;
        const mouseScreenY = e.clientY;
        const mouseGridBefore = screenToGrid(mouseScreenX, mouseScreenY);

        state.zoom = newZoom;
        const mouseScreenAfter = gridToScreen(mouseGridBefore.x, mouseGridBefore.y);
        state.panX += mouseScreenX - mouseScreenAfter.x;
        state.panY += mouseScreenY - mouseScreenAfter.y;
      } else {
        // Pan
        state.panX -= e.deltaX;
        state.panY -= e.deltaY;
      }
      updateStatus();
      requestRender();
    },
    { passive: false }
  );

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // Space key for panning
    if (e.code === "Space" && !state.isSpacePressed && state.tool !== TOOLS.TEXT) {
      state.isSpacePressed = true;
      container.style.cursor = "grab";
      return;
    }

    // Global Shortcuts with Ctrl / Cmd
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
        return;
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        history.redo();
        return;
      }
      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectionToClipboard();
        return;
      }
      if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        cutSelectionToClipboard();
        return;
      }
      if (e.key.toLowerCase() === "v") {
        return;
      }
    }

    // Tool Shortcuts (when not actively typing text)
    if (state.tool !== TOOLS.TEXT) {
      switch (e.key.toLowerCase()) {
        case "v":
          setTool(TOOLS.SELECT);
          break;
        case "t":
          setTool(TOOLS.TEXT);
          break;
        case "z":
          setTool(TOOLS.ZIGZAG);
          break;
        case "l":
          setTool(TOOLS.LINE);
          break;
        case "r":
          setTool(TOOLS.RECT);
          break;
        case "e":
          setTool(TOOLS.ERASER);
          break;
        case "delete":
        case "backspace":
          deleteSelection();
          break;
        case "escape":
          state.selection = null;
          state.drawingPreview = null;
          updateStatus();
          requestRender();
          break;
      }
    } else {
      // Text Mode Navigation & Typing
      if (e.key === "ArrowLeft") {
        state.cursor.x--;
        state.cursor.visible = true;
        requestRender();
        updateStatus();
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        state.cursor.x++;
        state.cursor.visible = true;
        requestRender();
        updateStatus();
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        state.cursor.y--;
        state.cursor.visible = true;
        requestRender();
        updateStatus();
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        state.cursor.y++;
        state.cursor.visible = true;
        requestRender();
        updateStatus();
        e.preventDefault();
      } else if (e.key === "Backspace") {
        handleBackspace();
        e.preventDefault();
      } else if (e.key === "Enter") {
        handleEnter();
        e.preventDefault();
      } else if (e.key === "Escape") {
        setTool(TOOLS.SELECT);
        e.preventDefault();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTextInputChar(e.key);
        e.preventDefault();
      }
    }

    // Live update for Shift key in Zigzag preview
    if (e.key === "Shift" && state.drawingPreview) {
      state.drawingPreview.shiftKey = true;
      requestRender();
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.code === "Space") {
      state.isSpacePressed = false;
      container.style.cursor = "default";
    }
    if (e.key === "Shift" && state.drawingPreview) {
      state.drawingPreview.shiftKey = false;
      requestRender();
    }
  });

  // Global Paste Event
  window.addEventListener("paste", async (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text");
    if (!text) return;
    const target = state.tool === TOOLS.TEXT ? state.cursor : state.hoverGrid || { x: 5, y: 5 };
    pasteAsciiText(text, target.x, target.y);
  });

  /**
   * Floating Tool Panel Draggable Logic
   */
  let isDraggingPanel = false;
  let panelOffset = { x: 0, y: 0 };

  if (panelHandle && toolPanel) {
    panelHandle.addEventListener("mousedown", (e: MouseEvent) => {
      isDraggingPanel = true;
      panelOffset.x = e.clientX - toolPanel.offsetLeft;
      panelOffset.y = e.clientY - toolPanel.offsetTop;
      e.stopPropagation();
    });

    window.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDraggingPanel && toolPanel) {
        let newLeft = e.clientX - panelOffset.x;
        let newTop = e.clientY - panelOffset.y;
        // Clamp within viewport
        newLeft = Math.max(10, Math.min(window.innerWidth - toolPanel.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - toolPanel.offsetHeight - 40, newTop));
        toolPanel.style.left = `${newLeft}px`;
        toolPanel.style.top = `${newTop}px`;
      }
    });

    window.addEventListener("mouseup", () => {
      isDraggingPanel = false;
    });
  }

  /**
   * UI Button & Control Event Listeners
   */
  document.querySelectorAll<HTMLElement>(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tool) {
        setTool(btn.dataset.tool as ToolType);
      }
    });
  });

  document.getElementById("btnClear")?.addEventListener("click", () => {
    if (confirm("Clear entire ASCII canvas?")) {
      history.saveState();
      grid.clear();
      state.selection = null;
      requestRender();
      updateStatus();
      showToast("Canvas cleared");
    }
  });
  document.getElementById("btnUndo")?.addEventListener("click", () => history.undo());
  document.getElementById("btnRedo")?.addEventListener("click", () => history.redo());
  document.getElementById("btnResetView")?.addEventListener("click", resetView);

  // Window resize handler
  window.addEventListener("resize", resizeCanvas);
}

/**
 * Application Initialization
 */
export function init(): void {
  canvas = document.getElementById("ascii-canvas") as HTMLCanvasElement;
  if (canvas) {
    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }
  hiddenInput = document.getElementById("hidden-input") as HTMLTextAreaElement;
  toolPanel = document.getElementById("toolPanel") as HTMLElement;
  panelHandle = document.getElementById("panelHandle") as HTMLElement;
  stylePopover = document.getElementById("stylePopover") as HTMLElement;
  styleTriggerBtn = document.getElementById("styleTriggerBtn") as HTMLElement;
  styleCurrentPreview = document.getElementById("styleCurrentPreview") as HTMLElement;
  styleCurrentLabel = document.getElementById("styleCurrentLabel") as HTMLElement;
  styleGridList = document.getElementById("styleGridList") as HTMLElement;
  statusTool = document.getElementById("statusTool") as HTMLElement;
  statusCoords = document.getElementById("statusCoords") as HTMLElement;
  statusSelection = document.getElementById("statusSelection") as HTMLElement;
  statusZoom = document.getElementById("statusZoom") as HTMLElement;
  toastEl = document.getElementById("toast") as HTMLElement;

  measureFont();
  resizeCanvas();
  resetView();
  startCaretBlinker();
  renderStyleSelector();
  setupEventListeners();
  updateStatus();
}

// Auto bootstrap on DOM load
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
}

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
  | { type: "erase"; lastX: number; lastY: number };

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
  previewGrid: AsciiGrid | null;
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
  cursor: { x: 1, y: 1, visible: true },
  caretBlinkTimer: null,
  // Selection bounding box in grid coordinates: { x1, y1, x2, y2 } or null
  selection: null,
  // Dragging interactions state
  drag: null,
  // Line dragging state in select mode
  lineDrag: null,
  // Copy of the grid with the line drag in progress applied (rendered instead of the grid)
  previewGrid: null,
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
  // Incremented on every mutation - lets autosave know when there is something new to store
  version = 0;

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
    this.version++;
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
    this.version++;
    this.cells.delete(`${x},${y}`);
  }

  /**
   * Clears all cells from the grid
   */
  clear(): void {
    this.version++;
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
    this.version++;
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
  private undoStack: Array<Record<string, string>> = [];
  private redoStack: Array<Record<string, string>> = [];
  private maxHistory = 200;
  // True while a run of typed characters is being folded into a single undo step
  private typing = false;

  /**
   * Saves a snapshot of the current grid state
   */
  saveState(): void {
    this.typing = false;
    this.undoStack.push(grid.toJSON());
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  /**
   * Saves a snapshot only at the start of a typing run, so that a whole run
   * of keystrokes is undone in one step instead of one step per character
   */
  beginTyping(): void {
    if (this.typing) return;
    this.saveState();
    this.typing = true;
  }

  /**
   * Closes the current typing run - the next keystroke starts a new undo step
   */
  endTyping(): void {
    this.typing = false;
  }

  /**
   * Reverts to the previous snapshot
   */
  undo(): void {
    if (this.undoStack.length === 0) return;
    this.typing = false;
    this.redoStack.push(grid.toJSON());
    const previousState = this.undoStack.pop();
    grid.fromJSON(previousState || null);
    state.selection = null;
    updateStatus();
    requestRender();
    showToast("Undo");
  }

  /**
   * Re-applies the next undone snapshot
   */
  redo(): void {
    if (this.redoStack.length === 0) return;
    this.typing = false;
    this.undoStack.push(grid.toJSON());
    const nextState = this.redoStack.pop();
    grid.fromJSON(nextState || null);
    state.selection = null;
    updateStatus();
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
export function resetView(announce: boolean = true): void {
  state.zoom = 1.0;
  const bounds = grid.getBounds();
  if (bounds) {
    const centerGridX = (bounds.minX + bounds.maxX + 1) / 2;
    const centerGridY = (bounds.minY + bounds.maxY + 1) / 2;
    state.panX = Math.round(window.innerWidth / 2 - centerGridX * state.cellWidth);
    state.panY = Math.round(window.innerHeight / 2 - centerGridY * state.cellHeight);
  } else {
    // Empty canvas: origin marker sits one cell height away from the top and left window borders.
    // Cells are half as wide as they are tall, so the same distance on the left is two columns -
    // a single column (10px) looks like no margin at all.
    state.panX = state.cellHeight;
    state.panY = state.cellHeight;
  }
  updateStatus();
  requestRender();
  if (announce) showToast("Centered view");
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

/**
 * "-", "|" and "+" are everyday text characters ("--verbose", "a+b", "x | y").
 * They only behave as line characters while the Classic ASCII style is the active style,
 * otherwise typed text would be dragged, stretched and rewritten as if it were a line.
 */
const ASCII_LINE_CHARS = new Set<string>(["-", "|", "+"]);

/**
 * Gets port connection bitmask for a character
 */
export function getCharPorts(char: string): number {
  if (!char || char === " ") return 0;
  if (ASCII_LINE_CHARS.has(char) && state.style !== "ascii") return 0;
  return GLOBAL_CHAR_PORTS[char] || 0;
}

export function isAnyLineChar(char: string): boolean {
  return getCharPorts(char) !== 0;
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
 * Stroke weight of the horizontal and the vertical strokes of every style.
 * Used to pick a junction character that matches BOTH lines meeting in a cell
 * (e.g. a single horizontal line touching a double vertical one gives "╟", not "├").
 */
type StrokeKind = "light" | "heavy" | "double" | "ascii";

const STYLE_KINDS: Record<LineStyle, { h: StrokeKind; v: StrokeKind }> = {
  "box-single": { h: "light", v: "light" },
  "box-heavy": { h: "heavy", v: "heavy" },
  "box-double": { h: "double", v: "double" },
  "box-rounded": { h: "light", v: "light" },
  "box-double-h-single-v": { h: "double", v: "light" },
  "box-single-h-double-v": { h: "light", v: "double" },
  "box-heavy-h-light-v": { h: "heavy", v: "light" },
  "box-light-h-heavy-v": { h: "light", v: "heavy" },
  "box-dashed-light": { h: "light", v: "light" },
  "box-dashed-heavy": { h: "heavy", v: "heavy" },
  ascii: { h: "ascii", v: "ascii" },
};

const CHAR_KINDS: Record<string, { h?: StrokeKind; v?: StrokeKind }> = {
  "┈": { h: "light" },
  "┊": { v: "light" },
  "┉": { h: "heavy" },
  "┋": { v: "heavy" },
};

for (const [key, set] of Object.entries(BOX_SETS) as Array<[LineStyle, BoxSet]>) {
  for (let mask = 1; mask <= 15; mask++) {
    const ch = set.junctions[mask];
    if (!ch || ch === " ") continue;
    const entry = CHAR_KINDS[ch] || (CHAR_KINDS[ch] = {});
    if (mask & (DIR_LEFT | DIR_RIGHT) && !entry.h) entry.h = STYLE_KINDS[key].h;
    if (mask & (DIR_UP | DIR_DOWN) && !entry.v) entry.v = STYLE_KINDS[key].v;
  }
}

const STYLE_KEYS = Object.keys(BOX_SETS) as LineStyle[];

/**
 * Computes and updates proper junction character at (x, y) based on existing neighbor connectivity.
 * IMPORTANT: NEVER writes into empty cells ' '. Only resolves non-empty line characters!
 *
 * preferredStyle is used when it is compatible with the strokes meeting in the cell
 * (that is how rounded corners / dashed strokes are kept), otherwise a style matching
 * the weights of the horizontal and vertical strokes is looked up.
 */
export function resolveJunction(
  x: number,
  y: number,
  gridInstance: AsciiGrid = grid,
  preferredStyle?: LineStyle
): void {
  const char = gridInstance.get(x, y);
  if (!isAnyLineChar(char)) return;

  const upChar = gridInstance.get(x, y - 1);
  const rightChar = gridInstance.get(x + 1, y);
  const downChar = gridInstance.get(x, y + 1);
  const leftChar = gridInstance.get(x - 1, y);

  let mask = 0;
  if (getCharPorts(upChar) & DIR_DOWN) mask |= DIR_UP;
  if (getCharPorts(rightChar) & DIR_LEFT) mask |= DIR_RIGHT;
  if (getCharPorts(downChar) & DIR_UP) mask |= DIR_DOWN;
  if (getCharPorts(leftChar) & DIR_RIGHT) mask |= DIR_LEFT;

  // If mask is 0 (isolated point), keep original char
  if (mask === 0) return;

  const own = CHAR_KINDS[char] || {};
  const needH = (mask & (DIR_LEFT | DIR_RIGHT)) !== 0;
  const needV = (mask & (DIR_UP | DIR_DOWN)) !== 0;
  const hKind =
    own.h ||
    (mask & DIR_LEFT ? (CHAR_KINDS[leftChar] || {}).h : undefined) ||
    (mask & DIR_RIGHT ? (CHAR_KINDS[rightChar] || {}).h : undefined);
  const vKind =
    own.v ||
    (mask & DIR_UP ? (CHAR_KINDS[upChar] || {}).v : undefined) ||
    (mask & DIR_DOWN ? (CHAR_KINDS[downChar] || {}).v : undefined);

  const fits = (key: LineStyle): boolean => {
    const kinds = STYLE_KINDS[key];
    return (!needH || !hKind || kinds.h === hKind) && (!needV || !vKind || kinds.v === vKind);
  };

  const ownStyle = getCharStyle(char);
  let styleKey: LineStyle = preferredStyle || ownStyle;
  if (!fits(styleKey)) {
    styleKey = fits(ownStyle) ? ownStyle : STYLE_KEYS.find(fits) || ownStyle;
  }

  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const resolvedChar = set.junctions[mask];

  if (resolvedChar && resolvedChar !== " ") {
    gridInstance.set(x, y, resolvedChar);
  }
}

/**
 * Resolves junctions for modified points and their immediately connected neighbors.
 * forcedStyle applies only to the given points - neighbors always keep their own style.
 */
export function resolveJunctionsAround(points: Point[], gridInstance: AsciiGrid = grid, forcedStyle?: LineStyle): void {
  const own = new Set<string>();
  for (const pt of points) own.add(`${pt.x},${pt.y}`);

  const checked = new Set<string>();
  const visit = (x: number, y: number): void => {
    const key = `${x},${y}`;
    if (checked.has(key)) return;
    checked.add(key);
    resolveJunction(x, y, gridInstance, own.has(key) ? forcedStyle : undefined);
  };

  for (const pt of points) {
    visit(pt.x, pt.y);
    visit(pt.x, pt.y - 1);
    visit(pt.x + 1, pt.y);
    visit(pt.x, pt.y + 1);
    visit(pt.x - 1, pt.y);
  }
}

/**
 * Path Generators for Drawing Tools
 */

/**
 * Assigns line characters to an ordered, 4-connected list of cells:
 * straight strokes along the way and proper corners wherever the path turns.
 */
export function charsForPath(cells: Point[], set: BoxSet): CharPoint[] {
  return cells.map((c, i) => {
    let mask = 0;
    for (const n of [cells[i - 1], cells[i + 1]]) {
      if (!n) continue;
      if (n.x < c.x) mask |= DIR_LEFT;
      else if (n.x > c.x) mask |= DIR_RIGHT;
      else if (n.y < c.y) mask |= DIR_UP;
      else if (n.y > c.y) mask |= DIR_DOWN;
    }
    const char = mask === 0 ? set.h : set.junctions[mask] || set.h;
    return { x: c.x, y: c.y, char };
  });
}

/**
 * Generates straight line path between (x1, y1) and (x2, y2).
 * Diagonals are drawn as a connected staircase (every step is joined with corner characters).
 */
export function getStraightLinePath(x1: number, y1: number, x2: number, y2: number): CharPoint[] {
  const set = BOX_SETS[state.style] || BOX_SETS["box-single"];
  const cells: Point[] = [];

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  const isHorizDominant = dx >= dy;
  let err = dx - dy;
  let cx = x1;
  let cy = y1;

  cells.push({ x: cx, y: cy });
  while (cx !== x2 || cy !== y2) {
    const e2 = 2 * err;
    const stepX = e2 > -dy;
    const stepY = e2 < dx;
    if (stepX && stepY) {
      // Diagonal step: go through an elbow cell so the staircase stays connected
      if (isHorizDominant) {
        cx += sx;
        cells.push({ x: cx, y: cy });
        cy += sy;
      } else {
        cy += sy;
        cells.push({ x: cx, y: cy });
        cx += sx;
      }
      err += dx - dy;
    } else if (stepX) {
      err -= dy;
      cx += sx;
    } else {
      err += dx;
      cy += sy;
    }
    cells.push({ x: cx, y: cy });
  }

  return charsForPath(cells, set);
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
 * Line moving (select mode)
 *
 * All the logic below is written once, for a HORIZONTAL line moved up/down.
 * Vertical lines go through exactly the same code using a transposed view of the grid
 * (x and y swapped, ports mirrored accordingly).
 */
interface GridView {
  get(x: number, y: number): string;
  set(x: number, y: number, char: string): void;
  delete(x: number, y: number): void;
  ports(char: string): number;
  real(x: number, y: number): Point;
}

interface ViewSegment {
  y: number;
  startX: number;
  endX: number;
}

function transposePorts(p: number): number {
  return (
    (p & DIR_UP ? DIR_LEFT : 0) |
    (p & DIR_LEFT ? DIR_UP : 0) |
    (p & DIR_DOWN ? DIR_RIGHT : 0) |
    (p & DIR_RIGHT ? DIR_DOWN : 0)
  );
}

function makeView(g: AsciiGrid, transposed: boolean): GridView {
  if (!transposed) {
    return {
      get: (x, y) => g.get(x, y),
      set: (x, y, char) => g.set(x, y, char),
      delete: (x, y) => g.delete(x, y),
      ports: (char) => getCharPorts(char),
      real: (x, y) => ({ x, y }),
    };
  }
  return {
    get: (x, y) => g.get(y, x),
    set: (x, y, char) => g.set(y, x, char),
    delete: (x, y) => g.delete(y, x),
    ports: (char) => transposePorts(getCharPorts(char)),
    real: (x, y) => ({ x: y, y: x }),
  };
}

function toViewSegment(seg: LineSegment): ViewSegment {
  return seg.type === "horizontal"
    ? { y: seg.y, startX: seg.startX, endX: seg.endX }
    : { y: seg.x, startX: seg.startY, endX: seg.endY };
}

/**
 * Style of a line segment. Corners and junctions of rounded/dashed/mixed styles share
 * characters with the plain single style, so any non-single character on the line wins.
 */
export function segmentStyle(g: AsciiGrid, seg: LineSegment): LineStyle {
  let found: LineStyle | null = null;
  const length = seg.type === "horizontal" ? seg.endX - seg.startX : seg.endY - seg.startY;
  for (let i = 0; i <= length; i++) {
    const char = seg.type === "horizontal" ? g.get(seg.startX + i, seg.y) : g.get(seg.x, seg.startY + i);
    if (!isAnyLineChar(char)) continue;
    const style = getCharStyle(char);
    if (style !== "box-single") return style;
    found = style;
  }
  return found || state.style;
}

const connectsUp = (v: GridView, x: number, y: number): boolean => (v.ports(v.get(x, y - 1)) & DIR_DOWN) !== 0;
const connectsDown = (v: GridView, x: number, y: number): boolean => (v.ports(v.get(x, y + 1)) & DIR_UP) !== 0;

/**
 * Decides how a line is moved:
 *  - "push" (table mode): the line is a row separator of a grid - both of its ends sit on
 *    lines continuing above AND below ("├────┤"). Moving it resizes the row above it and
 *    everything below (lines and text) travels together with the line.
 *  - otherwise "stretch": only the line moves, perpendicular lines attached to it stretch/shrink.
 * For push mode `end` is the last row of the structure hanging below the line.
 */
function planLineMove(v: GridView, vs: ViewSegment): { push: boolean; end: number } {
  const stretch = { push: false, end: vs.y };
  const a = vs.startX;
  const b = vs.endX;
  if (!(connectsUp(v, a, vs.y) && connectsDown(v, a, vs.y) && connectsUp(v, b, vs.y) && connectsDown(v, b, vs.y))) {
    return stretch;
  }

  // Walk all lines connected below the separator. If any of them leaves the column range
  // of the separator, shifting just those columns would tear the drawing apart -> stretch.
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [];
  for (let x = a; x <= b; x++) {
    if (connectsDown(v, x, vs.y)) queue.push([x, vs.y + 1]);
  }
  let end = vs.y;
  const steps: Array<[number, number, number, number]> = [
    [0, -1, DIR_UP, DIR_DOWN],
    [1, 0, DIR_RIGHT, DIR_LEFT],
    [0, 1, DIR_DOWN, DIR_UP],
    [-1, 0, DIR_LEFT, DIR_RIGHT],
  ];
  while (queue.length) {
    const [x, y] = queue.pop() as [number, number];
    if (y <= vs.y) continue;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (x < a || x > b || seen.size > 50000) return stretch;
    if (y > end) end = y;
    const p = v.ports(v.get(x, y));
    for (const [sx, sy, bit, opposite] of steps) {
      if (p & bit && v.ports(v.get(x + sx, y + sy)) & opposite) queue.push([x + sx, y + sy]);
    }
  }
  return { push: true, end };
}

/**
 * Limits how far a line may be moved, so that moving it never destroys anything:
 *  - push mode, shrinking the row above: only rows holding nothing but vertical strokes can go
 *  - stretch mode: no limit at all
 */
function clampLineMove(v: GridView, vs: ViewSegment, delta: number, push: boolean): number {
  if (delta === 0) return 0;
  const dir = delta > 0 ? 1 : -1;
  let limit = Math.abs(delta);

  if (push) {
    if (dir > 0) return delta;
    let removable = 0;
    while (removable < limit) {
      const row = vs.y - 1 - removable;
      let ok = true;
      for (let x = vs.startX; x <= vs.endX && ok; x++) {
        const char = v.get(x, row);
        if (char === " ") continue;
        const p = v.ports(char);
        if (p === 0 || p & (DIR_LEFT | DIR_RIGHT)) ok = false;
      }
      if (!ok) break;
      removable++;
    }
    return -removable;
  }

  // Stretch mode is never limited: perpendicular lines keep their far end where it is
  // and simply get longer, shorter or flip to the other side of the moved line
  return delta;
}

/**
 * Returns the distance a line can really be moved by (see clampLineMove)
 */
export function clampLineDrag(seg: LineSegment, delta: number, duplicate: boolean, g: AsciiGrid = grid): number {
  if (duplicate || delta === 0) return delta;
  const v = makeView(g, seg.type === "vertical");
  const vs = toViewSegment(seg);
  return clampLineMove(v, vs, delta, planLineMove(v, vs).push);
}

/**
 * Moves a line segment by delta cells perpendicular to its direction
 * (horizontal lines up/down, vertical lines left/right) inside the given grid.
 * If duplicate is true, the original line is preserved and a new row/column is pulled out of it.
 * Does not touch history - callers decide when to snapshot.
 */
export function applyLineMove(g: AsciiGrid, seg: LineSegment, delta: number, duplicate: boolean = false): void {
  if (delta === 0) return;
  const transposed = seg.type === "vertical";
  const v = makeView(g, transposed);
  const vs = toViewSegment(seg);
  const a = vs.startX;
  const b = vs.endX;
  const y0 = vs.y;

  const styleKey = segmentStyle(g, seg);
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const along = transposed ? set.v : set.h;
  const perp = transposed ? set.h : set.v;
  // Reuse the stroke of the perpendicular line being prolonged when there is one
  const perpChar = (x: number, y: number): string => {
    const char = v.get(x, y);
    return v.ports(char) === (DIR_UP | DIR_DOWN) ? char : perp;
  };

  const forced: Point[] = [];
  const touched: Point[] = [];

  if (duplicate) {
    const newY = y0 + delta;
    const lo = Math.min(y0, newY);
    const hi = Math.max(y0, newY);
    for (let x = a; x <= b; x++) {
      const cur = v.ports(v.get(x, y0));
      if (connectsUp(v, x, y0) || connectsDown(v, x, y0) || x === a || x === b || cur & (DIR_UP | DIR_DOWN)) {
        for (let y = lo + 1; y < hi; y++) {
          v.set(x, y, perp);
          forced.push(v.real(x, y));
        }
      }
    }
    for (let x = a; x <= b; x++) {
      v.set(x, newY, along);
      forced.push(v.real(x, newY));
      touched.push(v.real(x, y0));
    }
    resolveJunctionsAround(forced, g, styleKey);
    resolveJunctionsAround(touched, g);
    return;
  }

  const plan = planLineMove(v, vs);
  delta = clampLineMove(v, vs, delta, plan.push);
  if (delta === 0) return;
  const newY = y0 + delta;
  const lo = Math.min(y0, newY);
  const hi = Math.max(y0, newY);

  const conns: Array<{ x: number; up: boolean; down: boolean; upChar: string; downChar: string }> = [];
  for (let x = a; x <= b; x++) {
    const up = connectsUp(v, x, y0);
    const down = connectsDown(v, x, y0);
    if (up || down) conns.push({ x, up, down, upChar: perpChar(x, y0 - 1), downChar: perpChar(x, y0 + 1) });
  }

  if (plan.push) {
    // Table mode: the line and everything below it (within its columns) travels together
    let end = plan.end;
    if (delta > 0) {
      // Whatever sits right below the structure is pushed as well, up to the first gap big enough
      const bounds = g.getBounds();
      const last = bounds ? (transposed ? bounds.maxX : bounds.maxY) : end;
      let emptyRows = 0;
      for (let y = end + 1; y <= last && emptyRows < delta; y++) {
        let empty = true;
        for (let x = a; x <= b && empty; x++) {
          if (v.get(x, y) !== " ") empty = false;
        }
        if (empty) {
          emptyRows++;
        } else {
          end = y;
          emptyRows = 0;
        }
      }
    }

    const block: Array<{ x: number; y: number; char: string }> = [];
    for (let y = y0; y <= end; y++) {
      for (let x = a; x <= b; x++) {
        const char = v.get(x, y);
        if (char !== " ") block.push({ x, y, char });
      }
    }
    for (const cell of block) v.delete(cell.x, cell.y);
    if (delta < 0) {
      for (let y = newY; y < y0; y++) {
        for (let x = a; x <= b; x++) v.delete(x, y);
      }
    }
    for (const cell of block) v.set(cell.x, cell.y + delta, cell.char);
    if (delta > 0) {
      for (const conn of conns) {
        if (!conn.up) continue;
        for (let y = y0; y < newY; y++) v.set(conn.x, y, conn.upChar);
      }
    }
    for (let y = lo - 1; y <= hi + 1; y++) {
      for (let x = a; x <= b; x++) touched.push(v.real(x, y));
    }
    resolveJunctionsAround(touched, g);
    return;
  }

  // Stretch mode: only the line moves. Every perpendicular line attached to it keeps its far end
  // (next corner/junction, or its loose end) exactly where it is and is redrawn between that
  // far end and the new position of the line - so it gets longer, shorter, or flips to the
  // other side when the line is dragged past the far end. Nothing ever locks the line.
  const links: Array<{ x: number; far: number; junction: boolean; char: string }> = [];
  for (const conn of conns) {
    for (const dir of [-1, 1]) {
      if (dir < 0 ? !conn.up : !conn.down) continue;
      const toward = dir > 0 ? DIR_DOWN : DIR_UP;
      const back = dir > 0 ? DIR_UP : DIR_DOWN;
      let y = y0 + dir;
      let junction = false;
      while (true) {
        const p = v.ports(v.get(conn.x, y));
        if (p & (DIR_LEFT | DIR_RIGHT)) {
          junction = true;
          break;
        }
        if (!(p & toward) || !(v.ports(v.get(conn.x, y + dir)) & back)) break;
        y += dir;
      }
      links.push({ x: conn.x, far: y, junction, char: dir < 0 ? conn.upChar : conn.downChar });
    }
  }

  const lineChars: string[] = [];
  for (let x = a; x <= b; x++) {
    lineChars.push(v.get(x, y0));
    v.delete(x, y0);
    touched.push(v.real(x, y0));
  }

  // Remove the plain strokes of every attached perpendicular line (its far corner/junction stays)
  for (const link of links) {
    const dir = link.far > y0 ? 1 : -1;
    const last = link.junction ? link.far - dir : link.far;
    for (let y = y0 + dir; dir > 0 ? y <= last : y >= last; y += dir) v.delete(link.x, y);
  }

  for (let x = a; x <= b; x++) {
    v.set(x, newY, lineChars[x - a]);
    forced.push(v.real(x, newY));
  }

  // Redraw every perpendicular line between the moved line and its far end
  for (const link of links) {
    if (link.far !== newY) {
      const dir = link.far > newY ? 1 : -1;
      const last = link.junction ? link.far - dir : link.far;
      for (let y = newY + dir; dir > 0 ? y <= last : y >= last; y += dir) v.set(link.x, y, link.char);
    }
    const from = Math.min(y0, newY, link.far) - 1;
    const to = Math.max(y0, newY, link.far) + 1;
    for (let y = from; y <= to; y++) touched.push(v.real(link.x, y));
  }

  resolveJunctionsAround(forced, g, styleKey);
  resolveJunctionsAround(touched, g);
}

/**
 * Applies the line drag described by `ld` (move or prolong/shorten) to the given grid.
 * Used both for the live preview (on a clone) and for the final commit.
 */
export function applyLineDragTo(g: AsciiGrid, ld: LineDragState): void {
  const seg = ld.segment;
  if (ld.mode === "shift") {
    applyLineMove(g, seg, seg.type === "horizontal" ? ld.dy : ld.dx, !!ld.duplicate);
  } else if (seg.type === "horizontal") {
    applyHorizontalLineExtend(
      g,
      seg,
      ld.newStartX !== undefined ? ld.newStartX : seg.startX,
      ld.newEndX !== undefined ? ld.newEndX : seg.endX
    );
  } else {
    applyVerticalLineExtend(
      g,
      seg,
      ld.newStartY !== undefined ? ld.newStartY : seg.startY,
      ld.newEndY !== undefined ? ld.newEndY : seg.endY
    );
  }
}

export function isLineDragNoop(ld: LineDragState): boolean {
  const seg = ld.segment;
  if (ld.mode === "shift") return (seg.type === "horizontal" ? ld.dy : ld.dx) === 0;
  if (seg.type === "horizontal") {
    return (
      (ld.newStartX === undefined || ld.newStartX === seg.startX) &&
      (ld.newEndX === undefined || ld.newEndX === seg.endX)
    );
  }
  return (
    (ld.newStartY === undefined || ld.newStartY === seg.startY) && (ld.newEndY === undefined || ld.newEndY === seg.endY)
  );
}

/**
 * Executes prolonging or shortening of a horizontal line from either endpoint (no history snapshot)
 */
export function applyHorizontalLineExtend(
  g: AsciiGrid,
  segment: HorizontalSegment,
  newStartX: number,
  newEndX: number
): void {
  if (newStartX === segment.startX && newEndX === segment.endX) return;

  const y = segment.y;
  const styleKey = segmentStyle(g, segment);
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const affectedPoints: Point[] = [];

  // Handle startX modification (left side)
  if (newStartX < segment.startX) {
    // Extend left
    for (let x = newStartX; x < segment.startX; x++) {
      g.set(x, y, set.h);
      affectedPoints.push({ x, y });
    }
  } else if (newStartX > segment.startX) {
    // Shrink from left
    for (let x = segment.startX; x < newStartX; x++) {
      const cur = g.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_UP | DIR_DOWN)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        g.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Handle endX modification (right side)
  if (newEndX > segment.endX) {
    // Extend right
    for (let x = segment.endX + 1; x <= newEndX; x++) {
      g.set(x, y, set.h);
      affectedPoints.push({ x, y });
    }
  } else if (newEndX < segment.endX) {
    // Shrink from right
    for (let x = newEndX + 1; x <= segment.endX; x++) {
      const cur = g.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_UP | DIR_DOWN)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        g.delete(x, y);
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

  resolveJunctionsAround(affectedPoints, g);
}

/**
 * Executes prolonging or shortening of a vertical line from either endpoint
 */
export function applyVerticalLineExtend(
  g: AsciiGrid,
  segment: VerticalSegment,
  newStartY: number,
  newEndY: number
): void {
  if (newStartY === segment.startY && newEndY === segment.endY) return;

  const x = segment.x;
  const styleKey = segmentStyle(g, segment);
  const set = BOX_SETS[styleKey] || BOX_SETS["box-single"];
  const affectedPoints: Point[] = [];

  // Handle startY modification (top side)
  if (newStartY < segment.startY) {
    // Extend up
    for (let y = newStartY; y < segment.startY; y++) {
      g.set(x, y, set.v);
      affectedPoints.push({ x, y });
    }
  } else if (newStartY > segment.startY) {
    // Shrink from top
    for (let y = segment.startY; y < newStartY; y++) {
      const cur = g.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_LEFT | DIR_RIGHT)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        g.delete(x, y);
        affectedPoints.push({ x, y });
      }
    }
  }

  // Handle endY modification (bottom side)
  if (newEndY > segment.endY) {
    // Extend down
    for (let y = segment.endY + 1; y <= newEndY; y++) {
      g.set(x, y, set.v);
      affectedPoints.push({ x, y });
    }
  } else if (newEndY < segment.endY) {
    // Shrink from bottom
    for (let y = newEndY + 1; y <= segment.endY; y++) {
      const cur = g.get(x, y);
      const ports = getCharPorts(cur);
      if ((ports & (DIR_LEFT | DIR_RIGHT)) !== 0) {
        affectedPoints.push({ x, y });
      } else {
        g.delete(x, y);
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

  resolveJunctionsAround(affectedPoints, g);
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
      hiddenInput.value = "";
      if (state.tool !== TOOLS.TEXT) hiddenInput.blur();
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

  const lines = text.replace(/\t/g, "    ").split(/\r?\n/);
  let maxLineLen = 0;

  for (let r = 0; r < lines.length; r++) {
    // Array.from iterates by code point, so emoji & co. land in one cell instead of two broken halves
    const chars = Array.from(lines[r]);
    if (chars.length > maxLineLen) maxLineLen = chars.length;
    for (let c = 0; c < chars.length; c++) {
      grid.set(targetX + c, targetY + r, chars[c]);
    }
  }

  if (state.tool === TOOLS.TEXT) {
    // Keep typing right after the pasted text
    state.cursor.x = targetX + Array.from(lines[lines.length - 1]).length;
    state.cursor.y = targetY + lines.length - 1;
    state.cursor.visible = true;
  } else if (state.tool === TOOLS.SELECT) {
    // Set selection around the pasted content
    state.selection = {
      x1: targetX,
      y1: targetY,
      x2: targetX + Math.max(maxLineLen, 1) - 1,
      y2: targetY + lines.length - 1,
    };
  }

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

// Column where the current line of text was started - Enter returns the caret there
let textLineStartX = 1;

export function setTextCursor(x: number, y: number): void {
  state.cursor.x = x;
  state.cursor.y = y;
  state.cursor.visible = true;
  textLineStartX = x;
  history.endTyping();
}

export function handleTextInputChar(char: string): void {
  history.beginTyping();
  grid.set(state.cursor.x, state.cursor.y, char);
  state.cursor.x++;
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function handleBackspace(): void {
  history.beginTyping();
  state.cursor.x--;
  grid.delete(state.cursor.x, state.cursor.y);
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function handleDeleteKey(): void {
  history.beginTyping();
  grid.delete(state.cursor.x, state.cursor.y);
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function handleEnter(): void {
  history.endTyping();
  state.cursor.x = textLineStartX;
  state.cursor.y++;
  state.cursor.visible = true;
  requestRender();
  updateStatus();
}

export function moveTextCursor(dx: number, dy: number): void {
  history.endTyping();
  state.cursor.x += dx;
  state.cursor.y += dy;
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
  history.endTyping();
  if (hiddenInput) {
    hiddenInput.value = "";
    if (toolName === TOOLS.TEXT) hiddenInput.focus();
    else hiddenInput.blur();
  }
  if (toolName === TOOLS.TEXT) {
    setTextCursor(state.cursor.x, state.cursor.y);
  }
  updateStatus();
  requestRender();
}

/**
 * Select Line Style & Update Popover / Panel UI
 */
export function selectStyle(styleKey: LineStyle, silent: boolean = false): void {
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
  if (!silent) {
    scheduleSave();
    showToast(`Style: ${set.name}`);
  }
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

  // Every change of the drawing ends up here - good place to notice there is something to autosave
  if (grid.version !== savedVersion && !saveTimer) scheduleSave();

  // While a line is being dragged, the preview copy of the grid is shown instead of the real one
  const g = state.previewGrid || grid;

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
      const char = g.get(gx, gy);
      if (char !== " ") {
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
 * Persistence: the drawing is autosaved to localStorage, so a refresh does not lose it
 */
const STORAGE_KEY = "ascii-editor:v1";
let savedVersion = 0;
let saveTimer: any = null;

export function saveToStorage(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  savedVersion = grid.version;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cells: grid.toJSON(), style: state.style }));
  } catch (err) {
    // storage unavailable or full - the editor keeps working without persistence
  }
}

export function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToStorage, 400);
}

export function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && data.cells && typeof data.cells === "object") {
      const cells: Record<string, string> = {};
      for (const key of Object.keys(data.cells)) {
        if (/^-?\d+,-?\d+$/.test(key) && typeof data.cells[key] === "string") cells[key] = data.cells[key];
      }
      grid.fromJSON(cells);
    }
    if (data && typeof data.style === "string" && BOX_SETS[data.style as LineStyle]) {
      selectStyle(data.style as LineStyle, true);
    }
  } catch (err) {
    // corrupted entry - start with an empty canvas
  }
  savedVersion = grid.version;
}

/**
 * Selection block helpers
 */
type BlockCell = { relX: number; relY: number; char: string };

export function selectionBounds(sel: SelectionRect): Bounds {
  return {
    minX: Math.min(sel.x1, sel.x2),
    maxX: Math.max(sel.x1, sel.x2),
    minY: Math.min(sel.y1, sel.y2),
    maxY: Math.max(sel.y1, sel.y2),
  };
}

export function captureCells(bounds: Bounds): BlockCell[] {
  const cells: BlockCell[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      cells.push({ relX: x - bounds.minX, relY: y - bounds.minY, char: grid.get(x, y) });
    }
  }
  return cells;
}

/**
 * Moves (or duplicates) a captured block by (dx, dy), re-resolves the junctions
 * around both the old and the new location and moves the selection with it
 */
export function moveCells(bounds: Bounds, cells: BlockCell[], dx: number, dy: number, duplicate: boolean): void {
  if (dx === 0 && dy === 0) return;
  history.saveState();
  const touched: Point[] = [];
  if (!duplicate) {
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        grid.delete(x, y);
        touched.push({ x, y });
      }
    }
  }
  for (const item of cells) {
    if (item.char === " ") continue;
    const x = bounds.minX + dx + item.relX;
    const y = bounds.minY + dy + item.relY;
    grid.set(x, y, item.char);
    touched.push({ x, y });
  }
  resolveJunctionsAround(touched);
  state.selection = {
    x1: bounds.minX + dx,
    y1: bounds.minY + dy,
    x2: bounds.maxX + dx,
    y2: bounds.maxY + dy,
  };
}

/**
 * Erases every cell on the way from (x1, y1) to (x2, y2), so fast mouse moves leave no gaps,
 * and tidies up the junctions of the lines that were cut
 */
export function eraseBetween(x1: number, y1: number, x2: number, y2: number): void {
  const points: Point[] = [];
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let cx = x1;
  let cy = y1;
  while (true) {
    grid.delete(cx, cy);
    points.push({ x: cx, y: cy });
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
  resolveJunctionsAround(points);
}

/**
 * Aborts whatever drag is in progress (drawing, selecting, moving, line dragging, panning)
 * without changing the drawing. Returns true when there was something to cancel.
 */
export function cancelDrag(): boolean {
  if (!state.drag && !state.drawingPreview && !state.isPanning) return false;
  const drag = state.drag;
  if (drag && drag.type === "move_selection") {
    state.selection = { x1: drag.initialX1, y1: drag.initialY1, x2: drag.initialX2, y2: drag.initialY2 };
  } else if (drag && drag.type === "create_selection") {
    state.selection = null;
  }
  state.drag = null;
  state.lineDrag = null;
  state.previewGrid = null;
  state.drawingPreview = null;
  state.isPanning = false;
  updateStatus();
  requestRender();
  return true;
}

/**
 * Recomputes the line drag (what is dragged, how far) and its live preview
 */
function updateLineDrag(drag: Extract<DragState, { type: "drag_line" }>, gridPos: Point, alt: boolean): void {
  const dx = gridPos.x - drag.startX;
  const dy = gridPos.y - drag.startY;
  const { hSeg, vSeg } = drag;

  const shift = (segment: LineSegment, delta: number, duplicate: boolean): LineDragState => {
    const d = clampLineDrag(segment, delta, duplicate);
    return segment.type === "horizontal"
      ? { segment, mode: "shift", dx: 0, dy: d, duplicate }
      : { segment, mode: "shift", dx: d, dy: 0, duplicate };
  };
  const extendH = (seg: HorizontalSegment): LineDragState =>
    drag.startX <= (seg.startX + seg.endX) / 2
      ? { segment: seg, mode: "extend_start", dx, dy: 0, newStartX: Math.min(seg.endX, seg.startX + dx) }
      : { segment: seg, mode: "extend_end", dx, dy: 0, newEndX: Math.max(seg.startX, seg.endX + dx) };
  const extendV = (seg: VerticalSegment): LineDragState =>
    drag.startY <= (seg.startY + seg.endY) / 2
      ? { segment: seg, mode: "extend_start", dx: 0, dy, newStartY: Math.min(seg.endY, seg.startY + dy) }
      : { segment: seg, mode: "extend_end", dx: 0, dy, newEndY: Math.max(seg.startY, seg.endY + dy) };

  let ld: LineDragState | null = null;
  if (hSeg && vSeg) {
    // Corner or junction clicked
    if (alt) ld = Math.abs(dy) >= Math.abs(dx) ? shift(hSeg, dy, true) : shift(vSeg, dx, true);
    else ld = Math.abs(dx) >= Math.abs(dy) ? extendH(hSeg) : extendV(vSeg);
  } else if (hSeg) {
    if (alt) ld = shift(hSeg, dy, true);
    else ld = Math.abs(dx) >= Math.abs(dy) ? extendH(hSeg) : shift(hSeg, dy, false);
  } else if (vSeg) {
    if (alt) ld = shift(vSeg, dx, true);
    else ld = Math.abs(dy) >= Math.abs(dx) ? extendV(vSeg) : shift(vSeg, dx, false);
  }

  state.lineDrag = ld;
  if (ld && !isLineDragNoop(ld)) {
    // The preview is the real operation applied to a copy of the grid,
    // so what is shown while dragging is exactly what gets committed on release
    const preview = grid.clone();
    applyLineDragTo(preview, ld);
    state.previewGrid = preview;
  } else {
    state.previewGrid = null;
  }
}

/**
 * Setup All Event Listeners on Initialization
 */
export function setupEventListeners(): void {
  const container = document.getElementById("canvas-container");
  if (!container) return;

  let lastPointer = { x: 0, y: 0 };

  const updateHoverCursor = (gridPos: Point): void => {
    if (state.isSpacePressed) {
      container.style.cursor = "grab";
    } else if (state.tool === TOOLS.SELECT) {
      if (state.selection) {
        container.style.cursor = isInsideSelection(gridPos.x, gridPos.y) ? "move" : "default";
      } else {
        const hSeg = findHorizontalSegment(gridPos.x, gridPos.y);
        const vSeg = findVerticalSegment(gridPos.x, gridPos.y);
        if (hSeg && vSeg) container.style.cursor = "move";
        else if (hSeg) container.style.cursor = "ns-resize";
        else if (vSeg) container.style.cursor = "ew-resize";
        else container.style.cursor = "default";
      }
    } else if (state.tool === TOOLS.TEXT) {
      container.style.cursor = "text";
    } else {
      container.style.cursor = "crosshair";
    }
  };

  // Keeps keyboard focus where we put it (hidden input in text mode) and stops middle-click autoscroll
  container.addEventListener("mousedown", (e: MouseEvent) => e.preventDefault());

  // Pointer Move Handler (pointer is captured while dragging, so moves keep coming
  // even when the pointer travels over the tool panel / status bar or leaves the window)
  container.addEventListener("pointermove", (e: PointerEvent) => {
    lastPointer = { x: e.clientX, y: e.clientY };
    const gridPos = screenToGrid(e.clientX, e.clientY);
    state.hoverGrid = gridPos;
    updateStatus();

    // Panning drag
    if (state.isPanning) {
      state.panX = state.panStart.initialPanX + (e.clientX - state.panStart.x);
      state.panY = state.panStart.initialPanY + (e.clientY - state.panStart.y);
      requestRender();
      return;
    }

    const drag = state.drag;
    if (!drag) {
      updateHoverCursor(gridPos);
      requestRender();
      return;
    }

    if (drag.type === "create_selection") {
      state.selection = { x1: drag.startX, y1: drag.startY, x2: gridPos.x, y2: gridPos.y };
      updateStatus();
    } else if (drag.type === "move_selection") {
      const dx = gridPos.x - drag.startX;
      const dy = gridPos.y - drag.startY;
      drag.duplicate = e.altKey;
      state.selection = {
        x1: drag.initialX1 + dx,
        y1: drag.initialY1 + dy,
        x2: drag.initialX2 + dx,
        y2: drag.initialY2 + dy,
      };
    } else if (drag.type === "drag_line") {
      updateLineDrag(drag, gridPos, e.altKey);
    } else if (drag.type === "draw") {
      state.drawingPreview = {
        tool: state.tool,
        startX: drag.startX,
        startY: drag.startY,
        currentX: gridPos.x,
        currentY: gridPos.y,
        shiftKey: e.shiftKey,
      };
    } else if (drag.type === "erase") {
      eraseBetween(drag.lastX, drag.lastY, gridPos.x, gridPos.y);
      drag.lastX = gridPos.x;
      drag.lastY = gridPos.y;
    }
    requestRender();
  });

  // Pointer Down Handler
  container.addEventListener("pointerdown", (e: PointerEvent) => {
    lastPointer = { x: e.clientX, y: e.clientY };

    // A panel button must never keep keyboard focus while working on the canvas,
    // otherwise Space / Enter would "click" it again
    if (state.tool === TOOLS.TEXT && hiddenInput) {
      hiddenInput.focus();
    } else if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    const startPan = e.button === 1 || (e.button === 0 && state.isSpacePressed);
    if (!startPan && e.button !== 0) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch (err) {}

    // Middle click or Space + Left click initiates panning
    if (startPan) {
      state.isPanning = true;
      state.panStart = { x: e.clientX, y: e.clientY, initialPanX: state.panX, initialPanY: state.panY };
      container.style.cursor = "grabbing";
      return;
    }

    const gridPos = screenToGrid(e.clientX, e.clientY);
    state.hoverGrid = gridPos;

    if (state.tool === TOOLS.SELECT) {
      if (state.selection && isInsideSelection(gridPos.x, gridPos.y)) {
        // Start moving (or copying with Alt) existing selection block
        const bounds = selectionBounds(state.selection);
        state.drag = {
          type: "move_selection",
          startX: gridPos.x,
          startY: gridPos.y,
          initialX1: bounds.minX,
          initialY1: bounds.minY,
          initialX2: bounds.maxX,
          initialY2: bounds.maxY,
          cells: captureCells(bounds),
          duplicate: e.altKey,
        };
      } else if (state.selection) {
        // Clicked outside existing selection -> clear selection and start creating a new selection
        state.selection = null;
        state.drag = { type: "create_selection", startX: gridPos.x, startY: gridPos.y };
      } else {
        // No active selection: detect lines for table/line editing, or create selection
        const hSeg = findHorizontalSegment(gridPos.x, gridPos.y);
        const vSeg = findVerticalSegment(gridPos.x, gridPos.y);
        const line = detectLineAt(gridPos.x, gridPos.y);
        if (line) {
          state.drag = { type: "drag_line", segment: line, hSeg, vSeg, startX: gridPos.x, startY: gridPos.y };
        } else {
          state.drag = { type: "create_selection", startX: gridPos.x, startY: gridPos.y };
        }
      }
    } else if (state.tool === TOOLS.TEXT) {
      setTextCursor(gridPos.x, gridPos.y);
    } else if (state.tool === TOOLS.ERASER) {
      history.saveState();
      eraseBetween(gridPos.x, gridPos.y, gridPos.x, gridPos.y);
      state.drag = { type: "erase", lastX: gridPos.x, lastY: gridPos.y };
    } else {
      // Line, Zigzag, Rect drawing tools
      state.drag = { type: "draw", startX: gridPos.x, startY: gridPos.y };
      state.drawingPreview = {
        tool: state.tool,
        startX: gridPos.x,
        startY: gridPos.y,
        currentX: gridPos.x,
        currentY: gridPos.y,
        shiftKey: e.shiftKey,
      };
    }
    updateStatus();
    requestRender();
  });

  // Pointer Up Handler
  container.addEventListener("pointerup", (e: PointerEvent) => {
    if (state.isPanning) {
      state.isPanning = false;
      container.style.cursor = state.isSpacePressed ? "grab" : "default";
    }

    const drag = state.drag;
    if (!drag) return;
    const gridPos = screenToGrid(e.clientX, e.clientY);

    if (drag.type === "drag_line") {
      if (state.previewGrid) {
        history.saveState();
        grid.fromJSON(state.previewGrid.toJSON());
      }
      state.lineDrag = null;
      state.previewGrid = null;
    } else if (drag.type === "move_selection") {
      moveCells(
        { minX: drag.initialX1, minY: drag.initialY1, maxX: drag.initialX2, maxY: drag.initialY2 },
        drag.cells,
        gridPos.x - drag.startX,
        gridPos.y - drag.startY,
        !!drag.duplicate
      );
    } else if (drag.type === "draw") {
      // A plain click (no movement) draws nothing - no stray single characters
      if (gridPos.x !== drag.startX || gridPos.y !== drag.startY) {
        let points: CharPoint[] = [];
        if (state.tool === TOOLS.ZIGZAG) {
          points = getZigzagPath(drag.startX, drag.startY, gridPos.x, gridPos.y, e.shiftKey);
        } else if (state.tool === TOOLS.LINE) {
          points = getStraightLinePath(drag.startX, drag.startY, gridPos.x, gridPos.y);
        } else if (state.tool === TOOLS.RECT) {
          points = getRectanglePath(drag.startX, drag.startY, gridPos.x, gridPos.y);
        }
        if (points.length) {
          history.saveState();
          for (const pt of points) {
            grid.set(pt.x, pt.y, pt.char || "─");
          }
          // Resolve junctions for all newly drawn points and connected neighbors
          resolveJunctionsAround(points, grid, state.style);
        }
      }
      state.drawingPreview = null;
    }

    state.drag = null;
    requestRender();
    updateStatus();
  });

  container.addEventListener("pointercancel", () => {
    cancelDrag();
  });

  // Mouse Wheel Zoom and Pan
  container.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom anchored at the exact (fractional) grid position under the pointer
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(state.zoom * zoomFactor, 0.4), 3.0);
        const anchorX = (e.clientX - state.panX) / (state.cellWidth * state.zoom);
        const anchorY = (e.clientY - state.panY) / (state.cellHeight * state.zoom);
        state.zoom = newZoom;
        state.panX = e.clientX - anchorX * state.cellWidth * newZoom;
        state.panY = e.clientY - anchorY * state.cellHeight * newZoom;
      } else {
        // Pan
        state.panX -= e.deltaX;
        state.panY -= e.deltaY;
      }
      state.hoverGrid = screenToGrid(e.clientX, e.clientY);
      updateStatus();
      requestRender();
    },
    { passive: false }
  );

  /**
   * Text typing goes through the hidden textarea, so everything the keyboard layout / IME
   * can produce works (Option/AltGr letters like ą ę ł, dead keys, composition, emoji picker)
   */
  const flushHiddenInput = (): void => {
    if (!hiddenInput) return;
    const text = hiddenInput.value;
    hiddenInput.value = "";
    if (!text || state.tool !== TOOLS.TEXT) return;
    for (const char of Array.from(text)) {
      if (char === "\n" || char === "\r") handleEnter();
      else if (char === "\t") continue;
      else handleTextInputChar(char);
    }
  };
  if (hiddenInput) {
    hiddenInput.addEventListener("input", (e: Event) => {
      if ((e as InputEvent).isComposing) return;
      flushHiddenInput();
    });
    hiddenInput.addEventListener("compositionend", () => flushHiddenInput());
  }

  const nudgeSelection = (dx: number, dy: number): void => {
    if (!state.selection) return;
    const bounds = selectionBounds(state.selection);
    moveCells(bounds, captureCells(bounds), dx, dy, false);
    updateStatus();
    requestRender();
  };

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // Live update for Shift key in Zigzag preview
    if (e.key === "Shift" && state.drawingPreview) {
      state.drawingPreview.shiftKey = true;
      requestRender();
    }

    // Escape aborts any drag in progress before doing anything else
    if (e.key === "Escape" && cancelDrag()) {
      e.preventDefault();
      return;
    }

    // Shortcuts with Ctrl / Cmd. Everything else with Ctrl / Cmd belongs to the browser
    // and must never fall through to the single-letter tool shortcuts below.
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (key === "y") {
        e.preventDefault();
        history.redo();
      } else if (key === "c") {
        e.preventDefault();
        copySelectionToClipboard();
      } else if (key === "x") {
        e.preventDefault();
        cutSelectionToClipboard();
      }
      return;
    }

    if (state.tool === TOOLS.TEXT) {
      // Printable characters are not handled here: they land in the hidden textarea ("input" event)
      if (e.isComposing) return;
      if (hiddenInput && document.activeElement !== hiddenInput) hiddenInput.focus();
      switch (e.key) {
        case "ArrowLeft":
          moveTextCursor(-1, 0);
          break;
        case "ArrowRight":
          moveTextCursor(1, 0);
          break;
        case "ArrowUp":
          moveTextCursor(0, -1);
          break;
        case "ArrowDown":
          moveTextCursor(0, 1);
          break;
        case "Backspace":
          handleBackspace();
          break;
        case "Delete":
          handleDeleteKey();
          break;
        case "Enter":
          handleEnter();
          break;
        case "Escape":
          setTool(TOOLS.SELECT);
          break;
        case "Tab":
          break;
        default:
          return;
      }
      e.preventDefault();
      return;
    }

    // Space key for panning (never let it activate a focused button or scroll)
    if (e.code === "Space") {
      e.preventDefault();
      if (!state.isSpacePressed) {
        state.isSpacePressed = true;
        if (!state.isPanning) container.style.cursor = "grab";
        requestRender();
      }
      return;
    }

    if (e.altKey) return;

    // Tool Shortcuts (when not actively typing text)
    switch (e.key.toLowerCase()) {
      case "v":
        setTool(TOOLS.SELECT);
        break;
      case "t":
        setTool(TOOLS.TEXT);
        // do not let this very keystroke be typed into the freshly focused hidden input
        e.preventDefault();
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
        updateStatus();
        requestRender();
        break;
      case "arrowleft":
      case "arrowright":
      case "arrowup":
      case "arrowdown":
        if (state.tool === TOOLS.SELECT && state.selection) {
          e.preventDefault();
          const key = e.key.toLowerCase();
          nudgeSelection(
            key === "arrowleft" ? -1 : key === "arrowright" ? 1 : 0,
            key === "arrowup" ? -1 : key === "arrowdown" ? 1 : 0
          );
        }
        break;
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.code === "Space" && state.tool !== TOOLS.TEXT) {
      // Buttons are activated by Space on keyup - prevent that as well
      e.preventDefault();
      state.isSpacePressed = false;
      if (!state.isPanning) updateHoverCursor(state.hoverGrid);
      requestRender();
    }
    if (e.key === "Shift" && state.drawingPreview) {
      state.drawingPreview.shiftKey = false;
      requestRender();
    }
  });

  // Keys released while the window is not focused never send keyup - do not leave Space "stuck"
  window.addEventListener("blur", () => {
    state.isSpacePressed = false;
    if (state.isPanning) {
      state.isPanning = false;
    }
    container.style.cursor = "default";
    requestRender();
  });

  // Global Paste Event
  window.addEventListener("paste", (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text");
    if (!text) return;
    const target = state.tool === TOOLS.TEXT ? state.cursor : state.hoverGrid;
    pasteAsciiText(text, target.x, target.y);
  });

  /**
   * Floating Tool Panel Draggable Logic
   */
  const clampPanel = (left: number, top: number): void => {
    if (!toolPanel) return;
    const maxLeft = Math.max(10, window.innerWidth - toolPanel.offsetWidth - 10);
    const maxTop = Math.max(10, window.innerHeight - toolPanel.offsetHeight - 40);
    toolPanel.style.left = `${Math.max(10, Math.min(maxLeft, left))}px`;
    toolPanel.style.top = `${Math.max(10, Math.min(maxTop, top))}px`;
    toolPanel.style.bottom = "auto";
  };

  if (panelHandle && toolPanel) {
    let panelDrag: { x: number; y: number } | null = null;

    panelHandle.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      panelDrag = { x: e.clientX - toolPanel.offsetLeft, y: e.clientY - toolPanel.offsetTop };
      try {
        panelHandle.setPointerCapture(e.pointerId);
      } catch (err) {}
      e.preventDefault();
    });
    panelHandle.addEventListener("pointermove", (e: PointerEvent) => {
      if (panelDrag) clampPanel(e.clientX - panelDrag.x, e.clientY - panelDrag.y);
    });
    const stopPanelDrag = (): void => {
      panelDrag = null;
    };
    panelHandle.addEventListener("pointerup", stopPanelDrag);
    panelHandle.addEventListener("pointercancel", stopPanelDrag);
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
  document.getElementById("btnResetView")?.addEventListener("click", () => resetView());

  // Buttons never keep keyboard focus after a mouse click (Space / Enter would re-trigger them)
  document.addEventListener("click", (e: MouseEvent) => {
    const button = (e.target as HTMLElement | null)?.closest?.("button");
    if (!button) return;
    if (state.tool === TOOLS.TEXT && hiddenInput) hiddenInput.focus();
    else button.blur();
  });

  // Window resize handler
  window.addEventListener("resize", () => {
    resizeCanvas();
    // Keep a manually placed panel inside the window
    if (toolPanel && toolPanel.style.top) clampPanel(toolPanel.offsetLeft, toolPanel.offsetTop);
  });

  // Never lose the last few hundred milliseconds of work
  window.addEventListener("pagehide", () => saveToStorage());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveToStorage();
  });
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
  renderStyleSelector();
  loadFromStorage();
  resetView(false);
  startCaretBlinker();
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

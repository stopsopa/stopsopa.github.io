// compile bin/executable

/*
 * Terminal Tetris - NES Style (Black & White)
 *
 * Designed to adapt to terminal dimensions and handle SIGWINCH resizing.
 * Follows classic NES Tetris mechanics with monochrome textured block patterns.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <sys/time.h>
#include <signal.h>

#define BOARD_WIDTH 10
#define BOARD_HEIGHT 20

// Layout dimensions in characters
#define MIN_LAYOUT_WIDTH 56
#define MIN_LAYOUT_HEIGHT 24

/*
 * Tetromino shapes in 4 rotations (4x4 grids).
 * Types:
 * 0: I piece
 * 1: J piece
 * 2: L piece
 * 3: O piece
 * 4: S piece
 * 5: T piece
 * 6: Z piece
 */
static const int TETROMINOES[7][4][4][4] = {
    // 0: I
    {
        {{0,0,0,0}, {1,1,1,1}, {0,0,0,0}, {0,0,0,0}},
        {{0,0,1,0}, {0,0,1,0}, {0,0,1,0}, {0,0,1,0}},
        {{0,0,0,0}, {0,0,0,0}, {1,1,1,1}, {0,0,0,0}},
        {{0,1,0,0}, {0,1,0,0}, {0,1,0,0}, {0,1,0,0}}
    },
    // 1: J
    {
        {{1,0,0,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,1,0}, {0,1,0,0}, {0,1,0,0}, {0,0,0,0}},
        {{0,0,0,0}, {1,1,1,0}, {0,0,1,0}, {0,0,0,0}},
        {{0,1,0,0}, {0,1,0,0}, {1,1,0,0}, {0,0,0,0}}
    },
    // 2: L
    {
        {{0,0,1,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,0,0}, {0,1,0,0}, {0,1,1,0}, {0,0,0,0}},
        {{0,0,0,0}, {1,1,1,0}, {1,0,0,0}, {0,0,0,0}},
        {{1,1,0,0}, {0,1,0,0}, {0,1,0,0}, {0,0,0,0}}
    },
    // 3: O
    {
        {{0,1,1,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,1,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,1,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,1,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0}}
    },
    // 4: S
    {
        {{0,1,1,0}, {1,1,0,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,0,0}, {0,1,1,0}, {0,0,1,0}, {0,0,0,0}},
        {{0,0,0,0}, {0,1,1,0}, {1,1,0,0}, {0,0,0,0}},
        {{1,0,0,0}, {1,1,0,0}, {0,1,0,0}, {0,0,0,0}}
    },
    // 5: T
    {
        {{0,1,0,0}, {1,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,1,0,0}, {0,1,1,0}, {0,1,0,0}, {0,0,0,0}},
        {{0,0,0,0}, {1,1,1,0}, {0,1,0,0}, {0,0,0,0}},
        {{0,1,0,0}, {1,1,0,0}, {0,1,0,0}, {0,0,0,0}}
    },
    // 6: Z
    {
        {{1,1,0,0}, {0,1,1,0}, {0,0,0,0}, {0,0,0,0}},
        {{0,0,1,0}, {0,1,1,0}, {0,1,0,0}, {0,0,0,0}},
        {{0,0,0,0}, {1,1,0,0}, {0,1,1,0}, {0,0,0,0}},
        {{0,1,0,0}, {1,1,0,0}, {1,0,0,0}, {0,0,0,0}}
    }
};

/*
 * Distinct monochrome ASCII textures for each tetromino type (2 chars wide).
 * Follows NES aesthetic where each piece has its own visual pattern.
 */
static const char *BLOCK_PATTERNS[8] = {
    "  ", // 0: Empty
    "==", // 1: I piece
    "[]", // 2: J piece
    "::", // 3: L piece
    "@@", // 4: O piece
    "%%", // 5: S piece
    "##", // 6: T piece
    "$$"  // 7: Z piece
};

// Global state for terminal control and signal handling
static struct termios original_termios;
static volatile sig_atomic_t terminal_resized = 0;
static volatile sig_atomic_t game_interrupted = 0;

/*
 * Game structure holding complete game state.
 */
typedef struct {
    int board[BOARD_HEIGHT][BOARD_WIDTH];
    int current_type;
    int current_rotation;
    int current_x;
    int current_y;
    int next_type;
    int score;
    int lines;
    int level;
    int stats[7];
    int game_over;
    int paused;
    int bag[7];
    int bag_index;
} GameState;

/*
 * Restore terminal settings when exiting.
 */
static void restore_terminal(void)
{
    // Show cursor, exit alternate screen, restore canonical terminal mode
    printf("\033[?25h\033[?1049l");
    fflush(stdout);
    tcsetattr(STDIN_FILENO, TCSANOW, &original_termios);
}

/*
 * Configure terminal to raw mode and alternate screen buffer.
 */
static void init_terminal(void)
{
    struct termios raw;

    tcgetattr(STDIN_FILENO, &original_termios);
    atexit(restore_terminal);

    raw = original_termios;
    // Disable canonical mode, echo, and software flow control
    raw.c_lflag &= ~(ECHO | ICANON | ISIG | IEXTEN);
    raw.c_iflag &= ~(IXON | ICRNL);
    raw.c_cc[VMIN] = 0;
    raw.c_cc[VTIME] = 0;

    tcsetattr(STDIN_FILENO, TCSANOW, &raw);

    // Enter alternate screen buffer, hide cursor, clear screen
    printf("\033[?1049h\033[?25l\033[2J\033[H");
    fflush(stdout);
}

/*
 * Handle terminal resize signal (SIGWINCH).
 */
static void handle_sigwinch(int sig)
{
    (void)sig;
    terminal_resized = 1;
}

/*
 * Handle termination signals (SIGINT, SIGTERM).
 */
static void handle_sigint(int sig)
{
    (void)sig;
    game_interrupted = 1;
}

/*
 * Query current terminal size via ioctl.
 */
static void get_terminal_size(int *cols, int *rows)
{
    struct winsize ws;
    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &ws) == 0 && ws.ws_col > 0 && ws.ws_row > 0) {
        *cols = ws.ws_col;
        *rows = ws.ws_row;
    } else {
        *cols = 80;
        *rows = 24;
    }
}

/*
 * Refill 7-bag randomizer to guarantee fair piece distribution.
 */
static void refill_bag(GameState *game)
{
    for (int i = 0; i < 7; ++i) {
        game->bag[i] = i;
    }
    // Fisher-Yates shuffle
    for (int i = 6; i > 0; --i) {
        int j = rand() % (i + 1);
        int tmp = game->bag[i];
        game->bag[i] = game->bag[j];
        game->bag[j] = tmp;
    }
    game->bag_index = 0;
}

/*
 * Get next piece type from the 7-bag.
 */
static int get_next_piece_from_bag(GameState *game)
{
    if (game->bag_index >= 7) {
        refill_bag(game);
    }
    return game->bag[game->bag_index++];
}

/*
 * Test if piece fits in given position and rotation without collision.
 */
static int piece_fits(const GameState *game, int type, int rotation, int px, int py)
{
    for (int r = 0; r < 4; ++r) {
        for (int c = 0; c < 4; ++c) {
            if (TETROMINOES[type][rotation][r][c]) {
                int bx = px + c;
                int by = py + r;

                // Out of horizontal bounds
                if (bx < 0 || bx >= BOARD_WIDTH) {
                    return 0;
                }
                // Below floor
                if (by >= BOARD_HEIGHT) {
                    return 0;
                }
                // Collides with existing block on board
                if (by >= 0 && game->board[by][bx] != 0) {
                    return 0;
                }
            }
        }
    }
    return 1;
}

/*
 * Spawn next piece into current active piece.
 */
static void spawn_piece(GameState *game)
{
    game->current_type = game->next_type;
    game->next_type = get_next_piece_from_bag(game);
    game->current_rotation = 0;
    game->current_x = 3;
    game->current_y = 0;
    game->stats[game->current_type]++;

    // Game over if new piece immediately collides
    if (!piece_fits(game, game->current_type, game->current_rotation, game->current_x, game->current_y)) {
        game->game_over = 1;
    }
}

/*
 * Initialize or reset complete game state.
 */
static void reset_game(GameState *game)
{
    memset(game->board, 0, sizeof(game->board));
    game->score = 0;
    game->lines = 0;
    game->level = 0;
    game->game_over = 0;
    game->paused = 0;
    memset(game->stats, 0, sizeof(game->stats));

    refill_bag(game);
    game->next_type = get_next_piece_from_bag(game);
    spawn_piece(game);
}

/*
 * Lock the current piece into the board and clear completed lines.
 */
static void lock_and_clear_lines(GameState *game)
{
    // Write piece to board
    for (int r = 0; r < 4; ++r) {
        for (int c = 0; c < 4; ++c) {
            if (TETROMINOES[game->current_type][game->current_rotation][r][c]) {
                int bx = game->current_x + c;
                int by = game->current_y + r;
                if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
                    game->board[by][bx] = game->current_type + 1;
                }
            }
        }
    }

    // Check completed lines
    int cleared = 0;
    for (int y = BOARD_HEIGHT - 1; y >= 0; --y) {
        int full = 1;
        for (int x = 0; x < BOARD_WIDTH; ++x) {
            if (game->board[y][x] == 0) {
                full = 0;
                break;
            }
        }

        if (full) {
            cleared++;
            // Shift down all rows above
            for (int k = y; k > 0; --k) {
                for (int x = 0; x < BOARD_WIDTH; ++x) {
                    game->board[k][x] = game->board[k - 1][x];
                }
            }
            for (int x = 0; x < BOARD_WIDTH; ++x) {
                game->board[0][x] = 0;
            }
            // Check current row again as it now holds shifted content
            y++;
        }
    }

    // NES scoring formula
    if (cleared > 0) {
        static const int base_points[5] = {0, 40, 100, 300, 1200};
        game->score += base_points[cleared] * (game->level + 1);
        game->lines += cleared;
        game->level = game->lines / 10;
    }

    spawn_piece(game);
}

/*
 * Calculate drop speed in milliseconds based on current level.
 */
static int get_drop_interval_ms(int level)
{
    if (level <= 0) return 800;
    if (level == 1) return 716;
    if (level == 2) return 633;
    if (level == 3) return 550;
    if (level == 4) return 466;
    if (level == 5) return 383;
    if (level == 6) return 300;
    if (level == 7) return 216;
    if (level == 8) return 133;
    if (level == 9) return 100;
    if (level >= 10 && level <= 12) return 80;
    if (level >= 13 && level <= 15) return 60;
    if (level >= 16 && level <= 18) return 50;
    return 30; // Level 19+ kill screen speed
}

/*
 * Find ghost piece drop position for helper visualization.
 */
static int calculate_ghost_y(const GameState *game)
{
    int gy = game->current_y;
    while (piece_fits(game, game->current_type, game->current_rotation, game->current_x, gy + 1)) {
        gy++;
    }
    return gy;
}

/*
 * Render entire screen adapted to terminal dimensions.
 */
static void render_screen(const GameState *game)
{
    int term_cols = 80;
    int term_rows = 24;
    get_terminal_size(&term_cols, &term_rows);

    // Clear and check minimum size
    if (term_cols < MIN_LAYOUT_WIDTH || term_rows < MIN_LAYOUT_HEIGHT) {
        printf("\033[H\033[2J");
        int row = term_rows / 2;
        int col = (term_cols > 34) ? (term_cols - 34) / 2 : 1;
        printf("\033[%d;%dH\033[1mPLEASE ENLARGE TERMINAL\033[0m", row, col);
        printf("\033[%d;%dHCurrent: %dx%d  Needed: %dx%d", row + 1, col - 2, term_cols, term_rows, MIN_LAYOUT_WIDTH, MIN_LAYOUT_HEIGHT);
        fflush(stdout);
        return;
    }

    // Center layout horizontally and vertically
    int offset_top = (term_rows - MIN_LAYOUT_HEIGHT) / 2 + 1;
    int offset_left = (term_cols - MIN_LAYOUT_WIDTH) / 2 + 1;

    // Build frame buffer in memory for flicker-free printing
    char buffer[4096];
    int buf_len = 0;

    #define APPEND(...) buf_len += snprintf(buffer + buf_len, sizeof(buffer) - buf_len, __VA_ARGS__)

    // Move cursor to top-left
    APPEND("\033[H");

    // Title banner
    APPEND("\033[%d;%dH.======================================================.", offset_top, offset_left);
    APPEND("\033[%d;%dH|                    T E T R I S                       |", offset_top + 1, offset_left);
    APPEND("\033[%d;%dH|======================================================|", offset_top + 2, offset_left);

    // Compute active piece overlay map
    int active_mask[BOARD_HEIGHT][BOARD_WIDTH] = {{0}};
    int ghost_mask[BOARD_HEIGHT][BOARD_WIDTH] = {{0}};
    int ghost_y = calculate_ghost_y(game);

    if (!game->game_over) {
        for (int r = 0; r < 4; ++r) {
            for (int c = 0; c < 4; ++c) {
                if (TETROMINOES[game->current_type][game->current_rotation][r][c]) {
                    int bx = game->current_x + c;
                    int by = game->current_y + r;
                    if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
                        active_mask[by][bx] = game->current_type + 1;
                    }
                    int gy = ghost_y + r;
                    if (gy >= 0 && gy < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
                        ghost_mask[gy][bx] = 1;
                    }
                }
            }
        }
    }

    // Render 20 board rows + side panels
    for (int y = 0; y < BOARD_HEIGHT; ++y) {
        int line_row = offset_top + 3 + y;
        APPEND("\033[%d;%dH| ", line_row, offset_left);

        // Left Panel: Statistics
        if (y == 0)      APPEND(" STATISTICS  ");
        else if (y == 2) APPEND("  T  ##  %03d ", game->stats[5]);
        else if (y == 4) APPEND("  J  []  %03d ", game->stats[1]);
        else if (y == 6) APPEND("  Z  $$  %03d ", game->stats[6]);
        else if (y == 8) APPEND("  O  @@  %03d ", game->stats[3]);
        else if (y == 10) APPEND("  S  %%%%  %03d ", game->stats[4]);
        else if (y == 12) APPEND("  L  ::  %03d ", game->stats[2]);
        else if (y == 14) APPEND("  I  ==  %03d ", game->stats[0]);
        else             APPEND("             ");

        // Center: Board left wall
        APPEND("|<|");

        // Center: Playfield cells (10 cells, 2 chars each = 20 chars)
        for (int x = 0; x < BOARD_WIDTH; ++x) {
            if (active_mask[y][x]) {
                APPEND("%s", BLOCK_PATTERNS[active_mask[y][x]]);
            } else if (game->board[y][x]) {
                APPEND("%s", BLOCK_PATTERNS[game->board[y][x]]);
            } else if (ghost_mask[y][x]) {
                APPEND("..");
            } else {
                APPEND("  ");
            }
        }

        // Center: Board right wall
        APPEND("|>| ");

        // Right Panel: Info and Next Piece
        if (y == 0)       APPEND("SCORE        |");
        else if (y == 1)  APPEND(" %06d      |", game->score);
        else if (y == 3)  APPEND("LINES        |");
        else if (y == 4)  APPEND(" %03d         |", game->lines);
        else if (y == 6)  APPEND("LEVEL        |");
        else if (y == 7)  APPEND(" %02d          |", game->level);
        else if (y == 9)  APPEND("NEXT         |");
        else if (y >= 10 && y <= 13) {
            // Render 4x4 next piece preview
            int nr = y - 10;
            APPEND(" ");
            for (int nc = 0; nc < 4; ++nc) {
                if (TETROMINOES[game->next_type][0][nr][nc]) {
                    APPEND("%s", BLOCK_PATTERNS[game->next_type + 1]);
                } else {
                    APPEND("  ");
                }
            }
            APPEND("   |");
        }
        else if (y == 15) APPEND("A/D: Move    |");
        else if (y == 16) APPEND("W/X: Rotate  |");
        else if (y == 17) APPEND("S: Soft Drop |");
        else if (y == 18) APPEND("SPC: HardDrop|");
        else if (y == 19) APPEND("P: Pause Q:Q |");
        else              APPEND("             |");
    }

    // Bottom border
    APPEND("\033[%d;%dH|---------------|====================|-------------|", offset_top + 23, offset_left);

    // Overlay Game Over or Paused status
    if (game->game_over) {
        int mid_r = offset_top + 11;
        int mid_c = offset_left + 21;
        APPEND("\033[%d;%dH+------------------+", mid_r, mid_c);
        APPEND("\033[%d;%dH|    GAME  OVER    |", mid_r + 1, mid_c);
        APPEND("\033[%d;%dH|  R: Play Again   |", mid_r + 2, mid_c);
        APPEND("\033[%d;%dH|  Q: Quit         |", mid_r + 3, mid_c);
        APPEND("\033[%d;%dH+------------------+", mid_r + 4, mid_c);
    } else if (game->paused) {
        int mid_r = offset_top + 11;
        int mid_c = offset_left + 21;
        APPEND("\033[%d;%dH+------------------+", mid_r, mid_c);
        APPEND("\033[%d;%dH|      PAUSED      |", mid_r + 1, mid_c);
        APPEND("\033[%d;%dH|  Press P resume  |", mid_r + 2, mid_c);
        APPEND("\033[%d;%dH+------------------+", mid_r + 3, mid_c);
    }

    write(STDOUT_FILENO, buffer, buf_len);
    fflush(stdout);

    #undef APPEND
}

/*
 * Get current system time in milliseconds.
 */
static long long current_time_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return ((long long)tv.tv_sec) * 1000 + (tv.tv_usec / 1000);
}

/*
 * Read non-blocking input key, parsing ANSI escape sequences for arrow keys.
 * Arrow key mappings match TypeScript bindings:
 * - Up Arrow    -> hard drop sentinel (value 1)
 * - Down Arrow  -> 's' (soft drop)
 * - Right Arrow -> 'd' (move right)
 * - Left Arrow  -> 'a' (move left)
 */
static int read_key(void)
{
    char c;
    if (read(STDIN_FILENO, &c, 1) <= 0) {
        return 0;
    }

    if (c == '\033') {
        char seq[2];
        if (read(STDIN_FILENO, &seq[0], 1) <= 0) return '\033';
        if (read(STDIN_FILENO, &seq[1], 1) <= 0) return '\033';

        if (seq[0] == '[') {
            switch (seq[1]) {
                case 'A': return 1;   // Up Arrow -> hard drop
                case 'B': return 's'; // Down Arrow -> soft drop
                case 'C': return 'd'; // Right Arrow -> move right
                case 'D': return 'a'; // Left Arrow -> move left
            }
        }
        return 0;
    }

    return c;
}

/*
 * Main game loop.
 */
int main(int argc, char **argv)
{
    (void)argc;
    (void)argv;

    srand((unsigned int)time(NULL));

    // Register signal handlers
    struct sigaction sa_winch;
    memset(&sa_winch, 0, sizeof(sa_winch));
    sa_winch.sa_handler = handle_sigwinch;
    sigaction(SIGWINCH, &sa_winch, NULL);

    struct sigaction sa_int;
    memset(&sa_int, 0, sizeof(sa_int));
    sa_int.sa_handler = handle_sigint;
    sigaction(SIGINT, &sa_int, NULL);
    sigaction(SIGTERM, &sa_int, NULL);

    init_terminal();

    GameState game;
    reset_game(&game);

    long long last_drop = current_time_ms();
    render_screen(&game);

    while (!game_interrupted) {
        // Handle window resize reconciliation
        if (terminal_resized) {
            terminal_resized = 0;
            // Clear entire screen before re-rendering centered
            printf("\033[2J\033[H");
            fflush(stdout);
            render_screen(&game);
        }

        // Process user input
        int key = read_key();
        if (key != 0) {
            if (key == 'q' || key == 'Q') {
                break;
            }

            if (game.game_over) {
                if (key == 'r' || key == 'R') {
                    reset_game(&game);
                    printf("\033[2J\033[H");
                    render_screen(&game);
                }
            } else {
                if (key == 'p' || key == 'P') {
                    game.paused = !game.paused;
                    render_screen(&game);
                } else if (!game.paused) {
                    if (key == 'a' || key == 'A') {
                        // Move left
                        if (piece_fits(&game, game.current_type, game.current_rotation, game.current_x - 1, game.current_y)) {
                            game.current_x--;
                            render_screen(&game);
                        }
                    } else if (key == 'd' || key == 'D') {
                        // Move right
                        if (piece_fits(&game, game.current_type, game.current_rotation, game.current_x + 1, game.current_y)) {
                            game.current_x++;
                            render_screen(&game);
                        }
                    } else if (key == 'w' || key == 'W' || key == 'x' || key == 'X' || key == 'm' || key == 'M') {
                        // Rotate clockwise with wall kick (W / X / M)
                        int next_rot = (game.current_rotation + 1) % 4;
                        if (piece_fits(&game, game.current_type, next_rot, game.current_x, game.current_y)) {
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        } else if (piece_fits(&game, game.current_type, next_rot, game.current_x - 1, game.current_y)) {
                            game.current_x--;
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        } else if (piece_fits(&game, game.current_type, next_rot, game.current_x + 1, game.current_y)) {
                            game.current_x++;
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        }
                    } else if (key == 'z' || key == 'Z' || key == 'n' || key == 'N') {
                        // Rotate counter-clockwise with wall kick (Z / N)
                        int next_rot = (game.current_rotation + 3) % 4;
                        if (piece_fits(&game, game.current_type, next_rot, game.current_x, game.current_y)) {
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        } else if (piece_fits(&game, game.current_type, next_rot, game.current_x - 1, game.current_y)) {
                            game.current_x--;
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        } else if (piece_fits(&game, game.current_type, next_rot, game.current_x + 1, game.current_y)) {
                            game.current_x++;
                            game.current_rotation = next_rot;
                            render_screen(&game);
                        }
                    } else if (key == 's' || key == 'S') {
                        // Soft drop
                        if (piece_fits(&game, game.current_type, game.current_rotation, game.current_x, game.current_y + 1)) {
                            game.current_y++;
                            game.score += 1;
                            last_drop = current_time_ms();
                            render_screen(&game);
                        } else {
                            lock_and_clear_lines(&game);
                            last_drop = current_time_ms();
                            render_screen(&game);
                        }
                    } else if (key == ' ' || key == 1) {
                        // Hard drop (Space or Up Arrow)
                        int dropped_rows = 0;
                        while (piece_fits(&game, game.current_type, game.current_rotation, game.current_x, game.current_y + 1)) {
                            game.current_y++;
                            dropped_rows++;
                        }
                        game.score += dropped_rows * 2;
                        lock_and_clear_lines(&game);
                        last_drop = current_time_ms();
                        render_screen(&game);
                    }
                }
            }
        }

        // Automatic gravity drop timer
        if (!game.game_over && !game.paused) {
            long long now = current_time_ms();
            int interval = get_drop_interval_ms(game.level);
            if (now - last_drop >= interval) {
                if (piece_fits(&game, game.current_type, game.current_rotation, game.current_x, game.current_y + 1)) {
                    game.current_y++;
                } else {
                    lock_and_clear_lines(&game);
                }
                last_drop = now;
                render_screen(&game);
            }
        }

        // 16ms tick (~60fps)
        usleep(16000);
    }

    return 0;
}

Create a complete, standalone NES-style Tetris game in a single HTML file using raw HTML, CSS, and Vanilla JavaScript.

### Specifications:

1. **Layout & Style**:

   - Retro arcade cabinet container with ASCII-art borders and double lines.
   - Centered and responsive for mobile and desktop.

2. **Block Rendering**:

   - Each tetromino type has a distinct bright color and shaded character texture (`░░`, `▒▒`, `▓▓`, `██`):
     - I: Cyan (`#00e5ff`, `██`)
     - J: Blue (`#2979ff`, `▓▓`)
     - L: Orange (`#ff9100`, `▒▒`)
     - O: Yellow (`#ffd600`, `██`)
     - S: Green (`#00e676`, `░░`)
     - T: Magenta (`#d500f9`, `▓▓`)
     - Z: Red (`#ff1744`, `▒▒`)
   - Blocks drawn with 3D beveled edges (light top/left highlight, dark bottom/right shadow).
   - Subtle ghost piece (`░░`, low-opacity outline).

3. **Controls & Keybindings**:

   - `Z`: Rotate Left (counter-clockwise) with wall-kick
   - `X`: Rotate Right (clockwise) with wall-kick
   - `A` / `ArrowLeft`: Move Left
   - `D` / `ArrowRight`: Move Right
   - `S` / `ArrowDown`: Soft Drop (+1 pt per cell)
   - `ArrowUp` or `Space`: Hard Drop (+2 pts per cell)
   - `M`: Toggle Music / Sound (ON/OFF)
   - `P`: Pause / Resume
   - `R`: Restart on Game Over
   - On-screen touch buttons for mobile/mouse play.

4. **Game Mechanics**:

   - Standard 7-bag randomizer (no piece drought).
   - NES scoring: 40 / 100 / 300 / 1200 × (level + 1) for 1/2/3/4 lines cleared.
   - Level increments every 10 lines, with authentic frame drop speed curve (800ms down to 30ms).

5. **Audio (Procedural Chiptune)**:
   - Native Web Audio API (`AudioContext`), zero external files or MP3s.
   - Synthesizes authentic Korobeiniki (Tetris Theme A) at 144 BPM:
     - Lead melody: square-wave oscillator, 90% note gate duration with 10% rest for crisp 8-bit staccato articulation.
     - Bassline / sub-octave: triangle wave.
     - Includes complete Section A and Section B (lyrical half-note variation).
   - Line clear and drop sound effects.
   - Enabled (`ON`) by default; auto-starts on first user interaction (click/key) to satisfy browser autoplay policy.

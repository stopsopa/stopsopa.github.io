# OKLCH Color Tool Specification

This document defines the requirements and behavior for the `oklch.html` tool, which allows users to define, manage, and edit colors using the OKLCH color space.

## 1. High-Level Layout

The application follows a two-column sidebar layout:

- **Left Column (Sidebar)**: Scrollable list of color definitions.
- **Right Column (Editor)**: Control panel for the currently selected color.

## 2. Color Sidebar (Left Column)

The sidebar displays the collection of colors.

### Color Item (Box)

- **Visuals**:
  - **Box Size**: 200px width × 50px height.
  - **Border**: 1px solid black.
  - **Label**: The current OKLCH value string (e.g., `oklch(60% 0.15 250)`) centered inside the box.
  - **Text Color**: Automatically contrast with background (white text for dark colors, black for light).
  - **Transparency Support**: When Alpha (A) is used, the box must have a checkered background to visualize transparency:
    `background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuX1o2Nmk1ZyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48bGluZSB4MT0iMCIgeT0iMCIgeDI9IjAiIHkyPSIxMiIgc3Ryb2tlPSIjRjNGM0YzIiBzdHJva2Utd2lkdGg9IjEyIiAvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuX1o2Nmk1ZykiICAvPjwvc3ZnPg==);`
    To achieve this, use two nested divs:
    - Inner div 1: Contains the checkered background.
    - Inner div 2: Overlays the OKLCH color.
  - **Global Toggle**: There must be a global checkbox in the UI to enable/disable this transparency background pattern. Toggling this should add or remove a specific class (e.g., `show-transparency-grid`) on the `body` element.
- **Interactions**:
  - **Select**: Clicking the box selects it for editing. The selected box should have a distinct highlight (e.g., thicker border).
  - **Copy to Clipboard**: Clicking the text/box copies the `oklch(...)` string to the clipboard.
  - **Feedback**: A tooltip or "toast" message appears saying "Copied!" for 1-2 seconds.
- **Item Actions**:
  - Each item has a button group:
    - **Duplicate**: Clones the color and adds it below.
    - **Remove**: Deletes the color from the list.

### List Actions

- **Add Color Button**: Adds a new color initialized to "perfect gray": `oklch(50% 0 0)`.

## 3. Editor Panel (Right Column)

The editor manipulates the state of the **currently selected** color item. Colors are defined using the format: `oklch(L C H[ / A])`.

### Parameter Controls:

#### Lightness (L)

- **Unit Toggle**: Radio buttons to choose between:
  - `Percentage` (0% to 100%, e.g., `40.1%`)
  - `Number` (0 to 1, e.g., `0.401`)
- **Inputs**: Slider and numeric input field.

#### Chroma (C)

- **Unit Toggle**: Radio buttons to choose between:
  - `Number` (0 to 0.5, e.g., `0.123`)
  - `Percentage` (0% to 100%)
- **Inputs**: Slider and numeric input field.

#### Hue (H)

- **Interactive Component**: A custom **Hue Wheel** for visual selection.
- **Unit Toggle**: Radio buttons to choose between units (e.g., `deg`, `rad`, `grad`, `turn`, or unitless number).
- **Inputs**: Clicking/dragging on the wheel updates the value; numeric input field for manual entry.
- **Sync**: The wheel reflects the value regardless of the unit selected.

#### Alpha (A) - Optional

- **Toggle**: A checkbox (or radio) to enable/disable Alpha in the output string.
- **Unit Toggle**: (Visible only if Alpha is enabled) Radio buttons to choose between:
  - `Number` (0 to 1, e.g., `0.5`)
  - `Percentage` (0% to 100%, e.g., `50%`)
- **Inputs**: Slider and numeric input field.

#### Actions

- **Duplicate Button**: A button to clone the currently selected color and add it to the list.

### Output/Preview

- **Live String**: Displays the generated CSS string, e.g., `oklch(59.69% 0.156 49.77 / .5)`.
- **Large Preview**: A primary preview area showing the color.
  - **Transparency Support**: When Alpha (A) is used, must show the checkered background pattern (same as sidebar boxes) using a two-div overlay approach.
- **Background Comparison**: Preview against light and dark backgrounds.
  - **Transparency Support**: The color blocks in comparison areas must also show the checkered background under the color when Alpha is enabled.

## 4. State Persistence & URL Serialization

The tool maintains its state both in the browser and the URL to allow sharing and session recovery.

### URL Serialization

- **Format**: The list of colors is serialized into a URL query parameter `?colors=...`.
- **Separator**: Individual color strings are separated by the `|` (pipe) character.
- **Example URL**: `oklch.html?colors=oklch(60% 0.15 250)|oklch(40% 0.1 20 / 0.5)`
- **Live Updates**: Every change to any color or the list should immediately update the browser's URL using `history.replaceState`.

### Deserialization (Loading)

- On page load, the app parses the `colors` parameter from the URL.
- **Unit Reconstruction**: The UI control states (radio buttons) are inferred from the string format:
  - If a value ends with `%` (e.g., `60%`), the corresponding unit radio button is set to `Percentage`.
  - Otherwise, it is set to `Number`.
- **Fallback**: If the URL parameter is missing or invalid, fall back to `localStorage` or the default initial color.

### LocalStorage

- The list of colors and the currently selected index are persisted in `localStorage`.

## 5. Design & Aesthetics

- **Hue Wheel**: Smooth, high-fidelity rendering with a clear marker.
- **Typography**: Modern sans-serif (Inter, Outfit).
- **Glassmorphism**: Subtle blur effects for the sidebar and panels.
- **Custom Sliders**: Styled to match the premium theme.
- **Micro-animations**: Smooth movement when switching boxes or toggling units.
- **Color Gamut Safety**: Indicate when a color is out of sRGB gamut.

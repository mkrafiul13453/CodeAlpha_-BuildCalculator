# Orbit Calculator

Orbit is a responsive, keyboard-friendly calculator built with semantic HTML, CSS, and vanilla JavaScript. Its dark glass-inspired interface supports everyday arithmetic without a framework or build step.

## Features

- Addition, subtraction, multiplication, and division with standard operator precedence.
- Decimal input, percentage conversion, and positive/negative toggling.
- Live result preview, backspace, all-clear, and consecutive calculations.
- Keyboard controls and accessible labels and focus states.
- Safe expression parsing without `eval()` or `new Function()`.
- Graceful handling of incomplete expressions, invalid input, and division by zero.
- Responsive layout for mobile, tablet, and desktop.

Percentage converts the current value to a fraction of 100. For example, `25%` evaluates to `0.25`. Results are rounded to 12 significant digits to reduce common floating-point artifacts.

## Run locally

No installation or build step is required. Open `index.html` in a modern web browser. Alternatively, serve the project directory with any static file server.

The interface uses Google Fonts when an internet connection is available and falls back to system fonts otherwise.

## Controls

| Key | Action |
| --- | --- |
| `0`–`9` | Enter a digit |
| `+`, `-`, `*`, `/` | Add, subtract, multiply, or divide |
| `.` | Enter a decimal point |
| `%` | Convert the current value to a percentage |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete the last character |
| `Escape` | Clear the expression |

The on-screen `+/−` key toggles the sign of the current number.

## Project files

```text
index.html   Semantic page structure and calculator controls
style.css    Theme, layout, responsive styles, and focus states
script.js    Input handling, expression parsing, and calculations
```

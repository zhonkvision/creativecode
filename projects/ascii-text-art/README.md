# ASCII Matrix // FIGlet Art Synthesizer (`EXP-031`)

> **Visual DNA Channel:** `CH-01-CRT-TELEMETRY`  
> **Technology Stack:** Canvas 2D / TheDraw Engine / FIGlet Typography / Matrix Rain Simulation  
> **Lineage:** `REF-001` (CRT Neurology HUD & BBS Terminal)

---

## Overview

A high-fidelity **Text-to-ASCII Art generator** integrating the complete **TheDraw BBS ANSI font collection** (`Acid Blue`, `Twisted Wire`, `Sub-Zero`, `Graffiti`, `Gothic`, `Ghost`) alongside classic **FIGlet typography engines** (`Slant`, `Standard`, `Doom`, `Isometric`, `Cybermedium`, `Mini`).

The synthesizer features multiline layout parsing, tactile border framing, phosphor colorway themes, real-time glitch synthesis, and hardware-accelerated video/image export.

---

## Features & Capabilities

- **12 Curated ANSI & FIGlet Fonts**:
  - *TheDraw Master Fonts*: `Acid Blue`, `Twisted Wire`, `Sub-Zero`, `Graffiti`, `Gothic`, `Ghost`
  - *FIGlet Retro Fonts*: `Slant`, `Standard`, `Doom`, `Isometric`, `Cybermedium`, `Mini`
- **7 CRT Phosphor Color Themes**:
  - `Blood Neon` (Signal Red / Black / White)
  - `Classic Phosphor` (Matrix Green)
  - `Cyber Cyan` (Electric Blue)
  - `Amber CRT` (Monochrome Amber)
  - `Magenta Cyberpunk` (Hot Pink)
  - `Arcade Rainbow` (Prismatic Spectrum)
  - `Cryo Ice` (Sub-Zero Cyan)
- **7 Border Framing Modes**: `Terminal Box`, `Double Border`, `Brackets`, `Block Shadow`, `Stars Grid`, `Slash Diagonal`, or `Frameless`.
- **Matrix Digital Rain Overlay**: Atmospheric falling Japanese kana and alphanumeric telemetry code.
- **Hardware Export Suite**:
  - Lossless PNG (Opaque & Transparent Alpha)
  - Lossless JPG
  - 60 FPS MP4 Stream Recording
  - Animated Looping GIF

---

## Live Parameter Schema (`project.json`)

| Parameter | Type | Default | Range / Options | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ascii_text` | `string` | `"CREATIVE CODE"` | Text input | Multiline text payload |
| `ascii_font` | `select` | `"acid-blue"` | 12 fonts | TheDraw & FIGlet font parser |
| `ascii_theme` | `select` | `"blood"` | 7 themes | CRT Phosphor palette |
| `ascii_frame` | `select` | `"terminal"` | 7 frame styles | Border framing style |
| `ascii_spacing` | `range` | `1` | `0` – `5` (step: `1`) | Letter kerning spacing |
| `ascii_glitch` | `range` | `0.15` | `0` – `1` (step: `0.05`) | CRT scan displacement & glitch |
| `matrix_rain` | `boolean`| `true` | `true` / `false` | Matrix digital rain particles |

---

## Bidirectional Mutation Protocol

```javascript
// Send live parameter mutations from parent workbench
window.postMessage({
  type: 'DNA_MUTATION',
  parameters: {
    ascii_text: 'NEOMATRIX',
    ascii_font: 'acid-blue',
    ascii_theme: 'blood',
    matrix_rain: true
  }
}, '*');
```

# CPFP // Cyberpunk Reticle PFP Studio (`cpfp` // `EXP-032`)

> **Visual DNA Channel:** `CH-01-CRT-TELEMETRY`  
> **Technology Stack:** Canvas 2D / CRT Optical Shader / Particle Physics  
> **Lineage:** `REF-001` (Tactical Military & Medical HUD)

---

## Overview

**CPFP (Cyberpunk Profile Picture)** is a tactical profile generator transforming portraits and artwork into high-tech cyberpunk reticle avatars. Features include custom weapon crosshairs, rain streak physics, smoke particle diffusion, tactical coordinate telemetry, and CRT chromatic optics.

---

## Features & Capabilities

- **Custom Portrait Upload**: Drag-and-drop or file upload with live pan/zoom scaling.
- **Tactical Sniper Reticles**: Multiple crosshair geometries (Orbital Rangefinder, Tactical Cross, Hexagon Target, Minimal Lock).
- **Physical Particle Systems**:
  - Atmospheric vertical rain streaks with surface droplet pooling.
  - Thermal smoke & steam particle drift.
- **CRT Optics & Telemetry**:
  - Dynamic scanline raster and chromatic aberration fringe.
  - Live GPS, grid azimuth, timestamp, and target lock telemetry readouts.
- **Real-Time Export Suite**:
  - High-res PNG & JPG snapshot export.
  - 60 FPS MP4 video capture for animated avatar profiles.
  - Animated looping GIF export.

---

## Live Parameter Schema (`project.json`)

| Parameter | Type | Default | Range / Options | Description |
| :--- | :--- | :--- | :--- | :--- |
| `hudText` | `string` | `"DELETE"` | Text input | Top target lock callout text |
| `theme` | `select` | `"amber"` | `amber`, `phosphor`, `cyber`, `blood`, `white` | CRT Phosphor palette |
| `scanlines` | `boolean` | `true` | `true` / `false` | CRT raster scanline overlay |
| `reticle` | `select` | `"orbital"`| `orbital`, `sniper`, `hex`, `minimal` | Crosshair geometry mode |
| `rain` | `boolean` | `true` | `true` / `false` | Rain particle physics |
| `lensZoom` | `range` | `100` | `50` – `200` (step: `1`) | Viewport image zoom scale |
| `lensPanX` | `range` | `0` | `-100` – `100` (step: `1`) | Horizontal pan offset |
| `lensPanY` | `range` | `0` | `-100` – `100` (step: `1`) | Vertical pan offset |

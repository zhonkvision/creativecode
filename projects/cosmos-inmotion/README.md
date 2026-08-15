# Cosmos Inmotion (`EXP-006`)

> **Visual DNA Channel:** `CH-05-QUANTUM-LATTICE`  
> **Technology Stack:** Three.js / WebGL / N-Body Gravitational Physics  
> **Lineage:** `REF-004` (Astronomical Spectrogram & Deep Cosmic Dispersion)

---

## Overview

**Cosmos Inmotion** is an interactive N-body gravitational celestial simulator. It visualizes orbital mechanics, galactic accretion disks, relativistic Doppler redshift/blueshift, and galaxy collisions with thousands of GPU particles.

---

## Features & Capabilities

- **Gravitational N-Body Solver**: Newtonian gravity with softening parameter to prevent singular close-encounter accelerations.
- **Relativistic Optics**: Doppler redshift for receding bodies and blueshift for approaching stellar clusters.
- **Interactive Orbital Camera**: Smooth orbit controls with inertia damping and focus tracking.
- **Embedded HUD**: Minimal glass HUD readouts displaying active stellar count, orbital velocity, and gravitational constant.

---

## Live Parameter Schema (`project.json`)

| Parameter | Type | Default | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `speed` | `range` | `1.0` | `0.1` – `3.0` | Orbital velocity and simulation step delta |
| `intensity` | `range` | `1.0` | `0.1` – `2.0` | Stellar brightness, particle size, and glow bloom |

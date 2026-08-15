# Grainrad Bulk Exporter 🚀

> **Open Source Tool** to bulk export high-quality Three.js HTML scenes from [grainrad.com](https://grainrad.com).

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-v16%2B-green.svg)
![Status](https://img.shields.io/badge/Status-Stable-blue.svg)

**Built by [Desmond Baker Jr](https://beacons.ai/dbcreations)** • **[Digital Alchemy Skool](https://www.skool.com/digital-alchemy-7170)**

Scale your retro-3D art workflow. Upload 100 images, go get coffee, come back to 100 interactive 3D HTML scenes.

---

## ✨ Features

- **Batch Processing**: Drag & drop multiple images at once.
- **100% Local**: Your images stay on your machine (only sent to Grainrad for processing).
- **15 Effects**: Supports all Grainrad filters (ASCII, Matrix, VHS, Dithering, etc.).
- **Cross-Platform**: Works on **Windows**, **macOS**, and **Linux**.
- **Resilient**: Automatically retries if your internet/VPN flickers.
- **Ethical**: Respectful rate limiting built-in.

---

## 📦 Installation

Prerequisites: [Node.js](https://nodejs.org/) (v16+)

1. **Clone the repo:**

    ```bash
    git clone https://github.com/jackdog668/grainrad-bulk.git
    cd grainrad-bulk
    ```

2. **Install dependencies:**

    ```bash
    npm install
    npx playwright install chromium
    ```

---

## 🎮 Usage

### Option 1: Web Interface (Recommended)

1. Start the server:

    ```bash
    npm start
    ```

    (Windows users can just double-click `RUN-EXPORT.bat`)

2. Open **<http://localhost:3000>**
3. Drag images, pick your settings, and click **Export**.

### Option 2: Command Line

Put your images in the `input/` folder and run:

```bash
npm run cli
```

---

## 🔒 Security & Privacy

- **No Tracking**: This tool has zero analytics.
- **Source Code**: Read `bulk-export.js` to see exactly what it does.
- **Respectful**: This automation acts like a human user. It does not bypass paywalls or overuse server resources.

## 🤝 Contributing

Pull requests are welcome! Please read `CONTRIBUTING.md` before submitting.

## 📜 License

MIT License © [Desmond Baker Jr](https://beacons.ai/dbcreations) / [Digital Alchemy Skool](https://www.skool.com/digital-alchemy-7170) - see `LICENSE` file.

*This project is an unofficial tool and is not affiliated with Grainrad.com.*

---

## 🔗 Links

- **Join the Community**: [Digital Alchemy Skool](https://www.skool.com/digital-alchemy-7170)
- **All My Links**: [Beacons](https://beacons.ai/dbcreations)

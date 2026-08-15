/**
 * Grainrad Bulk UI Server
 * 
 * Local web server for drag-and-drop bulk image uploads
 * and real-time Three.js export progress.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Directories
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure directories exist
if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Configure multer for file uploads with security
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max per file

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, INPUT_DIR),
    filename: (req, file, cb) => {
        // Sanitize filename: remove path traversal, keep only safe chars
        const sanitized = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.+/g, '.')
            .slice(0, 100); // Max 100 chars
        cb(null, sanitized);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (PNG, JPG, GIF, WebP)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

// Serve static files
app.use(express.static('public'));
app.use('/output', express.static(OUTPUT_DIR));

// Track export process
let exportProcess = null;
let exportLogs = [];
let exportStatus = 'idle'; // idle, running, done, error

// Clear input folder
app.post('/clear-input', (req, res) => {
    const files = fs.readdirSync(INPUT_DIR);
    files.forEach(file => {
        if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(INPUT_DIR, file));
        }
    });
    res.json({ success: true, message: 'Input folder cleared' });
});

// Upload images
app.post('/upload', upload.array('images'), (req, res) => {
    const files = req.files.map(f => f.filename);
    res.json({ success: true, files, count: files.length });
});

// Get input files
app.get('/input-files', (req, res) => {
    const files = fs.readdirSync(INPUT_DIR).filter(f => f !== '.gitkeep');
    res.json({ files });
});

// Get output files
app.get('/output-files', (req, res) => {
    const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => ({
            name: f,
            size: (fs.statSync(path.join(OUTPUT_DIR, f)).size / 1024).toFixed(1) + ' KB',
            url: `/output/${f}`
        }));
    res.json({ files });
});

// Start export process
app.get('/start-export', (req, res) => {
    if (exportStatus === 'running') {
        return res.json({ success: false, message: 'Export already running' });
    }

    // Get parameters from query string
    const effect = req.query.effect || 'ASCII';
    const preset = req.query.preset || 'High Detail';
    const depth = req.query.depth || 'Extreme';
    const format = req.query.format || 'Three.js';
    const vibrant = req.query.vibrant === '1' ? '1' : '0';

    exportLogs = [];
    exportStatus = 'running';

    // Run the bulk export script with environment variables
    exportProcess = spawn('node', ['bulk-export.js'], {
        cwd: __dirname,
        shell: true,
        env: {
            ...process.env,
            GRAINRAD_EFFECT: effect,
            GRAINRAD_PRESET: preset,
            GRAINRAD_DEPTH: depth,
            GRAINRAD_FORMAT: format,
            GRAINRAD_VIBRANT: vibrant
        }
    });

    exportProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        exportLogs.push(...lines);
    });

    exportProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        exportLogs.push(...lines.map(l => `[ERROR] ${l}`));
    });

    exportProcess.on('close', (code) => {
        exportStatus = code === 0 ? 'done' : 'error';
        exportLogs.push(code === 0 ? '✨ Export completed!' : `❌ Export failed (code ${code})`);
    });

    res.json({ success: true, message: 'Export started', effect, preset, depth });
});

// Get export status and logs
app.get('/export-status', (req, res) => {
    const lastIndex = parseInt(req.query.since) || 0;
    res.json({
        status: exportStatus,
        logs: exportLogs.slice(lastIndex),
        totalLogs: exportLogs.length
    });
});

// Stop export
app.post('/stop-export', (req, res) => {
    if (exportProcess) {
        exportProcess.kill();
        exportStatus = 'idle';
        exportLogs.push('🛑 Export stopped by user');
    }
    res.json({ success: true });
});

// Start server - bind to localhost only for security (not exposed to network)
app.listen(PORT, '127.0.0.1', () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     Grainrad Bulk Three.js Exporter       ║
╠═══════════════════════════════════════════╣
║  🌐 Open: http://localhost:${PORT}            ║
║  📁 Input:  ./input/                      ║
║  📂 Output: ./output/                     ║
║  🔒 Local only (not exposed to network)    ║
╚═══════════════════════════════════════════╝
`);
});

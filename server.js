/**
 * CreativeCode.my — Development HTTP Server & Dynamic Specimen Open Graph Router
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanAndGenerateProjects } from './src/engine/discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const SLUG_ALIASES = {
  'zhonkcrt': 'cyberpunk-retro-crt',
  'grainrad-bulk': 'chromarad-isotope-matrix',
  'grainrad': 'chromarad-isotope-matrix',
  'chromarad': 'chromarad-isotope-matrix',
  'zhonk': 'retro-noise'
};

const server = http.createServer((req, res) => {
  // 1. Dynamic Projects Discovery API
  if (req.url === '/api/projects' || req.url.startsWith('/api/projects?')) {
    try {
      const projects = scanAndGenerateProjects();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(JSON.stringify(projects));
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // 2. Custom Shareable Links for Every Specimen (/experiment/:slug or /specimen/:slug)
  // Must match strictly single slug segment, NOT nested asset paths like /experiment/projects/...
  const expMatch = req.url.match(/^\/(?:experiment|specimen)\/([a-zA-Z0-9_-]+)(?:\/)?(?:\?.*)?$/);
  if (expMatch) {
    const rawSlug = expMatch[1].toLowerCase();
    const actualSlug = SLUG_ALIASES[rawSlug] || rawSlug;
    
    try {
      const projects = scanAndGenerateProjects();
      const project = projects.find(p => p.slug.toLowerCase() === actualSlug || p.id.toLowerCase() === actualSlug);
      
      let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

      if (project) {
        const title = `${project.title} // CreativeCode.my`;
        const desc = project.metadata?.description || `Experimental generative visualization: ${project.title}`;
        const canonicalUrl = `https://creativecode.my/experiment/${rawSlug}`;

        // Inject Open Graph and Initial Specimen bootstrap
        const ogTags = `
    <!-- Custom Specimen Open Graph & Social Sharing -->
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="CreativeCode.my">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="https://creativecode.my/projects/${project.slug}/preview.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="https://creativecode.my/projects/${project.slug}/preview.png">
    <script>window.__INITIAL_SPECIMEN_SLUG__ = "${project.slug}";</script>
        `;

        html = html.replace(/<title>.*?<\/title>/i, ogTags);
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(html);
      return;
    } catch (err) {
      console.error('[ROUTER] Error serving experiment page:', err);
    }
  }

  // 3. Static File Server (with fallback prefix strip for /experiment/ or /specimen/)
  let parsedUrl = req.url.split('?')[0];
  if (parsedUrl === '/') parsedUrl = '/index.html';

  // If a browser requested a relative asset while on /experiment/slug, strip prefix
  if (parsedUrl.startsWith('/experiment/')) {
    parsedUrl = parsedUrl.replace(/^\/experiment/, '');
  } else if (parsedUrl.startsWith('/specimen/')) {
    parsedUrl = parsedUrl.replace(/^\/specimen/, '');
  }

  let filePath = path.join(__dirname, decodeURIComponent(parsedUrl));

  // If not found in root, check in projects/ subdirectory
  if (!fs.existsSync(filePath)) {
    const projectFilePath = path.join(__dirname, 'projects', decodeURIComponent(parsedUrl));
    if (fs.existsSync(projectFilePath)) {
      filePath = projectFilePath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (stats && stats.isDirectory()) {
        const dirIndex = path.join(filePath, 'index.html');
        if (fs.existsSync(dirIndex)) {
          filePath = dirIndex;
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`404 Not Found: ${req.url}`);
          return;
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${req.url}`);
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  ⚡ CREATIVECODE.MY LIVING VISUAL DNA ENGINE`);
  console.log(`  🚀 Canonical: cc-visual-dna`);
  console.log(`  🌐 Local Server: http://localhost:${PORT}`);
  console.log(`  🔗 Shareable Route: http://localhost:${PORT}/experiment/:slug`);
  console.log(`======================================================\n`);
});

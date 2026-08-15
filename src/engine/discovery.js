/**
 * CreativeCode Visual DNA — Project Metadata & Catalog Generator
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsDir = path.resolve(__dirname, '../../projects');

const CHANNEL_MAP = {
  'ic-wafer-matrix': 'CH-02-NUMERIC-GRID',
  'scan-mode-cathedral': 'CH-03-VECTOR-PERSPECTIVE',
  'compulsive-wireframe': 'CH-01-CRT-TELEMETRY',
  'compulsive-neurology-hud': 'CH-01-CRT-TELEMETRY',
  'retro-loader-84': 'CH-04-STEPPED-RASTER',
  'windows84-raster': 'CH-04-STEPPED-RASTER',
  'atari84-spectrum': 'CH-04-STEPPED-RASTER',
  'webgl-fluid-simulation': 'CH-02-NUMERIC-GRID',
  'morphing-cyber-lattice': 'CH-03-VECTOR-PERSPECTIVE',
  'hopffibration': 'CH-03-VECTOR-PERSPECTIVE',
  'geometry-in-flux': 'CH-03-VECTOR-PERSPECTIVE',
  'quantumlotus': 'CH-03-VECTOR-PERSPECTIVE',
  'bioelectric': 'CH-01-CRT-TELEMETRY',
  'cosmos-inmotion': 'CH-02-NUMERIC-GRID',
  'magma-particle': 'CH-02-NUMERIC-GRID',
  'opposing-forces': 'CH-01-CRT-TELEMETRY',
  'chromarad-isotope-matrix': 'CH-02-NUMERIC-GRID',
  'interactive-p5-wave-grid': 'CH-04-STEPPED-RASTER',
  'interactive-webgl-neon-ripple': 'CH-02-NUMERIC-GRID',
  'mediterranean-drift': 'CH-03-VECTOR-PERSPECTIVE',
  'retro-noise': 'CH-04-STEPPED-RASTER',
  'loading-bar-cyberpunk': 'CH-01-CRT-TELEMETRY',
  'cyberpunk-retro-crt': 'CH-04-STEPPED-RASTER',
  'echo-of-aria': 'CH-01-CRT-TELEMETRY',
  'gsap-inertia-audio': 'CH-03-VECTOR-PERSPECTIVE',
  'ambient-chiptune': 'CH-04-STEPPED-RASTER',
  'quiet-worlds-piano': 'CH-04-STEPPED-RASTER',
  'xylophone': 'CH-03-VECTOR-PERSPECTIVE',
  'inkdrum': 'CH-02-NUMERIC-GRID',
  'false-earth': 'CH-03-VECTOR-PERSPECTIVE',
  'ascii-text-art': 'CH-01-CRT-TELEMETRY',
  'cpfp': 'CH-01-CRT-TELEMETRY'
};

const TITLE_OVERRIDES = {
  'cpfp': 'CPFP // Cyberpunk Reticle PFP Studio',
  'ascii-text-art': 'ASCII Matrix // FIGlet Art Synthesizer',
  'chromarad-isotope-matrix': 'Chromarad // Isotope Matrix',
  'retro-noise': 'ZHONK',
  'cyberpunk-retro-crt': 'ZHONKCRT',
  'ic-wafer-matrix': 'IC Wafer Yield Matrix',
  'scan-mode-cathedral': 'Scan-Mode Cathedral',
  'compulsive-wireframe': 'Compulsive Wireframe HUD',
  'retro-loader-84': 'Retro Loader 84',
  'inkdrum': 'Inkdrum Risograph Studio'
};

export function scanAndGenerateProjects() {
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const allProjects = [];

  let expIndex = 1;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const dirPath = path.join(projectsDir, slug);
    const jsonPath = path.join(dirPath, 'project.json');

    let projectData = null;

    if (fs.existsSync(jsonPath)) {
      try {
        projectData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        console.warn(`Error reading ${jsonPath}, generating fallback:`, e);
      }
    }

    if (projectData && TITLE_OVERRIDES[slug]) {
      projectData.title = TITLE_OVERRIDES[slug];
    }

    if (!projectData) {
      const channel = CHANNEL_MAP[slug] || 'CH-01-CRT-TELEMETRY';
      const category = 'generative-matrix';
      const hasExperimentJs = fs.existsSync(path.join(dirPath, 'experiment.js'));
      const hasIndexHtml = fs.existsSync(path.join(dirPath, 'index.html'));

      const title = TITLE_OVERRIDES[slug] || slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      projectData = {
        id: `EXP-${String(expIndex).padStart(3, '0')}`,
        slug: slug,
        title: title,
        year: 2026,
        category: category,
        technology: hasExperimentJs ? 'Canvas 2D / Procedural' : 'WebGL / Canvas / Interactive',
        visualDNA_channel: channel,
        entryType: hasExperimentJs ? 'module' : 'iframe',
        entryPoint: hasExperimentJs ? `./projects/${slug}/experiment.js` : `./projects/${slug}/index.html`,
        parameters: {
          speed: { type: 'range', min: 0.1, max: 3.0, step: 0.1, default: 1.0 },
          intensity: { type: 'range', min: 0.1, max: 2.0, step: 0.1, default: 1.0 }
        },
        metadata: {
          author: 'Adib Zahran',
          seed: '0x' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase(),
          status: 'OPERATIONAL',
          lineage: 'REF-001',
          description: `Experimental generative visualization: ${title}.`
        }
      };

      fs.writeFileSync(jsonPath, JSON.stringify(projectData, null, 2));
      console.log(`Generated project.json for ${slug}`);
    } else {
      // Ensure entryType and entryPoint exist
      const hasExperimentJs = fs.existsSync(path.join(dirPath, 'experiment.js'));
      projectData.entryType = hasExperimentJs ? 'module' : 'iframe';
      projectData.entryPoint = hasExperimentJs ? `./projects/${slug}/experiment.js` : `./projects/${slug}/index.html`;
      fs.writeFileSync(jsonPath, JSON.stringify(projectData, null, 2));
    }

    allProjects.push(projectData);
    expIndex++;
  }

  // Write master catalog to projects/projects.json and dna/manifest.json
  try {
    const masterCatalogPath = path.join(projectsDir, 'projects.json');
    fs.writeFileSync(masterCatalogPath, JSON.stringify(allProjects, null, 2));

    const manifestPath = path.resolve(__dirname, '../../dna/manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(allProjects, null, 2));
    console.log(`\n✓ Generated master catalog: ${allProjects.length} projects in projects.json and dna/manifest.json`);
  } catch (err) {
    console.warn('[DISCOVERY] Could not write to disk (read-only filesystem):', err.message);
  }
  return allProjects;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scanAndGenerateProjects();
}

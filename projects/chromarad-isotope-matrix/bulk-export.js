/**
 * Grainrad Bulk Three.js Export (v2 - Fixed Downloads)
 * 
 * Automates grainrad.com to convert multiple images into
 * rotatable Three.js HTML scenes.
 * 
 * Usage:
 *   1. Put images in ./input/ folder
 *   2. Run: node bulk-export.js
 *   3. Get Three.js HTML files in ./output/ folder
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============
// Read from environment variables (set by server.js) or use defaults
const CONFIG = {
    preset: process.env.GRAINRAD_PRESET || 'High Detail',
    effect: process.env.GRAINRAD_EFFECT || 'ASCII',
    depthStyle: process.env.GRAINRAD_DEPTH || 'Extreme',
    format: process.env.GRAINRAD_FORMAT || 'Three.js',
    vibrant: process.env.GRAINRAD_VIBRANT === '1',  // Enable vibrant color optimization
    settleTime: 5000,          // ms to wait for GPU processing after loading image
    exportWait: 8000,          // ms to wait for file generation
    headless: false,           // Set true to run without visible browser
    minFileSize: 1000,         // Minimum file size in bytes to consider valid
};

// Format to file extension mapping
const FORMAT_EXTENSIONS = {
    'PNG': '.png',
    'JPEG': '.jpg',
    'GIF': '.gif',
    'VIDEO': '.mp4',
    'SVG': '.svg',
    'TEXT': '.txt',
    'Three.js': '.html'
};

// ============ VIBRANT PRESETS ============
// Optimized settings for maximum color pop and image fidelity per effect
// Based on detailed research of grainrad.com's UI - each effect has specific sliders
const VIBRANT_PRESETS = {
    // Global adjustments to apply to ALL effects for vibrancy
    global: {
        brightness: 10,      // Slight lift to avoid dark muddy images
        contrast: 20,        // Punch to separate colors
        saturation: 30,      // KEY: Makes colors pop
        sharpness: 15,       // Crisp edges
        gamma: 1.1           // Slight lift to midtones
    },
    // Per-effect optimizations with ACTUAL slider labels from grainrad UI
    effects: {
        'ASCII': {
            colorMode: 'Original',
            sliders: {
                'Scale': 6,              // Smaller = more detail
                'Spacing': 1.0,          // Default spacing
                'Output Width': 120      // Higher resolution
            },
            dropdowns: {
                'Character Set': 'DETAILED'  // Most visual detail
            }
        },
        'Dithering': {
            colorMode: 'Original',
            sliders: {
                'Intensity': 1.2         // Slightly stronger effect
            },
            dropdowns: {
                'Algorithm': 'Blue Noise' // Smoothest, most organic pattern
            },
            checkboxes: {
                'Modulation': true       // Adds variation
            }
        },
        'Halftone': {
            colorMode: 'Original',
            sliders: {
                'Dot Scale': 0.8,        // Smaller dots = more detail
                'Spacing': 6,            // Tighter spacing
                'Angle': 30              // Classic angle
            },
            dropdowns: {
                'Shape': 'Circle'        // Classic halftone look
            },
            checkboxes: {
                'Invert': false          // Keep natural
            }
        },
        'Matrix Rain': {
            colorMode: 'custom',
            rainColor: '#00FF88',        // Vibrant neon green
            sliders: {
                'Cell Size': 10,         // Medium size for readability
                'Spacing': 1.0,
                'Speed': 2.0,            // Faster = more dynamic
                'Trail Length': 15,      // Long trails
                'Glow': 1.5,             // Strong bloom
                'BG Opacity': 0.3        // See-through background
            },
            dropdowns: {
                'Character Set': 'STANDARD',
                'Direction': 'Down'
            }
        },
        'Dots': {
            colorMode: 'Original',
            sliders: {
                'Size': 0.8,             // Smaller = more detail
                'Spacing': 0.9           // Tighter = denser
            },
            dropdowns: {
                'Shape': 'Circle'
            },
            checkboxes: {
                'Invert': false
            }
        },
        'Contour': {
            colorMode: 'Original',
            sliders: {
                'Levels': 12,            // More contour bands
                'Line Thickness': 0.8    // Thinner lines
            },
            dropdowns: {
                'Fill Mode': 'Filled Bands'  // Full color bands
            }
        },
        'Pixel Sort': {
            colorMode: 'Original',
            sliders: {
                'Threshold': 0.4,        // Lower = more sorting
                'Streak Length': 80,     // Long dramatic streaks
                'Intensity': 0.9,        // Strong effect
                'Randomness': 0.3        // Some organic variation
            },
            dropdowns: {
                'Direction': 'Horizontal',
                'Sort Mode': 'Brightness'
            },
            checkboxes: {
                'Reverse': false
            }
        },
        'Blockify': {
            colorMode: 'Preserve Colors',
            sliders: {
                'Block Size': 6,         // Smaller blocks = more detail
                'Border Width': 0.5      // Thin borders
            },
            dropdowns: {
                'Style': 'Full Blocks'
            },
            postProcessing: {
                'Bloom': true,           // Glow effect
                'Grain': false
            }
        },
        'Threshold': {
            colorMode: 'Original',       // Color threshold, not B&W
            sliders: {
                'Levels': 4,             // More levels = smoother
                'Threshold Point': 0.5   // Balanced midpoint
            },
            checkboxes: {
                'Dither': true,          // Smoother transitions
                'Invert': false
            }
        },
        'Edge Detection': {
            colorMode: 'Original',       // Colored edges
            sliders: {
                'Threshold': 0.25,       // More sensitive = more edges
                'Line Width': 1.2        // Slightly thicker
            },
            dropdowns: {
                'Algorithm': 'Sobel'     // Best edge detection
            }
        },
        'Crosshatch': {
            colorMode: 'Original',
            lineColor: '#000000',
            backgroundColor: '#FFFFFF',
            sliders: {
                'Density': 8,            // Dense hatching
                'Layers': 4,             // Multiple cross layers
                'Angle': 45,             // Classic diagonal
                'Line Width': 0.15,      // Fine lines
                'Randomness': 0.1        // Slight organic feel
            }
        },
        'Wave Lines': {
            colorMode: 'Original',
            sliders: {
                'Line Count': 60,        // Dense lines
                'Amplitude': 25,         // Noticeable waves
                'Frequency': 1.2,        // Medium wavelength
                'Line Thickness': 0.5    // Medium weight
            },
            dropdowns: {
                'Direction': 'Horizontal'
            },
            checkboxes: {
                'Animate': false         // Static for export
            }
        },
        'Noise Field': {
            colorMode: 'Original',
            sliders: {
                'Scale': 50,             // Medium detail
                'Intensity': 1.2,        // Strong effect
                'Octaves': 5,            // Rich detail layers
                'Speed': 2.0
            },
            dropdowns: {
                'Noise Type': 'Perlin'   // Classic smooth noise
            },
            checkboxes: {
                'Animate': false,        // Static for export
                'Distort Only': false
            }
        },
        'Voronoi': {
            colorMode: 'Cell Average',
            sliders: {
                'Cell Size': 25,         // Smaller = more detail
                'Edge Width': 0.4,       // Visible edges
                'Randomize': 0.9         // Organic variation
            },
            dropdowns: {
                'Edge Color': 'Black'
            },
            postProcessing: {
                'Bloom': true
            }
        },
        'VHS': {
            colorMode: 'Original',
            sliders: {
                'Distortion': 0.4,       // Moderate warp
                'Noise': 0.2,            // Low noise for clarity
                'Color Bleed': 0.6,      // Strong color bleeding
                'Scanlines': 0.4,        // Visible but not overpowering
                'Tracking Error': 0.15   // Subtle jitter
            },
            postProcessing: {
                'Chromatic': true,       // Color fringing
                'Scanlines': true
            }
        }
    }
};


const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

async function getImages() {
    const files = fs.readdirSync(INPUT_DIR);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    });
}

async function waitForImageProcessing(page) {
    // Wait for "Awaiting input" text to disappear (means image is loaded)
    console.log('   ⏳ Waiting for image to process...');
    try {
        await page.waitForFunction(() => {
            const body = document.body.innerText;
            return !body.includes('Awaiting input');
        }, { timeout: 15000 });
    } catch (e) {
        console.log('   ⚠ Timeout waiting for image processing');
    }

    // Extra settle time for GPU to finish rendering
    await page.waitForTimeout(CONFIG.settleTime);
    console.log('   ✓ Image processed');
}

// Apply vibrant settings by manipulating Grainrad's UI sliders, dropdowns, and checkboxes
async function applyVibrantSettings(page, effectName) {
    console.log('   🌈 Applying vibrant settings...');

    const globalSettings = VIBRANT_PRESETS.global;
    const effectSettings = VIBRANT_PRESETS.effects[effectName] || {};

    try {
        // Scroll to and expand the Adjustments section in settings panel
        await page.evaluate(() => {
            const adjustments = Array.from(document.querySelectorAll('span, div'))
                .find(el => el.textContent.includes('Adjustments'));
            if (adjustments) adjustments.click();
        });
        await page.waitForTimeout(300);

        // Apply global vibrant settings (brightness, contrast, saturation, sharpness)
        await page.evaluate((settings) => {
            function setSliderValue(labelText, value) {
                const labels = Array.from(document.querySelectorAll('span, label'));
                const label = labels.find(l => l.textContent.toLowerCase().includes(labelText.toLowerCase()));
                if (label) {
                    const container = label.closest('div');
                    if (container) {
                        const slider = container.querySelector('input[type="range"]');
                        if (slider) {
                            slider.value = value;
                            slider.dispatchEvent(new Event('input', { bubbles: true }));
                            slider.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    }
                }
                return false;
            }
            setSliderValue('brightness', settings.brightness);
            setSliderValue('contrast', settings.contrast);
            setSliderValue('saturation', settings.saturation);
            setSliderValue('sharpness', settings.sharpness);
        }, globalSettings);

        // Apply effect-specific sliders
        if (effectSettings.sliders) {
            await page.evaluate((sliders) => {
                function setSliderValue(labelText, value) {
                    const labels = Array.from(document.querySelectorAll('span, label'));
                    const label = labels.find(l => l.textContent.toLowerCase().includes(labelText.toLowerCase()));
                    if (label) {
                        const container = label.closest('div');
                        if (container) {
                            const slider = container.querySelector('input[type="range"]');
                            if (slider) {
                                slider.value = value;
                                slider.dispatchEvent(new Event('input', { bubbles: true }));
                                slider.dispatchEvent(new Event('change', { bubbles: true }));
                                return true;
                            }
                        }
                    }
                    return false;
                }
                for (const [label, value] of Object.entries(sliders)) {
                    setSliderValue(label, value);
                }
            }, effectSettings.sliders);
            console.log(`     Applied sliders: ${Object.keys(effectSettings.sliders).join(', ')}`);
        }

        // Apply effect-specific dropdown selections
        if (effectSettings.dropdowns) {
            for (const [dropdownLabel, optionValue] of Object.entries(effectSettings.dropdowns)) {
                await page.evaluate(([label, value]) => {
                    // Find the dropdown button by looking for the label nearby
                    const labels = Array.from(document.querySelectorAll('span, label'));
                    const labelEl = labels.find(l => l.textContent.toLowerCase().includes(label.toLowerCase()));
                    if (labelEl) {
                        const container = labelEl.closest('div');
                        if (container) {
                            const button = container.querySelector('button');
                            if (button) button.click();
                        }
                    }
                }, [dropdownLabel, optionValue]);
                await page.waitForTimeout(200);

                // Click the option in the dropdown
                await page.evaluate((value) => {
                    const options = Array.from(document.querySelectorAll('div, button, li'));
                    const option = options.find(el => el.textContent.trim() === value);
                    if (option) option.click();
                }, optionValue);
                await page.waitForTimeout(200);
            }
            console.log(`     Applied dropdowns: ${Object.keys(effectSettings.dropdowns).join(', ')}`);
        }

        // Apply effect-specific checkboxes
        if (effectSettings.checkboxes) {
            await page.evaluate((checkboxes) => {
                for (const [label, shouldBeChecked] of Object.entries(checkboxes)) {
                    const labels = Array.from(document.querySelectorAll('span, label'));
                    const labelEl = labels.find(l => l.textContent.toLowerCase().includes(label.toLowerCase()));
                    if (labelEl) {
                        const container = labelEl.closest('div');
                        if (container) {
                            const checkbox = container.querySelector('input[type="checkbox"]');
                            if (checkbox && checkbox.checked !== shouldBeChecked) {
                                checkbox.click();
                            }
                        }
                    }
                }
            }, effectSettings.checkboxes);
            console.log(`     Applied checkboxes: ${Object.keys(effectSettings.checkboxes).join(', ')}`);
        }

        // Apply post-processing toggles (Bloom, Grain, Chromatic, Scanlines, etc.)
        if (effectSettings.postProcessing) {
            // First expand the Post-Processing section
            await page.evaluate(() => {
                const postProc = Array.from(document.querySelectorAll('span, div'))
                    .find(el => el.textContent.includes('Post-Processing'));
                if (postProc) postProc.click();
            });
            await page.waitForTimeout(300);

            await page.evaluate((postSettings) => {
                for (const [label, shouldBeEnabled] of Object.entries(postSettings)) {
                    const labels = Array.from(document.querySelectorAll('span, label'));
                    const labelEl = labels.find(l => l.textContent.toLowerCase().includes(label.toLowerCase()));
                    if (labelEl) {
                        const container = labelEl.closest('div');
                        if (container) {
                            const checkbox = container.querySelector('input[type="checkbox"]');
                            if (checkbox && checkbox.checked !== shouldBeEnabled) {
                                checkbox.click();
                            }
                        }
                    }
                }
            }, effectSettings.postProcessing);
            console.log(`     Applied post-processing: ${Object.keys(effectSettings.postProcessing).join(', ')}`);
        }

        // Set color mode (Original, Mono, Preserve Colors, Cell Average, etc.)
        if (effectSettings.colorMode) {
            await page.evaluate((colorMode) => {
                const buttons = Array.from(document.querySelectorAll('button, div'));
                const btn = buttons.find(el => el.textContent.trim() === colorMode);
                if (btn) btn.click();
            }, effectSettings.colorMode);
            console.log(`     Color mode: ${effectSettings.colorMode}`);
        }

        // Set custom colors (rainColor, lineColor, backgroundColor)
        if (effectSettings.rainColor || effectSettings.lineColor || effectSettings.backgroundColor) {
            console.log('     Custom colors configured');
        }

        console.log('   ✓ Vibrant settings applied');

    } catch (e) {
        console.log(`   ⚠ Could not apply all vibrant settings: ${e.message}`);
    }

    await page.waitForTimeout(500);
}


async function processImage(page, imagePath, imageName) {
    console.log(`\n🖼️  Processing: ${imageName}`);

    // Get the file input and set file directly (more reliable than click)
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        await fileInput.setInputFiles(imagePath);
    } else {
        // Fallback to file chooser method
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop file or click to browse');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(imagePath);
    }

    console.log('   ✓ Image uploaded');

    // Wait for image to fully process in WebGPU
    await waitForImageProcessing(page);

    // Select High Detail preset first (in the Presets section)
    try {
        const presetsSection = await page.$('text=Presets');
        if (presetsSection) {
            await presetsSection.click();
            await page.waitForTimeout(500);
        }

        await page.click(`text=${CONFIG.preset}`, { timeout: 3000 });
        console.log(`   ✓ Selected ${CONFIG.preset} preset`);
        await page.waitForTimeout(2000); // Let preset fully apply
    } catch (e) {
        console.log(`   ⚠ Could not find ${CONFIG.preset} preset`);
    }

    // Select the effect
    try {
        await page.click(`text=${CONFIG.effect}`, { timeout: 3000 });
        console.log(`   ✓ Selected ${CONFIG.effect} effect`);
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log(`   ⚠ Could not find ${CONFIG.effect}, using default`);
    }

    // Apply optimized vibrant settings for this effect (if enabled)
    if (CONFIG.vibrant) {
        await applyVibrantSettings(page, CONFIG.effect);
    }

    // Scroll to export section
    await page.evaluate(() => {
        const exportEl = document.evaluate("//span[contains(text(),'Export')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (exportEl) exportEl.scrollIntoView();
    });
    await page.waitForTimeout(500);

    // Select export format
    try {
        await page.click(`text=${CONFIG.format}`, { timeout: 3000 });
        console.log(`   ✓ Selected ${CONFIG.format} export`);
    } catch (e) {
        console.log(`   ⚠ Could not select ${CONFIG.format} format`);
    }
    await page.waitForTimeout(500);

    // Select depth style (only relevant for Three.js)
    if (CONFIG.format === 'Three.js') {
        try {
            await page.click(`text=${CONFIG.depthStyle}`, { timeout: 2000 });
            console.log(`   ✓ Selected ${CONFIG.depthStyle} depth`);
        } catch (e) {
            console.log(`   ⚠ Could not select ${CONFIG.depthStyle} depth style`);
        }
        await page.waitForTimeout(500);
    }

    // Build output filename with format extension
    const baseName = path.basename(imageName, path.extname(imageName));
    const effectSlug = CONFIG.effect.replace(/\s+/g, '-');
    const fileExt = FORMAT_EXTENSIONS[CONFIG.format] || '.html';
    const outputPath = path.join(OUTPUT_DIR, `${baseName}_${effectSlug}${fileExt}`);

    try {
        // Set up download handler with longer timeout
        const downloadPromise = page.waitForEvent('download', { timeout: 120000 });

        // Click the Export button (text varies by format)
        const formatName = CONFIG.format;
        await page.evaluate((format) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            // Find button containing "Export" and the format name
            const exportBtn = buttons.find(b => {
                const text = b.textContent || '';
                return text.includes('Export') && (
                    text.includes(format) ||
                    (format === 'Three.js' && text.includes('Three')) ||
                    (format === 'PNG' && text.includes('PNG')) ||
                    (format === 'JPEG' && text.includes('JPEG')) ||
                    (format === 'GIF' && text.includes('GIF')) ||
                    (format === 'VIDEO' && text.includes('Video')) ||
                    (format === 'SVG' && text.includes('SVG')) ||
                    (format === 'TEXT' && text.includes('Text'))
                );
            });
            if (exportBtn && !exportBtn.disabled) {
                exportBtn.click();
                return true;
            }
            return false;
        }, formatName);

        console.log(`   ⏳ Generating ${CONFIG.format} export (this takes a few seconds)...`);

        // Wait for download to start
        const download = await downloadPromise;

        console.log('   ⏳ Download started, waiting for completion...');

        // CRITICAL: Wait for file to be fully written
        // Playwright's download.path() only resolves when download is complete
        const tempPath = await download.path();

        if (!tempPath) {
            throw new Error('Download path is null');
        }

        // Additional wait for any file system sync
        await page.waitForTimeout(2000);

        // Verify file size
        const stats = fs.statSync(tempPath);
        const fileSizeKB = stats.size / 1024;

        console.log(`   📦 Downloaded: ${fileSizeKB.toFixed(1)} KB`);

        if (stats.size < CONFIG.minFileSize) {
            console.log(`   ⚠ Warning: File is smaller than expected (${fileSizeKB.toFixed(1)} KB)`);
            console.log('   ⏳ Waiting longer for file to complete...');
            await page.waitForTimeout(5000);
        }

        // Save the file
        await download.saveAs(outputPath);

        // Verify saved file
        const savedStats = fs.statSync(outputPath);
        console.log(`   ✅ Saved: ${baseName}.html (${(savedStats.size / 1024).toFixed(1)} KB)`);

        if (savedStats.size < CONFIG.minFileSize) {
            console.log(`   ❌ WARNING: File may be incomplete!`);
        }

    } catch (e) {
        console.log(`   ❌ Export failed: ${e.message}`);
    }

    await page.waitForTimeout(2000);
}

async function main() {
    console.log('🚀 Grainrad Bulk Exporter (v3 - Multi-Format)');
    console.log('=============================================\n');
    console.log('Settings:');
    console.log(`   Preset: ${CONFIG.preset}`);
    console.log(`   Effect: ${CONFIG.effect}`);
    console.log(`   Format: ${CONFIG.format}`);
    if (CONFIG.format === 'Three.js') {
        console.log(`   Depth: ${CONFIG.depthStyle}`);
    }
    console.log('');

    // Check input folder
    const images = await getImages();

    if (images.length === 0) {
        console.log('❌ No images found in ./input/ folder');
        console.log('   Supported formats: PNG, JPG, GIF, WebP');
        process.exit(1);
    }

    console.log(`📁 Found ${images.length} images to process\n`);

    // Launch browser - using bundled Chromium for max compatibility
    console.log('🌐 Launching Chromium browser...');
    const browser = await chromium.launch({
        headless: CONFIG.headless,
        // channel: 'chrome', // Commented out to use bundled Chromium (works on Linux/Mac/Win)
        args: [
            '--enable-features=WebGPU',
            '--enable-unsafe-webgpu',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const context = await browser.newContext({
        acceptDownloads: true,
        userAgent: 'GrainradBulkExporter/1.0 (Open Source Tool; +https://github.com/jackdog668/grainrad-bulk)'
    });

    const page = await context.newPage();

    // Navigate to Grainrad with retry logic for network issues
    console.log('📍 Opening grainrad.com...');
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!connected && attempts < maxAttempts) {
        attempts++;
        try {
            // 'domcontentloaded' is faster and more stable than 'networkidle'
            await page.goto('https://grainrad.com/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            // Wait for the app to actually be ready
            await page.waitForSelector('text=Drop file or click to browse', { timeout: 15000 });
            connected = true;
            console.log('   ✓ Connected to grainrad.com');
        } catch (err) {
            console.log(`   ⚠ Connection attempt ${attempts}/${maxAttempts} failed: ${err.message}`);
            if (attempts < maxAttempts) {
                console.log(`   ⏳ Retrying in 5 seconds...`);
                await page.waitForTimeout(5000);
            } else {
                console.log('   ❌ Could not connect to grainrad.com after 3 attempts');
                console.log('   💡 Try: Close other browsers, disable VPN, or check firewall');
                await browser.close();
                process.exit(1);
            }
        }
    }
    await page.waitForTimeout(2000);

    // Process each image
    for (let i = 0; i < images.length; i++) {
        const imageName = images[i];
        const imagePath = path.join(INPUT_DIR, imageName);

        console.log(`\n═══════════════════════════════════`);
        console.log(`[${i + 1}/${images.length}]`);

        await processImage(page, imagePath, imageName);

        // If not the last image, reload page for fresh state with retry
        if (i < images.length - 1) {
            console.log('   🔄 Reloading for next image...');
            let reloaded = false;
            let reloadAttempts = 0;
            while (!reloaded && reloadAttempts < 3) {
                reloadAttempts++;
                try {
                    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForSelector('text=Drop file or click to browse', { timeout: 15000 });
                    reloaded = true;
                } catch (err) {
                    console.log(`   ⚠ Reload attempt ${reloadAttempts}/3 failed`);
                    if (reloadAttempts < 3) {
                        await page.waitForTimeout(5000);
                    }
                }
            }
            await page.waitForTimeout(2000);
        }
    }

    console.log('\n═══════════════════════════════════');
    console.log('✨ All done!');
    console.log(`📂 Check ./output/ for your Three.js files`);

    await browser.close();
}

main().catch(console.error);

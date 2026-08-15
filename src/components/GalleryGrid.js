/**
 * CreativeCode.my — Living Gallery Grid & Filter Component
 */
import { PROJECTS } from "../../projects/index.js";
import { COLORWAYS } from "../../dna/engine/Colorways.js";
import { soundSynth } from "../../dna/engine/SoundSynth.js";

export class GalleryGridComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.projects = [...PROJECTS];
    this.activeCategory = "ALL";
    this.searchQuery = "";
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    const categories = ["ALL", ...new Set(PROJECTS.map((p) => p.category))];

    this.container.innerHTML = `
      <!-- Hero Telemetry Strip -->
      <section class="dna-hero-strip">
        <div class="hero-grid-bg"></div>
        <div class="hero-content">
          <div class="hero-title-group">
            <h1>LIVING VISUAL DNA & EXPERIMENTAL GENERATIVE GALLERY</h1>
            <div class="hero-methodology">
              METHODOLOGY: COLLECT <span>&rarr;</span> MEASURE <span>&rarr;</span> MAP <span>&rarr;</span> GENERATE <span>&rarr;</span> MUTATE <span>&rarr;</span> CRITIQUE <span>&rarr;</span> ENCODE
            </div>
          </div>

          <div class="hero-status-badges">
            <div class="dna-badge active-pulse">&#9679; ${PROJECTS.length} EXPERIMENTS ACTIVE</div>
            <div class="dna-badge">CANONICAL: cc-visual-dna</div>
            <button class="btn-secondary" id="randomExperimentBtn">&#9858; RANDOM LAUNCH</button>
          </div>
        </div>
      </section>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="search-input-wrap">
          <span class="search-icon">&#128269;</span>
          <input type="text" class="search-input" id="gallerySearchInput" placeholder="Search experiments, shaders, tags..." />
        </div>

        <div class="category-pills" id="categoryPills">
          ${categories
            .map(
              (cat) => `
            <button class="cat-pill ${cat === this.activeCategory ? "active" : ""}" data-category="${cat}">
              ${cat}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="colorway-picker">
          <span style="font-size: 10px; color: var(--dna-text-muted);">DNA PALETTE:</span>
          <select id="colorwaySelect">
            ${Object.values(COLORWAYS)
              .map(
                (cw) => `
              <option value="${cw.id}">${cw.name}</option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>

      <!-- Main Gallery Matrix -->
      <main class="gallery-container">
        <div class="artwork-grid" id="artworkGrid">
          <!-- Rendered dynamically -->
        </div>
      </main>
    `;

    this.bindEvents();
    this.updateGrid();
  }

  bindEvents() {
    // Search
    const search = this.container.querySelector("#gallerySearchInput");
    search.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.updateGrid();
    });

    // Categories
    const pills = this.container.querySelectorAll(".cat-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        this.activeCategory = pill.getAttribute("data-category");
        soundSynth.playClick();
        this.updateGrid();
      });
    });

    // Colorway Selector
    const colorSelect = this.container.querySelector("#colorwaySelect");
    colorSelect.addEventListener("change", (e) => {
      if (this.options.onColorwayChange) {
        this.options.onColorwayChange(e.target.value);
      }
    });

    // Random Launch
    const randomBtn = this.container.querySelector("#randomExperimentBtn");
    randomBtn.addEventListener("click", () => {
      const p = PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
      if (this.options.onLaunchStudio) {
        this.options.onLaunchStudio(p);
      }
    });
  }

  updateGrid() {
    const grid = this.container.querySelector("#artworkGrid");
    if (!grid) return;

    const filtered = PROJECTS.filter((p) => {
      const matchesCategory =
        this.activeCategory === "ALL" || p.category === this.activeCategory;
      const matchesSearch =
        !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        p.tags.some((t) => t.toLowerCase().includes(this.searchQuery));
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--dna-text-muted); border: 1px dashed var(--dna-border);">
          NO MATCHING EXPERIMENTS LOCATED IN DNA ARCHIVE.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (project) => `
        <article class="art-card" data-id="${project.id}">
          <div class="card-preview-stage">
            <iframe class="card-iframe-preview" src="${project.entry}" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe>
            <div class="card-preview-overlay">
              <span class="card-category-badge">${project.category}</span>
              <span class="card-category-badge" style="color: var(--dna-secondary);">${project.dnaRef}</span>
            </div>
          </div>

          <div class="card-info">
            <div class="card-title-row">
              <h2 class="card-title">${project.name}</h2>
            </div>
            <p class="card-desc">${project.description}</p>
            <div class="card-tags">
              ${project.tags.map((t) => `<span class="tag-badge">#${t}</span>`).join("")}
            </div>
          </div>

          <div class="card-action-bar">
            <span style="font-size: 11px; color: var(--dna-text-muted);">DNA SEED: 0x${project.id.slice(0, 4).toUpperCase()}</span>
            <button class="btn-primary launch-studio-btn" data-id="${project.id}">
              &gt; LAUNCH STUDIO
            </button>
          </div>
        </article>
      `
      )
      .join("");

    // Bind Launch Buttons
    grid.querySelectorAll(".launch-studio-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const p = PROJECTS.find((item) => item.id === id);
        if (p && this.options.onLaunchStudio) {
          this.options.onLaunchStudio(p);
        }
      });
    });

    // Clicking Card also launches
    grid.querySelectorAll(".art-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const p = PROJECTS.find((item) => item.id === id);
        if (p && this.options.onLaunchStudio) {
          this.options.onLaunchStudio(p);
        }
      });
    });
  }
}

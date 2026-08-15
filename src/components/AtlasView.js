/**
 * CreativeCode Visual DNA — Atlas & DNA Relationship Explorer Component
 * Fully responsive across Mobile, Tablet, and Desktop displays.
 */

export class AtlasView {
  /**
   * @param {HTMLElement} container
   * @param {Array} manifestList
   * @param {Array} channelsList
   * @param {Array} projectsList
   * @param {Function} onSelectProject
   */
  constructor(container, manifestList, channelsList, projectsList, onSelectProject) {
    this.container = container;
    this.manifest = manifestList;
    this.channels = channelsList;
    this.projects = projectsList;
    this.onSelectProject = onSelectProject;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="atlas-view-container" id="atlasMainView">
        <div class="atlas-header-banner">
          <div class="atlas-badge">GENEALOGY MATRIX // ARCHIVAL ATLAS</div>
          <h2 class="atlas-title">
            VISUAL DNA ATLAS & GENEALOGY MATRIX
          </h2>
          <p class="atlas-desc">
            Structured algorithmic lineage mapping from archival reference artifacts to clustered DNA channels and scalable procedural experiments.
          </p>
        </div>

        <div class="dna-matrix-responsive-wrapper">
          <table class="dna-matrix-table">
            <thead>
              <tr>
                <th style="width: 22%;">DNA CHANNEL</th>
                <th style="width: 24%;">REFERENCE SOURCE</th>
                <th style="width: 28%;">ARCHETYPAL TRAITS</th>
                <th style="width: 26%;">CONNECTED EXPERIMENTS</th>
              </tr>
            </thead>
            <tbody>
              ${this.channels.map(ch => {
                const ref = this.manifest.find(m => ch.lineage_refs?.includes(m.id)) || this.manifest[0];
                const linkedProjects = this.projects.filter(p => p.visualDNA_channel === ch.id);

                return `
                  <tr class="dna-channel-row">
                    <td data-label="DNA CHANNEL" class="cell-channel">
                      <div class="channel-id-badge">${ch.id}</div>
                      <div class="channel-name-text">${ch.name}</div>
                    </td>
                    <td data-label="REFERENCE SOURCE" class="cell-ref">
                      <strong style="color: var(--mono-white); font-size: 11px;">${ref?.id || 'REF'}</strong>
                      <div style="font-size: 11px; color: var(--mono-white); margin-top: 2px;">${ref?.title || 'Archival Reference'}</div>
                    </td>
                    <td data-label="ARCHETYPAL TRAITS" class="cell-traits">
                      <div class="traits-pill-group">
                        <div class="trait-line"><span class="trait-key">PALETTE:</span> ${ref?.traits?.palette?.join(', ') || 'Monochrome'}</div>
                        <div class="trait-line"><span class="trait-key">GEOMETRY:</span> ${ref?.traits?.geometry || 'Raster / Vector'}</div>
                        <div class="trait-line"><span class="trait-key">COMPOSITION:</span> ${ref?.traits?.composition || 'Algorithmic'}</div>
                      </div>
                    </td>
                    <td data-label="CONNECTED EXPERIMENTS" class="cell-experiments">
                      <div class="experiments-link-list">
                        ${linkedProjects.map(p => `
                          <button class="sys-btn select-exp-btn" data-slug="${p.slug}">
                            <span style="color: var(--signal-red); font-weight: 700;">&gt;</span>
                            <span>${p.title}</span>
                            <span class="exp-id-tag">(${p.id})</span>
                          </button>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.select-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-slug');
        if (this.onSelectProject) this.onSelectProject(slug);
      });
    });
  }

  show() {
    const el = this.container.querySelector('#atlasMainView');
    if (el) el.classList.add('active');
  }

  hide() {
    const el = this.container.querySelector('#atlasMainView');
    if (el) el.classList.remove('active');
  }
}

<script>
  import { onMount } from 'svelte';
  import {
    session,
    goTo,
    setTemplate,
    setCaption,
    toggleDate,
    setCustomTemplate,
    updateSlotAssignment,
    updateSlotTransform
  } from '#lib/stores/session.js';
  import { TEMPLATES, renderStripPreview } from '#lib/utils/canvas.js';
  import CustomTemplateBuilder from '#lib/components/custom/CustomTemplateBuilder.svelte';
  import TemplateLibraryModal from '#lib/components/custom/TemplateLibraryModal.svelte';
  import { getAllCustomTemplates } from '#lib/utils/customTemplateStorage.js';

  /** @type {HTMLCanvasElement} */
  let canvas;

  $: photos = $session.photos;
  $: templateKey = $session.selectedTemplate;
  $: customTemplateData = $session.customTemplateData;
  $: caption = $session.caption;
  $: showDate = $session.showDate;

  $: activeTemplate = customTemplateData || templateKey;

  // Custom template modal states
  let showBuilderModal = false;
  let builderEditingTemplate = null;
  let showLibraryModal = false;
  let customTemplatesList = [];
  let styleMode = customTemplateData ? 'custom' : 'presets'; // 'presets' | 'custom'

  $: if (canvas && photos.length) {
    renderPreview();
  }

  // Re-render when template/custom data/caption/date changes
  $: activeTemplate, caption, showDate, canvas && renderPreview();

  async function renderPreview() {
    if (!canvas) return;
    await renderStripPreview(canvas, photos, activeTemplate, { caption, showDate });
  }

  onMount(async () => {
    await refreshCustomTemplates();
    await renderPreview();
  });

  async function refreshCustomTemplates() {
    try {
      customTemplatesList = await getAllCustomTemplates();
    } catch (e) {
      console.error('Error refreshing custom templates:', e);
    }
  }

  function handleCaption(e) {
    setCaption(e.target.value);
  }

  function selectBuiltinTemplate(id) {
    styleMode = 'presets';
    setCustomTemplate(null);
    setTemplate(id);
  }

  function selectCustomTemplate(tmpl) {
    styleMode = 'custom';
    setCustomTemplate(tmpl);
    showLibraryModal = false;
  }

  function openCreateCustomTemplate() {
    builderEditingTemplate = null;
    showBuilderModal = true;
    showLibraryModal = false;
  }

  function openEditCurrentCustomTemplate() {
    builderEditingTemplate = customTemplateData;
    showBuilderModal = true;
  }

  function handleBuilderSaved(savedTemplate) {
    showBuilderModal = false;
    styleMode = 'custom';
    setCustomTemplate(savedTemplate);
    refreshCustomTemplates();
  }

  function handleSlotPhotoChange(slotId, photoIdx) {
    updateSlotAssignment(slotId, photoIdx);
  }

  function handleSlotScaleChange(slotId, scale) {
    updateSlotTransform(slotId, { scale });
  }

  const templateList = Object.values(TEMPLATES);
</script>

<section class="editor-screen screen-enter">
  <header class="editor-header">
    <button
      class="btn btn-ghost btn-sm"
      on:click={() => goTo('review')}
      aria-label="Back to photo review"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Review
    </button>
    <h1 class="editor-title">Design Strip</h1>
    <button
      id="btn-continue-to-print"
      class="btn btn-primary btn-sm"
      on:click={() => goTo('print')}
    >
      Print →
    </button>
  </header>

  <div class="editor-body">
    <!-- Left: Strip preview (main focus) -->
    <div class="strip-preview-col">
      <div class="strip-container">
        <div class="strip-shadow"></div>
        <canvas
          bind:this={canvas}
          class="strip-canvas"
          width="300"
          height="900"
          aria-label="Photo strip preview"
        ></canvas>
      </div>
      <p class="strip-note">Preview • actual output will be 1200 × 1800px (4R sheet)</p>
    </div>

    <!-- Right: Controls -->
    <div class="controls-col">
      <!-- Style Selector -->
      <div class="control-section">
        <div class="style-header-row">
          <h2 class="control-label" style="margin-bottom:0">Style &amp; Frame</h2>
          <div class="style-category-tabs" role="tablist">
            <button
              class="style-tab-btn"
              class:active={styleMode === 'presets'}
              on:click={() => { styleMode = 'presets'; setCustomTemplate(null); }}
              role="tab"
              aria-selected={styleMode === 'presets'}
            >
              Classic Presets
            </button>
            <button
              id="btn-custom-templates-tab"
              class="style-tab-btn"
              class:active={styleMode === 'custom'}
              on:click={() => {
                styleMode = 'custom';
                if (!customTemplateData && customTemplatesList.length > 0) {
                  setCustomTemplate(customTemplatesList[0]);
                }
              }}
              role="tab"
              aria-selected={styleMode === 'custom'}
            >
              Custom Frames
            </button>
          </div>
        </div>

        {#if styleMode === 'presets'}
          <!-- Built-in 4 Presets -->
          <div class="template-grid" role="group" aria-label="Strip style options">
            {#each templateList as tmpl}
              <button
                id="btn-template-{tmpl.id}"
                class="template-btn"
                class:selected={templateKey === tmpl.id && !customTemplateData}
                on:click={() => selectBuiltinTemplate(tmpl.id)}
                aria-pressed={templateKey === tmpl.id && !customTemplateData}
                aria-label="{tmpl.label} style"
              >
                <!-- Mini strip preview swatch -->
                <div class="template-swatch" style="background: {tmpl.bg}; border-color: {tmpl.frameBg};">
                  <div class="swatch-header" style="background: {tmpl.headerBg};"></div>
                  <div class="swatch-photo" style="background: {tmpl.frameBg}22;"></div>
                  <div class="swatch-photo" style="background: {tmpl.frameBg}22;"></div>
                  <div class="swatch-photo" style="background: {tmpl.frameBg}22;"></div>
                  <div class="swatch-footer" style="background: {tmpl.footerBg};"></div>
                </div>
                <span class="template-label">{tmpl.label}</span>
              </button>
            {/each}
          </div>

          <div class="custom-prompt-banner">
            <span>Want custom artwork frames or asymmetric photo slots?</span>
            <button class="btn btn-secondary btn-xs" on:click={openCreateCustomTemplate}>
              + Create Custom Template
            </button>
          </div>
        {:else}
          <!-- Custom Template Active Panel -->
          <div class="custom-template-active-box">
            {#if customTemplateData}
              <div class="active-tmpl-card">
                <div class="tmpl-badge">Active Custom Frame</div>
                <h3 class="tmpl-name">{customTemplateData.name}</h3>
                <p class="tmpl-meta">
                  {customTemplateData.slots?.length || 0} photo slots • 
                  {customTemplateData.artworkDataUrl ? 'Custom Artwork Overlay' : 'Geometric Slots'}
                </p>

                <div class="tmpl-button-row">
                  <button
                    id="btn-edit-custom-template"
                    class="btn btn-secondary btn-sm"
                    on:click={openEditCurrentCustomTemplate}
                  >
                    ✏️ Edit Slots &amp; Artwork
                  </button>
                  <button
                    id="btn-open-template-library"
                    class="btn btn-ghost btn-sm"
                    on:click={() => { showLibraryModal = true; }}
                  >
                    Browse Library
                  </button>
                </div>
              </div>

              <!-- Manual Photo Assignment Panel (Section 5) -->
              <div class="photo-assignment-panel">
                <h3 class="assignment-panel-title">Photo Assignment per Slot</h3>
                <p class="assignment-panel-sub">
                  Map captured countdown photos to individual frame slots:
                </p>

                <div class="slot-mapping-grid">
                  {#each customTemplateData.slots as slot, sIdx (slot.id)}
                    <div class="slot-map-row">
                      <div class="slot-badge-group">
                        <span class="slot-mini-num">#{sIdx + 1}</span>
                        <span class="slot-mini-name">{slot.name}</span>
                        <span class="slot-shape-tag">{slot.type}</span>
                      </div>

                      <div class="slot-controls-right">
                        <!-- Photo Selector -->
                        <select
                          class="select-input slot-select"
                          value={slot.assignedPhotoIndex}
                          on:change={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            handleSlotPhotoChange(slot.id, val);
                          }}
                          aria-label="Assign photo to {slot.name}"
                        >
                          <option value="">— Empty slot —</option>
                          {#each photos as photoUrl, pIdx}
                            <option value={pIdx}>
                              Countdown Photo #{pIdx + 1}
                            </option>
                          {/each}
                        </select>

                        <!-- Thumbnail Preview -->
                        {#if slot.assignedPhotoIndex !== null && photos[slot.assignedPhotoIndex]}
                          <div class="slot-map-thumb">
                            <img src={photos[slot.assignedPhotoIndex]} alt="Assigned to {slot.name}" />
                          </div>
                        {/if}

                        <!-- Quick Zoom Adjustment -->
                        <div class="quick-zoom-wrapper" title="Photo Zoom">
                          <input
                            type="range"
                            min="0.8"
                            max="2.5"
                            step="0.05"
                            value={slot.scale ?? 1.0}
                            on:input={(e) => handleSlotScaleChange(slot.id, Number(e.target.value))}
                            class="zoom-slider-mini"
                          />
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="no-custom-active">
                <p>No custom template selected.</p>
                <div class="custom-empty-actions">
                  <button class="btn btn-primary btn-sm" on:click={openCreateCustomTemplate}>
                    + Create Custom Template
                  </button>
                  <button class="btn btn-secondary btn-sm" on:click={() => { showLibraryModal = true; }}>
                    Browse Library
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Caption input -->
      <div class="control-section">
        <h2 class="control-label">Caption</h2>
        <input
          id="caption-input"
          type="text"
          class="input"
          placeholder="Add a caption…"
          value={caption}
          on:input={handleCaption}
          maxlength="30"
          aria-label="Strip caption text"
        />
        <p class="input-hint">{caption.length}/30 characters</p>
      </div>

      <!-- Date toggle -->
      <div class="control-section">
        <label class="toggle-row" for="date-toggle">
          <div class="toggle-info">
            <span class="control-label" style="margin-bottom:0">Date stamp</span>
            <span class="toggle-sub">Show today's date on the strip</span>
          </div>
          <button
            id="date-toggle"
            role="switch"
            aria-checked={showDate}
            class="toggle"
            class:on={showDate}
            on:click={toggleDate}
            aria-label="Toggle date stamp"
          >
            <div class="toggle-thumb"></div>
          </button>
        </label>
      </div>

      <!-- Continue CTA (mobile duplicate) -->
      <div class="continue-cta">
        <button
          id="btn-go-print"
          class="btn btn-primary btn-full"
          on:click={() => goTo('print')}
        >
          Continue to Print
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Modals -->
{#if showBuilderModal}
  <CustomTemplateBuilder
    initialTemplate={builderEditingTemplate}
    onClose={() => { showBuilderModal = false; }}
    onSaveAndApply={handleBuilderSaved}
  />
{/if}

{#if showLibraryModal}
  <TemplateLibraryModal
    onClose={() => { showLibraryModal = false; }}
    onSelectTemplate={selectCustomTemplate}
    onEditTemplate={(tmpl) => {
      builderEditingTemplate = tmpl;
      showLibraryModal = false;
      showBuilderModal = true;
    }}
    onCreateNew={openCreateCustomTemplate}
  />
{/if}

<style>
  .editor-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
  }

  /* Header */
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1.5px solid var(--color-border);
    background: var(--color-surface);
    gap: var(--space-3);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .editor-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-ink);
  }

  /* Body layout */
  .editor-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-5);
    overflow-y: auto;
  }

  @media (min-width: 768px) {
    .editor-body {
      flex-direction: row;
      align-items: flex-start;
      max-width: 960px;
      margin: 0 auto;
      width: 100%;
      padding: var(--space-6);
    }
  }

  /* Strip preview column */
  .strip-preview-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .strip-container {
    position: relative;
  }

  .strip-shadow {
    position: absolute;
    bottom: -12px;
    left: 8px;
    right: 8px;
    height: 24px;
    background: rgba(28, 25, 23, 0.2);
    border-radius: var(--radius-full);
    filter: blur(12px);
  }

  .strip-canvas {
    width: 200px;
    height: 600px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    display: block;
    position: relative;
    z-index: 1;
  }

  @media (min-width: 768px) {
    .strip-canvas {
      width: 240px;
      height: 720px;
    }
  }

  .strip-note {
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-align: center;
  }

  /* Controls column */
  .controls-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
  }

  .control-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .control-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-ink);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .style-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .style-category-tabs {
    display: flex;
    background: var(--color-border);
    border-radius: var(--radius-full);
    padding: 2px;
  }

  .style-tab-btn {
    border: none;
    background: transparent;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-ink-light);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .style-tab-btn.active {
    background: white;
    color: var(--color-accent);
    box-shadow: var(--shadow-sm);
  }

  /* Template grid */
  .template-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }

  .template-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    padding: 0;
    background: none;
    border: none;
    transition: transform var(--transition-base);
  }

  .template-btn:hover {
    transform: translateY(-2px);
  }

  .template-swatch {
    width: 100%;
    aspect-ratio: 1 / 2.8;
    border-radius: var(--radius-md);
    border: 2px solid;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow var(--transition-base);
  }

  .template-btn.selected .template-swatch {
    box-shadow: 0 0 0 3px var(--color-highlight), var(--shadow-md);
  }

  .swatch-header {
    height: 12%;
    flex-shrink: 0;
  }

  .swatch-footer {
    height: 12%;
    flex-shrink: 0;
  }

  .swatch-photo {
    flex: 1;
    margin: 2px 4px;
    border-radius: 2px;
  }

  .template-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-ink-light);
    text-align: center;
  }

  .template-btn.selected .template-label {
    color: var(--color-ink);
  }

  .custom-prompt-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-xs);
    color: #1E40AF;
  }

  .btn-xs {
    padding: 4px 10px;
    font-size: 11px;
  }

  /* Custom Template Active Card */
  .custom-template-active-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .active-tmpl-card {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .tmpl-badge {
    align-self: flex-start;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-accent);
    background: #EFF6FF;
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .tmpl-name {
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-ink);
  }

  .tmpl-meta {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-ink-light);
  }

  .tmpl-button-row {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  /* Photo Assignment Panel */
  .photo-assignment-panel {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .assignment-panel-title {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-ink);
  }

  .assignment-panel-sub {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-ink-light);
  }

  .slot-mapping-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .slot-map-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    gap: var(--space-2);
  }

  .slot-badge-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
  }

  .slot-mini-num {
    background: var(--color-accent);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: var(--font-mono);
  }

  .slot-mini-name {
    font-weight: 600;
    color: var(--color-ink);
  }

  .slot-shape-tag {
    font-size: 9px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .slot-controls-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .slot-select {
    font-size: 11px;
    padding: 4px 6px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: white;
    max-width: 140px;
  }

  .slot-map-thumb {
    width: 24px;
    height: 32px;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .slot-map-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .quick-zoom-wrapper {
    display: flex;
    align-items: center;
    width: 50px;
  }

  .zoom-slider-mini {
    width: 100%;
    cursor: pointer;
  }

  .no-custom-active {
    padding: var(--space-5);
    background: var(--color-surface);
    border: 1.5px dashed var(--color-border);
    border-radius: var(--radius-lg);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-muted);
  }

  .custom-empty-actions {
    display: flex;
    gap: var(--space-2);
  }

  /* Input */
  .input-hint {
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-align: right;
    margin-top: -var(--space-1);
  }

  /* Toggle */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    cursor: pointer;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toggle-sub {
    font-size: var(--text-xs);
    color: var(--color-muted);
  }

  .toggle {
    width: 44px;
    height: 24px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    border: none;
    cursor: pointer;
    position: relative;
    transition: background var(--transition-base);
    flex-shrink: 0;
  }

  .toggle.on {
    background: var(--color-accent);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    background: white;
    box-shadow: var(--shadow-sm);
    transition: left var(--transition-base);
  }

  .toggle.on .toggle-thumb {
    left: 23px;
  }

  .toggle:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Continue CTA */
  .continue-cta {
    margin-top: var(--space-3);
  }

  @media (min-width: 768px) {
    .continue-cta {
      display: none;
    }
  }
</style>

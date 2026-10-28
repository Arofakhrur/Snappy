<script lang="ts">
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
  } from '#lib/stores/session';
  import { TEMPLATES, PRODUK, renderStripPreview } from '#lib/utils/canvas';
  import CustomTemplateBuilder from './CustomTemplateBuilder.svelte';
  import TemplateLibraryModal from './TemplateLibraryModal.svelte';
  import { getAllCustomTemplates } from '#lib/utils/customTemplateStorage';
  import type { CustomTemplate } from '#lib/types';

  let canvas: HTMLCanvasElement;

  $: photos = $session.photos;
  $: templateKey = $session.selectedTemplate;
  $: customTemplateData = $session.customTemplateData;
  $: caption = $session.caption;
  $: showDate = $session.showDate;

  $: activeTemplate = customTemplateData || templateKey;

  // Produk aktif = ukuran cetak nyata per jumlah foto; kanvas pratinjau
  // memakai rasio & resolusi produk (setengah px cetak) supaya
  // pratinjau = miniatur persis hasil cetak.
  $: produk = PRODUK[$session.photoCount] || PRODUK[4];

  // Custom template modal states
  let showBuilderModal = false;
  let builderEditingTemplate: CustomTemplate | null = null;
  let showLibraryModal = false;
  let customTemplatesList: CustomTemplate[] = [];
  let styleMode: 'presets' | 'custom' = customTemplateData ? 'custom' : 'presets'; // 'presets' | 'custom'

  $: if (canvas && photos.length) {
    renderPreview();
  }

  // Re-render when template/custom data/caption/date changes
  $: activeTemplate, caption, showDate, canvas && renderPreview();

  async function renderPreview(): Promise<void> {
    if (!canvas) return;
    const p = PRODUK[$session.photoCount] || PRODUK[4];
    canvas.width = Math.round(p.pxW / 2);
    canvas.height = Math.round(p.pxH / 2);
    canvas.style.aspectRatio = `${p.pxW} / ${p.pxH}`;
    // Produk menyamping (Big shot): kertas lebar, kurangi tinggi tampil
    canvas.style.height = p.sheetOrient === 'landscape' ? 'clamp(230px, 30vh, 320px)' : '';
    await renderStripPreview(canvas, photos, activeTemplate, { caption, showDate });
  }

  onMount(async () => {
    await refreshCustomTemplates();
    await renderPreview();
  });

  async function refreshCustomTemplates(): Promise<void> {
    try {
      customTemplatesList = await getAllCustomTemplates();
    } catch (e) {
      console.error('Error refreshing custom templates:', e);
    }
  }

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  let enableCaption = Boolean($session.caption);

  function toggleCaptionEnable(): void {
    enableCaption = !enableCaption;
    if (!enableCaption) {
      setCaption('');
    }
  }

  function handleCaption(e: Event): void {
    setCaption((e.currentTarget as HTMLInputElement).value);
  }

  function selectBuiltinTemplate(id: string): void {
    styleMode = 'presets';
    setCustomTemplate(null);
    setTemplate(id);
  }

  function selectCustomTemplate(tmpl: CustomTemplate): void {
    styleMode = 'custom';
    setCustomTemplate(tmpl);
    showLibraryModal = false;
  }

  function openCreateCustomTemplate(): void {
    builderEditingTemplate = null;
    showBuilderModal = true;
    showLibraryModal = false;
  }

  function openEditCurrentCustomTemplate(): void {
    builderEditingTemplate = customTemplateData;
    showBuilderModal = true;
  }

  function handleBuilderSaved(savedTemplate: CustomTemplate): void {
    showBuilderModal = false;
    styleMode = 'custom';
    setCustomTemplate(savedTemplate);
    refreshCustomTemplates();
  }

  function handleSlotPhotoChange(slotId: string, photoIdx: number | null): void {
    updateSlotAssignment(slotId, photoIdx);
  }

  function handleSlotScaleChange(slotId: string, scale: number): void {
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
      <p class="strip-note">Preview • output: {produk.nama} {produk.cm} cm di lembar 4R</p>
    </div>

    <!-- Right: Controls -->
    <div class="controls-col">
      <!-- 1. Compact Checklist Toolbar (Date & Caption) -->
      <div class="compact-details-card">
        <div class="compact-card-header">
          <span class="compact-card-title">Teks &amp; Tanggal</span>
          <span class="compact-card-hint">Klik checklist untuk mengaktifkan</span>
        </div>

        <div class="compact-checklist-row">
          <!-- Date Stamp Checklist Pill -->
          <button
            type="button"
            class="checklist-pill"
            class:active={showDate}
            on:click={toggleDate}
            aria-pressed={showDate}
          >
            <span class="custom-checkbox" class:checked={showDate}>
              {#if showDate}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {/if}
            </span>
            <span class="pill-label">Date Stamp</span>
            <span class="pill-badge">{todayStr}</span>
          </button>

          <!-- Add Caption Checklist Pill -->
          <button
            type="button"
            class="checklist-pill"
            class:active={enableCaption}
            on:click={toggleCaptionEnable}
            aria-pressed={enableCaption}
          >
            <span class="custom-checkbox" class:checked={enableCaption}>
              {#if enableCaption}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {/if}
            </span>
            <span class="pill-label">Add Caption</span>
          </button>
        </div>

        <!-- Inline Expandable Caption Input -->
        {#if enableCaption}
          <div class="inline-caption-wrap">
            <div class="caption-input-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="caption-icon">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <input
                id="caption-input"
                type="text"
                class="compact-input"
                placeholder="Ketik caption strip di sini (maks 30 huruf)…"
                value={caption}
                on:input={handleCaption}
                maxlength="30"
                aria-label="Teks caption strip"
              />
              <span class="caption-count-badge">{caption.length}/30</span>
              {#if caption}
                <button
                  type="button"
                  class="caption-clear-btn"
                  on:click={() => setCaption('')}
                  title="Hapus caption"
                  aria-label="Hapus caption"
                >✕</button>
              {/if}
            </div>
          </div>
        {/if}
      </div>

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
                <!-- Mini strip preview swatch: kertas + slot papan catur + garis rambut -->
                <div class="template-swatch" style="background: {tmpl.bg}; border-color: {tmpl.hairline};">
                  <div class="swatch-photo" style="background: repeating-linear-gradient(45deg, {tmpl.checkerA} 0 4px, {tmpl.checkerB} 4px 8px);"></div>
                  <div class="swatch-photo" style="background: repeating-linear-gradient(45deg, {tmpl.checkerA} 0 4px, {tmpl.checkerB} 4px 8px);"></div>
                  <div class="swatch-photo" style="background: repeating-linear-gradient(45deg, {tmpl.checkerA} 0 4px, {tmpl.checkerB} 4px 8px);"></div>
                  <div class="swatch-footer">
                    <span style="color: {tmpl.ink};">Aa</span>
                    <span style="background: {tmpl.accent};"></span>
                  </div>
                </div>
                <span class="template-label">{tmpl.label}</span>
              </button>
            {/each}
          </div>

          <div class="custom-prompt-banner">
            <span>Want custom artwork frames or asymmetric photo slots?</span>
            <button class="btn btn-secondary btn-xs inline-icon-btn" on:click={openCreateCustomTemplate}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Custom Template</span>
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
                    class="btn btn-secondary btn-sm inline-icon-btn"
                    on:click={openEditCurrentCustomTemplate}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                    <span>Edit Slots &amp; Artwork</span>
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
                            const el = e.currentTarget as HTMLSelectElement;
                            const val = el.value === '' ? null : Number(el.value);
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
                            on:input={(e) => handleSlotScaleChange(slot.id, Number((e.currentTarget as HTMLInputElement).value))}
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

      <!-- Continue to Print Action -->
      <div class="editor-action-bar">
        <button
          id="btn-go-print"
          class="btn btn-primary btn-full btn-lg action-print-btn"
          on:click={() => goTo('print')}
        >
          <span>Lanjut ke Cetak (Print &amp; Share)</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
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
    height: 100dvh;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    overflow: hidden;
  }

  /* Header */
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1.5px solid var(--color-border);
    background: var(--color-surface);
    gap: var(--space-3);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .editor-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-ink);
  }

  /* Body layout */
  .editor-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    overflow-y: auto;
  }

  @media (min-width: 768px) {
    .editor-body {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      max-width: 1040px;
      margin: 0 auto;
      width: 100%;
      padding: var(--space-3) var(--space-6);
      gap: 32px;
      overflow: hidden;
    }
  }

  /* Strip preview column */
  .strip-preview-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .strip-container {
    position: relative;
  }

  .strip-shadow {
    position: absolute;
    bottom: -10px;
    left: 8px;
    right: 8px;
    height: 20px;
    background: rgba(28, 25, 23, 0.2);
    border-radius: var(--radius-full);
    filter: blur(10px);
  }

  .strip-canvas {
    width: auto;
    height: clamp(380px, 60vh, 530px);
    /* fallback sebelum JS menyetel rasio per produk */
    aspect-ratio: 1 / 3;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: block;
    position: relative;
    z-index: 1;
  }

  .strip-note {
    font-size: 11px;
    color: var(--color-muted);
    text-align: center;
  }

  /* Controls column */
  .controls-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 440px;
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

  .swatch-footer {
    height: 16%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  .swatch-footer span:first-child {
    font-family: var(--font-display), 'Georgia', serif;
    font-size: 9px;
    line-height: 1;
  }

  .swatch-footer span:last-child {
    width: 7px;
    height: 2px;
    border-radius: 2px;
  }

  .swatch-photo {
    flex: 1;
    margin: 2px 4px;
    border-radius: 0;
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

  .inline-icon-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  /* Compact Details Checklist Card */
  .compact-details-card {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-shadow: var(--shadow-sm);
  }

  .compact-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .compact-card-title {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink);
  }

  .compact-card-hint {
    font-size: 11px;
    color: var(--color-muted);
  }

  .compact-checklist-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .checklist-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-bg);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 6px 12px;
    cursor: pointer;
    font-family: inherit;
    transition: all var(--transition-fast);
    text-align: left;
    user-select: none;
  }

  .checklist-pill:hover {
    border-color: var(--color-ink-light);
    background: var(--color-surface);
  }

  .checklist-pill.active {
    background: var(--color-accent-light);
    border-color: var(--color-accent);
  }

  .custom-checkbox {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1.5px solid var(--color-muted);
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }

  .custom-checkbox.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  .pill-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-ink);
    flex: 1;
    white-space: nowrap;
  }

  .checklist-pill.active .pill-label {
    color: var(--color-accent);
  }

  .pill-badge {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-ink-light);
    background: rgba(28, 25, 23, 0.05);
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  /* Inline Caption Input Box */
  .inline-caption-wrap {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .caption-input-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 6px 10px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .caption-input-box:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-light);
  }

  .caption-icon {
    color: var(--color-muted);
    flex-shrink: 0;
  }

  .compact-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: var(--text-xs);
    color: var(--color-ink);
    padding: 0;
    outline: none;
    font-family: inherit;
  }

  .compact-input::placeholder {
    color: var(--color-muted);
  }

  .caption-count-badge {
    font-size: 10px;
    color: var(--color-muted);
    font-family: var(--font-mono);
    flex-shrink: 0;
  }

  .caption-clear-btn {
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 12px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .caption-clear-btn:hover {
    color: var(--color-ink);
    background: var(--color-bg);
  }
</style>

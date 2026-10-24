<script>
  import { onMount } from 'svelte';
  import { session, goTo, resetSession } from '#lib/stores/session.js';
  import { renderExportCanvas } from '#lib/utils/canvas.js';
  import { downloadStripPNG, printStrip } from '#lib/utils/export.js';
  import PrinterIllus from '#lib/components/illustrations/PrinterIllus.svelte';

  /** @type {HTMLCanvasElement} */
  let previewCanvas;
  let isPrinting = false;
  let isDownloading = false;
  let downloadSuccess = false;
  let printError = null;

  $: photos = $session.photos;
  $: templateKey = $session.selectedTemplate;
  $: customTemplateData = $session.customTemplateData;
  $: caption = $session.caption;
  $: showDate = $session.showDate;

  $: activeTemplate = customTemplateData || templateKey;

  onMount(async () => {
    await drawSheetPreview();
  });

  async function drawSheetPreview() {
    if (!previewCanvas) return;
    try {
      const fullCanvas = await renderExportCanvas(photos, activeTemplate, { caption, showDate });
      const ctx = previewCanvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx.drawImage(fullCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    } catch (e) {
      console.error('Failed to render sheet preview:', e);
    }
  }

  async function handlePrint() {
    if (isPrinting) return;
    isPrinting = true;
    printError = null;
    try {
      await printStrip(photos, activeTemplate, { caption, showDate });
    } catch (err) {
      console.error('Print error:', err);
      printError = 'Unable to open print dialog. Try downloading the PNG instead.';
    } finally {
      isPrinting = false;
    }
  }

  async function handleDownload() {
    if (isDownloading) return;
    isDownloading = true;
    printError = null;
    try {
      await downloadStripPNG(photos, activeTemplate, { caption, showDate });
      downloadSuccess = true;
      setTimeout(() => {
        downloadSuccess = false;
      }, 4000);
    } catch (err) {
      console.error('Download error:', err);
      printError = 'Failed to generate download. Please try again.';
    } finally {
      isDownloading = false;
    }
  }

  function handleNewSession() {
    resetSession();
  }
</script>

<section class="print-screen screen-enter">
  <header class="print-header">
    <button
      class="btn btn-ghost btn-sm"
      on:click={() => goTo('editor')}
      aria-label="Back to photo strip editor"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Editor
    </button>
    <h1 class="print-header-title">Print & Export</h1>
    <button
      id="btn-header-new-session"
      class="btn btn-ghost btn-sm"
      on:click={handleNewSession}
      aria-label="Start a new session"
    >
      New Session
    </button>
  </header>

  <div class="print-body">
    <!-- Left Column: 4R Sheet Preview -->
    <div class="sheet-preview-col">
      <div class="sheet-card">
        <div class="sheet-badge">4 × 6" (4R) Sheet</div>
        <div class="canvas-wrapper">
          <canvas
            bind:this={previewCanvas}
            width="400"
            height="600"
            class="sheet-canvas"
            aria-label="4R printable sheet preview showing two side-by-side photo strips"
          ></canvas>
        </div>
        <p class="sheet-caption">Two identical strips with cutting guide line</p>
      </div>
    </div>

    <!-- Right Column: Actions and Print Guide -->
    <div class="print-details-col">
      <div class="print-hero-message">
        <h2 class="print-title">Your Strip is Ready!</h2>
        <p class="print-subtitle">
          Print directly to 4R photo paper or save a high-resolution 300 DPI PNG.
        </p>
      </div>

      {#if printError}
        <div class="alert alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{printError}</span>
        </div>
      {/if}

      {#if downloadSuccess}
        <div class="alert alert-success" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Photo strip downloaded successfully!</span>
        </div>
      {/if}

      <!-- Main Action Buttons -->
      <div class="action-buttons-group">
        <button
          id="btn-print"
          class="btn btn-primary btn-lg"
          on:click={handlePrint}
          disabled={isPrinting}
          aria-label="Print photo strip on 4R paper"
        >
          {#if isPrinting}
            <div class="btn-spinner" aria-hidden="true"></div>
            <span>Preparing Print…</span>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print 4R Photo Strip</span>
          {/if}
        </button>

        <button
          id="btn-download-png"
          class="btn btn-secondary btn-lg"
          on:click={handleDownload}
          disabled={isDownloading}
          aria-label="Download high-resolution PNG"
        >
          {#if isDownloading}
            <div class="btn-spinner" aria-hidden="true"></div>
            <span>Generating PNG…</span>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download PNG (1200 × 1800)</span>
          {/if}
        </button>
      </div>

      <!-- Print Settings Guidance -->
      <div class="guidance-card">
        <div class="guidance-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <h3 class="guidance-title">Printer Setup Checklist</h3>
        </div>
        <ul class="guidance-list">
          <li><strong>Paper Size:</strong> 4 × 6 inches (4R / Photo Paper)</li>
          <li><strong>Orientation:</strong> Portrait</li>
          <li><strong>Scale:</strong> 100% (Do not "Fit to Page")</li>
          <li><strong>Margins:</strong> None / Borderless</li>
          <li><strong>Background Graphics:</strong> Checked / ON</li>
        </ul>
        <div class="cutting-hint">
          ✂️ <strong>After printing:</strong> Cut along the center dashed line to separate into two 2 × 6" keepsake strips.
        </div>
      </div>

      <!-- New Session Reset Button -->
      <div class="new-session-container">
        <button
          id="btn-new-session"
          class="btn btn-ghost btn-full"
          on:click={handleNewSession}
          aria-label="Start over with a fresh session"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Start New Photobooth Session
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  .print-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
  }

  .print-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1.5px solid var(--color-border);
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .print-header-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-ink);
  }

  .print-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-5);
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
  }

  @media (min-width: 768px) {
    .print-body {
      flex-direction: row;
      align-items: flex-start;
      padding: var(--space-8);
      gap: var(--space-8);
    }
  }

  /* Sheet Preview Column */
  .sheet-preview-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
    width: 100%;
  }

  @media (min-width: 768px) {
    .sheet-preview-col {
      width: 340px;
    }
  }

  .sheet-card {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    max-width: 320px;
  }

  .sheet-badge {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-light);
    background: var(--color-bg);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  .canvas-wrapper {
    width: 100%;
    aspect-ratio: 2 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e7e2d9;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .sheet-canvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .sheet-caption {
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-align: center;
    margin: 0;
  }

  /* Print Details Column */
  .print-details-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
  }

  .print-hero-message {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .print-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-ink);
    line-height: 1.2;
    margin: 0;
  }

  .print-subtitle {
    color: var(--color-ink-light);
    font-size: var(--text-base);
    margin: 0;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .alert-error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .alert-success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  /* Action Buttons */
  .action-buttons-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .action-buttons-group .btn-lg {
    padding: var(--space-4) var(--space-5);
    font-size: var(--text-base);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .btn-secondary .btn-spinner {
    border: 2.5px solid rgba(28, 25, 23, 0.2);
    border-top-color: var(--color-ink);
  }

  /* Guidance Card */
  .guidance-card {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .guidance-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .guidance-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .guidance-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-ink-light);
  }

  .guidance-list li {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
  }

  .guidance-list strong {
    color: var(--color-ink);
  }

  .cutting-hint {
    margin-top: var(--space-2);
    padding: var(--space-3);
    background: #fffbeb;
    border: 1px dashed #fcd34d;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    color: #78350f;
    line-height: 1.5;
  }

  .new-session-container {
    margin-top: var(--space-2);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
  }
</style>

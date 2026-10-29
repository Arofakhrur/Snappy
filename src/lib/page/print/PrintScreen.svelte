<script lang="ts">
  import { onMount } from 'svelte';
  import { session, goTo, resetSession } from '#lib/stores/session';
  import { PRODUK, renderExportCanvas } from '#lib/utils/canvas';
  import { downloadStripPNG, printStrip } from '#lib/utils/export';
  import { saveGallerySession, buildQRCodeDataUrl, resolveGalleryUrl, generateId } from '#lib/services/gallery';
  import PrinterIllus from '#lib/features/print/PrinterIllus.svelte';

  let previewCanvas: HTMLCanvasElement;
  let isPrinting = false;
  let isDownloading = false;
  let downloadSuccess = false;
  let printError: string | null = null;

  // QR Gallery state
  let qrImageUrl: string | null = null;
  let galleryUrl: string | null = null;
  let galleryReady = false;
  let galleryError: string | null = null;
  let copiedUrl = false;
  let showPrinterInfo = false;

  $: photos = $session.photos;
  $: templateKey = $session.selectedTemplate;
  $: customTemplateData = $session.customTemplateData;
  $: caption = $session.caption;
  $: showDate = $session.showDate;

  $: activeTemplate = customTemplateData || templateKey;

  // Produk aktif = ukuran cetak nyata per jumlah foto
  $: produk = PRODUK[$session.photoCount] || PRODUK[4];
  $: sheetLandscape = produk.sheetOrient === 'landscape';
  $: copies = produk.copySheet;

  onMount(async () => {
    // Generate QR instantly without waiting for sheet canvas render
    generateGalleryQR();
    await drawSheetPreview();
  });

  async function drawSheetPreview(): Promise<void> {
    if (!previewCanvas) return;
    try {
      const fullCanvas = await renderExportCanvas(photos, activeTemplate, { caption, showDate });
      previewCanvas.width = fullCanvas.width > fullCanvas.height ? 600 : 400;
      previewCanvas.height = fullCanvas.width > fullCanvas.height ? 400 : 600;
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

  async function generateGalleryQR(): Promise<void> {
    try {
      // 1. Generate unique session ID immediately
      const sessionId = generateId();

      // 2. Resolve URL and generate QR code INSTANTLY
      galleryUrl = await resolveGalleryUrl(sessionId);
      qrImageUrl = await buildQRCodeDataUrl(galleryUrl, 360);
      galleryReady = true;

      // 3. Concurrently save session data to server & IndexedDB in the background
      (async () => {
        try {
          let stripDataUrl = '';
          try {
            const exportCanvas = await renderExportCanvas(photos, activeTemplate, { caption, showDate });
            stripDataUrl = exportCanvas.toDataURL('image/png');
          } catch (ce) {
            console.warn('Canvas export warning:', ce);
          }

          await saveGallerySession({
            id: sessionId,
            photos: (photos || []).filter(Boolean),
            stripDataUrl,
            templateKey: typeof activeTemplate === 'string' ? activeTemplate : 'custom',
            gifDataUrl: null,
          });
        } catch (saveErr) {
          console.warn('Background session save warning:', saveErr);
        }
      })();
    } catch (e) {
      console.error('Gallery QR generation failed:', e);
      galleryError = 'Gagal membuat QR code. Anda tetap bisa mengunduh PNG.';
    }
  }

  async function handlePrint(): Promise<void> {
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

  async function handleDownload(): Promise<void> {
    if (isDownloading) return;
    isDownloading = true;
    printError = null;
    try {
      await downloadStripPNG(photos, activeTemplate, { caption, showDate });
      downloadSuccess = true;
      setTimeout(() => { downloadSuccess = false; }, 4000);
    } catch (err) {
      console.error('Download error:', err);
      printError = 'Failed to generate download. Please try again.';
    } finally {
      isDownloading = false;
    }
  }

  function handleNewSession(): void {
    resetSession();
  }

  function copyGalleryUrl(): void {
    if (!galleryUrl) return;
    navigator.clipboard.writeText(galleryUrl).then(() => {
      copiedUrl = true;
      setTimeout(() => { copiedUrl = false; }, 2500);
    }).catch(() => {});
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
    <h1 class="print-header-title">Print &amp; Export</h1>
    <button
      id="btn-header-new-session"
      class="btn btn-ghost btn-sm header-new-btn"
      on:click={handleNewSession}
      aria-label="Start a new session"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
      <span>New Session</span>
    </button>
  </header>

  <div class="print-body">
    <!-- Left Column: 4R Sheet Preview -->
    <div class="sheet-preview-col">
      <div class="sheet-card">
        <div class="sheet-badge">4R · {produk.cm} cm · {copies === 2 ? '2 salinan' : '1 salinan'}</div>
        <div class="canvas-wrapper" style="aspect-ratio: {sheetLandscape ? '3 / 2' : '2 / 3'};">
          <canvas
            bind:this={previewCanvas}
            width={sheetLandscape ? 600 : 400}
            height={sheetLandscape ? 400 : 600}
            class="sheet-canvas"
            aria-label="4R printable sheet preview"
          ></canvas>
        </div>
        <p class="sheet-caption">{copies === 2 ? '2 salinan — potong di garis tengah' : '1 salinan utuh di lembar 4R'}</p>
      </div>
    </div>

    <!-- Right Column: QR -> Actions (Print & Download) -> Info modal -->
    <div class="print-details-col">
      {#if printError}
        <div class="alert alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{printError}</span>
        </div>
      {/if}

      {#if downloadSuccess}
        <div class="alert alert-success" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Photo strip berhasil diunduh!</span>
        </div>
      {/if}

      <!-- 1. QR Section: Title above QR, clean white box directly on surface (NO purple card) -->
      <div class="qr-clean-container">
        <div class="qr-title-row">
          <h2 class="qr-clean-title">Scan untuk download gambar</h2>
          <span class="qr-clean-hint">Arahkan kamera HP ke QR</span>
        </div>

        {#if galleryReady && qrImageUrl && galleryUrl}
          <div class="qr-box">
            <img src={qrImageUrl} alt="QR Code untuk mengunduh foto" class="qr-code-img" />
          </div>

          <div class="qr-url-pill">
            <span class="qr-url-short" title={galleryUrl}>{galleryUrl}</span>
            <button
              class="url-action-btn"
              on:click={copyGalleryUrl}
              aria-label="Copy link"
              title="Salin link"
            >
              {#if copiedUrl}
                <span class="copied-tag">✓ Tersalin</span>
              {:else}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              {/if}
            </button>
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="url-action-btn"
              title="Buka galeri di tab baru"
              aria-label="Open gallery in new tab"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        {:else if galleryError}
          <p class="qr-err-text">{galleryError}</p>
        {:else}
          <div class="qr-loading-box">
            <div class="btn-spinner" aria-hidden="true"></div>
            <span>Membuat QR code…</span>
          </div>
        {/if}
      </div>

      <!-- 2. Action Buttons Below QR: Cetak + Info icon (i) + Download PNG -->
      <div class="print-actions-wrapper">
        <div class="print-btn-with-info">
          <button
            id="btn-print"
            class="btn btn-primary btn-print-main"
            on:click={handlePrint}
            disabled={isPrinting}
            aria-label="Print photo strip"
          >
            {#if isPrinting}
              <div class="btn-spinner" aria-hidden="true"></div>
              <span>Menyiapkan Cetak…</span>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              <span>Cetak 4R Photo Strip</span>
            {/if}
          </button>

          <!-- Printer Setup Info Icon (i) -->
          <button
            type="button"
            class="printer-info-icon-btn"
            on:click={() => { showPrinterInfo = !showPrinterInfo; }}
            title="Printer Setup Checklist"
            aria-label="Printer setup information"
            aria-expanded={showPrinterInfo}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
        </div>

        <button
          id="btn-download-png"
          class="btn btn-secondary btn-download-main"
          on:click={handleDownload}
          disabled={isDownloading}
          aria-label="Download high-resolution PNG"
        >
          {#if isDownloading}
            <div class="btn-spinner" aria-hidden="true"></div>
            <span>Membuat PNG…</span>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download PNG ({sheetLandscape ? '1800 × 1200' : '1200 × 1800'})</span>
          {/if}
        </button>
      </div>

      <!-- Compact New Session Button -->
      <div class="bottom-reset-wrap">
        <button
          id="btn-new-session"
          class="btn btn-ghost btn-sm inline-icon-btn"
          on:click={handleNewSession}
          aria-label="Start over with a fresh session"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          <span>Sesi Baru (Retake / Mulai Ulang)</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Printer Setup Modal / Popover -->
  {#if showPrinterInfo}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="printer-modal-backdrop" on:click={() => { showPrinterInfo = false; }} role="dialog" aria-modal="true" tabindex="-1">
      <div class="printer-modal-card" on:click|stopPropagation>
        <div class="printer-modal-header">
          <div class="printer-modal-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <h3>Printer Setup Checklist</h3>
          </div>
          <button
            class="modal-close-btn"
            on:click={() => { showPrinterInfo = false; }}
            aria-label="Close printer setup"
          >✕</button>
        </div>

        <ul class="printer-checklist">
          <li><strong>Ukuran Kertas:</strong> 4 × 6 inches (4R / Photo Paper)</li>
          <li><strong>Orientasi:</strong> {sheetLandscape ? 'Landscape (Menyamping)' : 'Portrait (Tegak)'}</li>
          <li><strong>Skala (Scale):</strong> 100% (Jangan pilih "Fit to Page")</li>
          <li><strong>Margin:</strong> None / Borderless</li>
          <li><strong>Background Graphics:</strong> Centang / ON</li>
        </ul>

        <div class="cutting-hint-modal">
          ✂️ <strong>Setelah cetak:</strong> {copies === 2
            ? 'Potong sepanjang garis putus-putus tengah untuk membagi menjadi 2 salinan Two up ukuran 15 × 5 cm.'
            : `Tidak perlu memotong — salinan tunggal ${produk.nama} ukuran ${produk.cm} cm sudah utuh di tengah lembar.`}
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .print-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    overflow: hidden;
  }

  .print-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1.5px solid var(--color-border);
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .print-header-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-ink);
  }

  .header-new-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .print-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .print-body {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 36px;
      padding: var(--space-4) var(--space-6);
    }
  }

  /* Sheet Preview Column */
  .sheet-preview-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
  }

  .sheet-card {
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    width: 260px;
  }

  @media (min-width: 768px) {
    .sheet-card {
      width: 280px;
    }
  }

  .sheet-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-ink-light);
    background: var(--color-bg);
    padding: 2px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  .canvas-wrapper {
    width: 100%;
    aspect-ratio: 2 / 3;
    max-height: min(420px, 58vh);
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
    font-size: 11px;
    color: var(--color-muted);
    text-align: center;
    margin: 0;
  }

  /* Print Details Column */
  .print-details-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 260px;
    max-width: 100%;
    min-width: 0;
  }

  @media (min-width: 768px) {
    .print-details-col {
      width: 280px;
    }
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 500;
    width: 100%;
    box-sizing: border-box;
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

  /* ── 1. Clean QR Container (NO outer card wrapper, only QR box has outline) ── */
  .qr-clean-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .qr-title-row {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
  }

  .qr-clean-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
  }

  .qr-clean-hint {
    font-size: 11px;
    color: var(--color-ink-light);
  }

  /* QR Box: 1:1 Aspect Ratio, expanding across full width, maintaining outline */
  .qr-box {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 14px;
    box-sizing: border-box;
    box-shadow: 0 1px 4px rgba(28, 25, 23, 0.06);
  }

  .qr-code-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }

  .qr-url-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 4px 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .qr-url-short {
    flex: 1;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-ink-light);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .url-action-btn {
    padding: 2px 4px;
    color: var(--color-ink);
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-fast);
  }

  .url-action-btn:hover {
    color: var(--color-accent);
  }

  .copied-tag {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-success);
  }

  .qr-loading-box {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #FFFFFF;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-sizing: border-box;
    color: var(--color-ink-light);
    font-size: var(--text-xs);
  }

  .qr-err-text {
    font-size: var(--text-xs);
    color: var(--color-coral);
    margin: 0;
    text-align: center;
  }

  /* ── 2. Action Buttons Below QR: Matches QR width ── */
  .print-actions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .print-btn-with-info {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .btn-print-main {
    flex: 1;
    padding: 10px 16px;
    font-size: var(--text-sm);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--radius-md);
  }

  .printer-info-icon-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    color: var(--color-ink-light);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
  }

  .printer-info-icon-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: scale(1.05);
  }

  .btn-download-main {
    width: 100%;
    padding: 9px 16px;
    font-size: var(--text-xs);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--radius-md);
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .btn-secondary .btn-spinner {
    border: 2px solid rgba(28, 25, 23, 0.2);
    border-top-color: var(--color-ink);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Bottom Reset ── */
  .bottom-reset-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 2px;
  }

  .inline-icon-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-ink-light);
  }

  .inline-icon-btn:hover {
    color: var(--color-ink);
  }

  /* ── Printer Setup Modal / Popover ── */
  .printer-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28, 25, 23, 0.45);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .printer-modal-card {
    background: white;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    max-width: 380px;
    width: 100%;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    animation: popIn 0.2s ease-out;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .printer-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 10px;
  }

  .printer-modal-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .printer-modal-title-group h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-ink);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }

  .modal-close-btn:hover {
    color: var(--color-ink);
    background: var(--color-bg);
  }

  .printer-checklist {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: var(--text-xs);
    color: var(--color-ink-light);
  }

  .printer-checklist li strong {
    color: var(--color-ink);
  }

  .cutting-hint-modal {
    padding: 8px 12px;
    background: #fffbeb;
    border: 1px dashed #fcd34d;
    border-radius: var(--radius-md);
    font-size: 11px;
    color: #78350f;
    line-height: 1.4;
  }
</style>

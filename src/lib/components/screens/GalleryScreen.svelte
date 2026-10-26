<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { loadGallerySession, buildAnimatedGif } from '#lib/utils/gallery';
  import { playGrekSound } from '#lib/utils/audio';
  import { goTo } from '#lib/stores/session';
  import { PRODUK } from '#lib/utils/canvas';
  import type { GallerySession } from '#lib/types';

  export let sessionId: string = '';

  let galleryData: GallerySession | null = null;
  let loading = true;
  let error: string | null = null;

  // Deck state
  let activeCardIndex = 0;

  // GIF file state
  let gifDataUrl: string | null = null;
  let gifGenerating = false;
  let gifError: string | null = null;

  // Live Looping Frame Player state (for GIF card)
  let currentLoopFrame = 0;
  let isLoopPlaying = true;
  let loopIntervalMs = 1000; // 1 second per frame (pindah-pindah frame)
  let loopTimer: ReturnType<typeof setInterval> | null = null;

  let downloadingAll = false;

  // Touch & Pointer gesture tracking for smooth swiping
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerDeltaX = 0;
  let isDragging = false;

  interface GalleryCard {
    id: string;
    type: 'strip' | 'photo' | 'gif';
    badge: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    downloadAction: () => void;
    btnLabel: string;
    photoIndex?: number;
  }

  /** Produk strip sesuai jumlah foto galeri (ukuran cetak nyata). */
  $: produk = galleryData ? (PRODUK[galleryData.photos.length] || PRODUK[4]) : PRODUK[4];

  $: cardItems = galleryData ? ([
    {
      id: 'strip',
      type: 'strip',
      badge: 'HASIL STRIP 4R',
      title: `Photo Strip (${produk.nama})`,
      subtitle: `${produk.nama} ${produk.cm} cm — ${produk.copySheet === 2 ? '2 salinan berdampingan' : '1 salinan'} siap cetak`,
      imageUrl: galleryData.stripDataUrl,
      downloadAction: downloadStrip,
      btnLabel: 'Unduh Strip 4R',
    },
    ...galleryData.photos.map((photo: string, i: number, semua: string[]): GalleryCard => ({
      id: `photo-${i}`,
      type: 'photo',
      badge: `FOTO #${i + 1} DARI ${semua.length}`,
      title: `Foto Jepretan #${i + 1}`,
      subtitle: 'Foto asli kamera resolusi tinggi',
      imageUrl: photo,
      downloadAction: () => downloadPhoto(photo, i),
      btnLabel: `Unduh Foto #${i + 1}`,
      photoIndex: i,
    })),
    {
      id: 'gif',
      type: 'gif',
      badge: 'ANIMASI LOOPING',
      title: 'Animasi Looping (GIF)',
      subtitle: 'Berpindah frame otomatis (minimal 5 detik)',
      imageUrl: '',
      downloadAction: downloadGif,
      btnLabel: 'Unduh File GIF',
    }
  ] as GalleryCard[]) : ([] as GalleryCard[]);

  function startLoopTimer(): void {
    stopLoopTimer();
    if (!isLoopPlaying || !galleryData || !galleryData.photos || galleryData.photos.length === 0) return;
    const photos = galleryData.photos;
    loopTimer = setInterval(() => {
      currentLoopFrame = (currentLoopFrame + 1) % photos.length;
    }, loopIntervalMs);
  }

  function stopLoopTimer(): void {
    if (loopTimer) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
  }

  function togglePlayPause(): void {
    isLoopPlaying = !isLoopPlaying;
    if (isLoopPlaying) {
      startLoopTimer();
    } else {
      stopLoopTimer();
    }
  }

  function setLoopSpeed(ms: number): void {
    loopIntervalMs = ms;
    if (isLoopPlaying) {
      startLoopTimer();
    }
  }

  function jumpToFrame(index: number): void {
    currentLoopFrame = index;
    if (isLoopPlaying) {
      startLoopTimer();
    }
  }

  // ─── Deck Navigation & Sound ────────────────────────────────────────────────

  function getCircularDiff(index: number, activeIndex: number, total: number): number {
    if (total <= 1) return 0;
    let diff = (index - activeIndex) % total;
    if (diff > total / 2) {
      diff -= total;
    } else if (diff < -total / 2) {
      diff += total;
    }
    return diff;
  }

  function goToCard(index: number): void {
    if (index === activeCardIndex || index < 0 || index >= cardItems.length) return;
    activeCardIndex = index;
    playGrekSound();
  }

  function nextCard(): void {
    if (!cardItems || cardItems.length <= 1) return;
    activeCardIndex = (activeCardIndex + 1) % cardItems.length;
    playGrekSound();
  }

  function prevCard(): void {
    if (!cardItems || cardItems.length <= 1) return;
    activeCardIndex = (activeCardIndex - 1 + cardItems.length) % cardItems.length;
    playGrekSound();
  }

  // ─── Swipe & Drag Handlers ──────────────────────────────────────────────────

  type PointerOrTouchEvent = PointerEvent & { touches?: TouchList };

  function handlePointerDown(e: PointerOrTouchEvent): void {
    pointerStartX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    pointerStartY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? 0;
    pointerDeltaX = 0;
    isDragging = true;
  }

  function handlePointerMove(e: PointerOrTouchEvent): void {
    if (!isDragging) return;
    const currentX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    const currentY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? 0;
    const deltaX = currentX - pointerStartX;
    const deltaY = currentY - pointerStartY;

    // If mostly horizontal, prevent vertical interference
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      pointerDeltaX = deltaX;
    }
  }

  function handlePointerUp(): void {
    if (!isDragging) return;
    isDragging = false;
    const threshold = 40; // minimum swipe distance
    if (pointerDeltaX < -threshold) {
      nextCard();
    } else if (pointerDeltaX > threshold) {
      prevCard();
    }
    pointerDeltaX = 0;
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') {
      nextCard();
    } else if (e.key === 'ArrowLeft') {
      prevCard();
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);

    if (!sessionId) {
      error = 'Session ID tidak ditemukan.';
      loading = false;
      return;
    }
    try {
      galleryData = await loadGallerySession(sessionId);
      if (!galleryData) {
        error = 'Sesi foto tidak ditemukan atau sudah kadaluarsa.';
      } else {
        // Start live frame looper immediately
        startLoopTimer();

        // If GIF was already generated, use it immediately
        if (galleryData.gifDataUrl) {
          gifDataUrl = galleryData.gifDataUrl;
        } else if (galleryData.photos && galleryData.photos.length > 0) {
          // Auto-generate GIF file with gifenc
          generateGif();
        }
      }
    } catch (e) {
      error = 'Gagal memuat galeri foto.';
      console.error(e);
    }
    loading = false;
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
    stopLoopTimer();
  });

  async function generateGif(): Promise<void> {
    if (!galleryData || gifGenerating) return;
    gifGenerating = true;
    gifError = null;
    try {
      gifDataUrl = await buildAnimatedGif(galleryData.photos, {
        width: 480,
        height: 360,
        delayMs: 1000, // 1.0s per frame, at least 5s total loop
      });
    } catch (e) {
      gifError = 'Gagal membuat file GIF. Silakan coba lagi.';
      console.error(e);
    }
    gifGenerating = false;
  }

  function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadPhoto(url: string, index: number): void {
    downloadDataUrl(url, `distudio-photo-${index + 1}.png`);
  }

  function downloadStrip(): void {
    if (galleryData?.stripDataUrl) {
      downloadDataUrl(galleryData.stripDataUrl, 'distudio-photo-strip.png');
    }
  }

  function downloadGif(): void {
    if (gifDataUrl) {
      downloadDataUrl(gifDataUrl, 'distudio-animated.gif');
    }
  }

  async function downloadAll(): Promise<void> {
    if (!galleryData || downloadingAll) return;
    downloadingAll = true;

    // 1. Download photo strip
    downloadStrip();
    await new Promise((r) => setTimeout(r, 350));

    // 2. Download all individual photos
    for (let i = 0; i < galleryData.photos.length; i++) {
      downloadPhoto(galleryData.photos[i], i);
      await new Promise((r) => setTimeout(r, 350));
    }

    // 3. Download GIF
    if (gifDataUrl) {
      downloadGif();
    }

    downloadingAll = false;
  }

  function formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
</script>

<section class="gallery-screen">
  {#if loading}
    <div class="gallery-loader">
      <div class="loader-spinner"></div>
      <p>Memuat koleksi foto kamu…</p>
    </div>
  {:else if error}
    <div class="gallery-error">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2>Oops!</h2>
      <p>{error}</p>
      <p class="error-hint">Scan kembali QR code di photobooth untuk membuka tautan terbaru.</p>
    </div>
  {:else if galleryData}
    <!-- Top Header Bar -->
    <header class="gallery-header">
      <div class="header-left">
        <div class="gallery-brand">
          <span class="brand-dot"></span>
          <span class="brand-name">DISTUDIO</span>
          <span class="brand-dot"></span>
        </div>
        <p class="gallery-date">{formatDate(galleryData.createdAt)}</p>
      </div>

      <div class="header-actions">
        <!-- Quick Download All Button -->
        <button
          class="dl-all-pill-btn"
          on:click={downloadAll}
          disabled={downloadingAll}
          aria-label="Download all items at once"
        >
          {#if downloadingAll}
            <div class="btn-spinner" aria-hidden="true"></div>
            <span>Mengunduh…</span>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Unduh Semua ({cardItems.length} File)</span>
          {/if}
        </button>
      </div>
    </header>

    <!-- Main Deck Experience -->
    <main class="deck-main">
      <!-- Side Navigation Arrow Left (Mid-Screen) -->
      <button
        class="side-nav-btn prev"
        on:click={prevCard}
        aria-label="Kartu sebelumnya"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <!-- Side Navigation Arrow Right (Mid-Screen) -->
      <button
        class="side-nav-btn next"
        on:click={nextCard}
        aria-label="Kartu berikutnya"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <!-- Card Stage Container -->
      <div class="deck-wrapper">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="deck-stage"
          on:pointerdown={handlePointerDown}
          on:pointermove={handlePointerMove}
          on:pointerup={handlePointerUp}
          on:pointercancel={handlePointerUp}
        >
          {#each cardItems as card, index (card.id)}
            {@const diff = getCircularDiff(index, activeCardIndex, cardItems.length)}
            {@const isVisible = Math.abs(diff) <= 2}
            {#if isVisible}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <article
                class="deck-card"
                class:active={diff === 0}
                class:prev={diff === -1}
                class:next={diff === 1}
                class:far-prev={diff <= -2}
                class:far-next={diff >= 2}
                style="--diff: {diff}; --drag-offset: {diff === 0 && isDragging ? pointerDeltaX : 0}px;"
                on:click={() => { if (diff !== 0) goToCard(index); }}
              >
                <!-- Card Header Top Pill -->
                <div class="card-top-bar">
                  <span class="card-badge">
                    {#if card.type === 'strip'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" rx="2"/>
                        <line x1="5" y1="8" x2="19" y2="8"/>
                        <line x1="5" y1="14" x2="19" y2="14"/>
                      </svg>
                    {:else if card.type === 'photo'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    {:else if card.type === 'gif'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                      </svg>
                    {/if}
                    <span>{card.badge}</span>
                  </span>
                  <span class="card-count-pill">{index + 1} / {cardItems.length}</span>
                </div>

                <!-- Card Visual Media Area -->
                <div class="card-media-wrap">
                  {#if card.type === 'strip'}
                    <!-- svelte-ignore a11y_img_redundant_alt -->
                    <img
                      src={card.imageUrl}
                      alt="Photo strip 4R sheet"
                      class="card-img strip-img-fit"
                    />
                  {:else if card.type === 'photo'}
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      class="card-img photo-img-fit"
                    />
                  {:else if card.type === 'gif'}
                    <!-- Live Interactive Looper Slideshow Inside the Card -->
                    <div class="looper-embed">
                      {#if galleryData.photos && galleryData.photos.length > 0}
                        <img
                          src={galleryData.photos[currentLoopFrame]}
                          alt="Loop frame {currentLoopFrame + 1}"
                          class="card-img looper-img-fit"
                        />
                        <div class="looper-badge">
                          Frame {currentLoopFrame + 1} / {galleryData.photos.length}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>

                <!-- Clean Lightweight Bottom Card Container -->
                <div class="card-bottom-bar">
                  <div class="card-info-text">
                    <h3 class="card-title">{card.title}</h3>
                    <p class="card-sub">{card.subtitle}</p>
                  </div>

                  <!-- Mini Looper Controls if GIF card -->
                  {#if card.type === 'gif'}
                    <div class="looper-compact-controls">
                      <button
                        class="looper-play-pill"
                        on:click|stopPropagation={togglePlayPause}
                        aria-label={isLoopPlaying ? 'Pause' : 'Play'}
                      >
                        {#if isLoopPlaying}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1"/>
                            <rect x="14" y="4" width="4" height="16" rx="1"/>
                          </svg>
                          <span>Pause</span>
                        {:else}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                          <span>Play</span>
                        {/if}
                      </button>

                      <div class="looper-speed-pills">
                        <button
                          class="speed-pill"
                          class:active={loopIntervalMs === 800}
                          on:click|stopPropagation={() => setLoopSpeed(800)}
                        >0.8s</button>
                        <button
                          class="speed-pill"
                          class:active={loopIntervalMs === 1000}
                          on:click|stopPropagation={() => setLoopSpeed(1000)}
                        >1.0s</button>
                        <button
                          class="speed-pill"
                          class:active={loopIntervalMs === 1500}
                          on:click|stopPropagation={() => setLoopSpeed(1500)}
                        >1.5s</button>
                      </div>
                    </div>
                  {/if}

                  <!-- Clean Action Button -->
                  <div class="card-action-row">
                    {#if card.type === 'gif' && gifGenerating}
                      <button class="card-action-btn disabled" disabled>
                        <div class="btn-spinner" aria-hidden="true"></div>
                        <span>Memproses GIF…</span>
                      </button>
                    {:else}
                      <button
                        class="card-action-btn"
                        on:click|stopPropagation={card.downloadAction}
                        aria-label={card.btnLabel}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="dl-icon">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>{card.btnLabel}</span>
                      </button>
                    {/if}
                  </div>
                </div>
              </article>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Clean Minimal Footer (No dots) -->
      <footer class="deck-footer">
        <p class="swipe-hint">
          <span>Geser layar atau tekan tombol kiri/kanan di tepi</span>
        </p>
      </footer>
    </main>
  {/if}
</section>

<style>
  .gallery-screen {
    min-height: 100dvh;
    min-height: 100vh;
    background: var(--color-bg, #FBF7F0);
    color: var(--color-ink, #1C1917);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
    overflow-x: hidden;
  }

  /* ── Header ── */
  .gallery-header {
    width: 100%;
    max-width: 960px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    z-index: 50;
    background: var(--color-surface, #FEFCF8);
    border-bottom: 1.5px solid var(--color-border, #E5DDD5);
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .gallery-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand-name {
    font-family: var(--font-display, serif);
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--color-ink, #1C1917);
  }

  .brand-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #D97706;
  }

  .gallery-date {
    font-size: 0.72rem;
    color: var(--color-ink-light, #78716C);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dl-all-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--color-ink, #1C1917);
    color: white;
    border: none;
    border-radius: var(--radius-full, 9999px);
    padding: 8px 18px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .dl-all-pill-btn:hover:not(:disabled) {
    background: #292524;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .dl-all-pill-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  /* ── Deck Main Layout ── */
  .deck-main {
    flex: 1;
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 16px 24px;
    position: relative;
  }

  /* ── Side Navigation Arrows (Vertically Centered in Screen/Viewport) ── */
  .side-nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-surface, #FEFCF8);
    border: 1.5px solid var(--color-border, #E5DDD5);
    color: var(--color-ink, #1C1917);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 60;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(28, 25, 23, 0.1));
    transition: all 0.2s ease;
  }

  .side-nav-btn.prev {
    left: 20px;
  }

  .side-nav-btn.next {
    right: 20px;
  }

  .side-nav-btn:hover:not(:disabled) {
    border-color: var(--color-ink, #1C1917);
    color: var(--color-accent, #2563EB);
    transform: translateY(-50%) scale(1.08);
    box-shadow: var(--shadow-lg);
  }

  .side-nav-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ── Deck Wrapper & Stage ── */
  .deck-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto 0;
  }

  .deck-stage {
    position: relative;
    width: 100%;
    max-width: 440px;
    height: clamp(520px, 72vh, 640px);
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: pan-y;
    cursor: grab;
  }

  .deck-stage:active {
    cursor: grabbing;
  }

  /* ── Cards (Lightweight & High Performance) ── */
  .deck-card {
    position: absolute;
    width: 100%;
    height: 100%;
    max-width: 420px;
    border-radius: var(--radius-xl, 28px);
    background: var(--color-surface, #FEFCF8);
    border: 1.5px solid var(--color-border, #E5DDD5);
    box-shadow: var(--shadow-lg, 0 12px 32px rgba(28, 25, 23, 0.12));
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }

  /* Active card */
  .deck-card.active {
    transform: translate3d(var(--drag-offset, 0px), 0, 0) scale(1);
    opacity: 1;
    z-index: 25;
    pointer-events: auto;
  }

  /* Previous peek */
  .deck-card.prev {
    transform: translate3d(calc(-72% + var(--drag-offset, 0px)), 0, 0) scale(0.88);
    opacity: 0.35;
    z-index: 10;
    cursor: pointer;
  }

  /* Next peek */
  .deck-card.next {
    transform: translate3d(calc(72% + var(--drag-offset, 0px)), 0, 0) scale(0.88);
    opacity: 0.35;
    z-index: 10;
    cursor: pointer;
  }

  .deck-card.far-prev {
    transform: translate3d(-110%, 0, 0) scale(0.75);
    opacity: 0;
    pointer-events: none;
    z-index: 5;
  }

  .deck-card.far-next {
    transform: translate3d(110%, 0, 0) scale(0.75);
    opacity: 0;
    pointer-events: none;
    z-index: 5;
  }

  /* ── Card Header Top Pill ── */
  .card-top-bar {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 20;
    pointer-events: none;
  }

  .card-badge {
    background: rgba(254, 252, 248, 0.94);
    border: 1px solid var(--color-border, #E5DDD5);
    color: var(--color-ink, #1C1917);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 5px 12px;
    border-radius: var(--radius-full, 9999px);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(28, 25, 23, 0.06);
  }

  .card-count-pill {
    background: rgba(254, 252, 248, 0.94);
    border: 1px solid var(--color-border, #E5DDD5);
    color: var(--color-ink-light, #78716C);
    font-size: 0.72rem;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    padding: 5px 10px;
    border-radius: var(--radius-full, 9999px);
    box-shadow: 0 2px 6px rgba(28, 25, 23, 0.06);
  }

  /* ── Card Media Area ── */
  .card-media-wrap {
    flex: 1;
    width: 100%;
    position: relative;
    background: #F5EFEB;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-img {
    width: 100%;
    height: 100%;
    display: block;
    user-select: none;
    pointer-events: none;
  }

  .strip-img-fit {
    object-fit: contain;
    padding: 14px;
    background: #EDE6DE;
  }

  .photo-img-fit {
    object-fit: cover;
  }

  .looper-embed {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1C1917;
  }

  .looper-img-fit {
    object-fit: cover;
  }

  .looper-badge {
    position: absolute;
    bottom: 12px;
    right: 14px;
    background: rgba(28, 25, 23, 0.85);
    color: white;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full, 9999px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* ── Clean Lightweight Bottom Container ── */
  .card-bottom-bar {
    background: var(--color-surface, #FEFCF8);
    border-top: 1.5px solid var(--color-border, #E5DDD5);
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 10;
  }

  .card-info-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0;
    color: var(--color-ink, #1C1917);
  }

  .card-sub {
    font-size: 0.76rem;
    color: var(--color-ink-light, #78716C);
    margin: 0;
  }

  /* Looper mini player */
  .looper-compact-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: var(--color-bg, #FBF7F0);
    border: 1px solid var(--color-border, #E5DDD5);
    border-radius: var(--radius-md, 12px);
  }

  .looper-play-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--color-surface, #FEFCF8);
    border: 1.5px solid var(--color-border, #E5DDD5);
    color: var(--color-ink, #1C1917);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .looper-play-pill:hover {
    border-color: var(--color-ink, #1C1917);
  }

  .looper-speed-pills {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .speed-pill {
    background: transparent;
    border: 1px solid var(--color-border, #E5DDD5);
    color: var(--color-ink-light, #78716C);
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .speed-pill.active {
    background: var(--color-ink, #1C1917);
    color: white;
    border-color: var(--color-ink, #1C1917);
  }

  /* Clean Action Button */
  .card-action-row {
    width: 100%;
  }

  .card-action-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 18px;
    border-radius: var(--radius-md, 12px);
    background: var(--color-accent, #2563EB);
    border: none;
    color: white;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
    transition: all 0.2s ease;
  }

  .card-action-btn:hover:not(:disabled) {
    background: var(--color-accent-hover, #1D4ED8);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.38);
    transform: translateY(-1px);
  }

  .card-action-btn:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  .card-action-btn.disabled,
  .card-action-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background: var(--color-border, #E5DDD5);
    color: var(--color-ink-light, #78716C);
    box-shadow: none;
  }

  .dl-icon {
    flex-shrink: 0;
  }

  /* ── Deck Footer ── */
  .deck-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    z-index: 20;
  }

  .swipe-hint {
    font-size: 0.74rem;
    color: var(--color-ink-light, #78716C);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Loader & Error States ── */
  .gallery-loader {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--color-ink-light, #78716C);
    font-size: 0.95rem;
  }

  .loader-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border, #E5DDD5);
    border-top-color: var(--color-accent, #2563EB);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .gallery-error {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
    padding: 40px 24px;
  }

  .error-icon {
    color: var(--color-coral, #F87171);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-error h2 {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--color-ink, #1C1917);
    margin: 0;
  }

  .gallery-error p {
    color: var(--color-ink-light, #78716C);
    max-width: 320px;
    line-height: 1.5;
    margin: 0;
    font-size: 0.9rem;
  }

  .error-hint {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  /* ── Mobile Optimization ── */
  @media (max-width: 600px) {
    .gallery-header {
      padding: 12px 14px;
    }

    .brand-name {
      font-size: 1.05rem;
    }

    .dl-all-pill-btn {
      padding: 6px 14px;
      font-size: 0.75rem;
    }

    .side-nav-btn {
      width: 40px;
      height: 40px;
    }

    .side-nav-btn.prev {
      left: 8px;
    }

    .side-nav-btn.next {
      right: 8px;
    }

    .deck-stage {
      max-width: 330px;
      height: clamp(480px, 68vh, 560px);
    }

    .deck-card {
      max-width: 320px;
      border-radius: var(--radius-lg, 20px);
    }

    .deck-card.prev {
      transform: translate3d(calc(-74% + var(--drag-offset, 0px)), 0, 0) scale(0.86);
    }

    .deck-card.next {
      transform: translate3d(calc(74% + var(--drag-offset, 0px)), 0, 0) scale(0.86);
    }

    .card-title {
      font-size: 0.98rem;
    }

    .card-sub {
      font-size: 0.72rem;
    }

    .card-action-btn {
      padding: 11px 16px;
      font-size: 0.85rem;
    }
  }
</style>

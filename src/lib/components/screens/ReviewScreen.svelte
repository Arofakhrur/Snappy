<script lang="ts">
  import { session, goTo, setRetakeIndex, beginCapture } from '#lib/stores/session';
  import { stopCamera } from '#lib/utils/camera';

  $: photos = $session.photos;
  $: photoCount = $session.photoCount;

  function handleRetakeOne(index: number): void {
    setRetakeIndex(index);
    goTo('camera');
  }

  function handleRetakeAll(): void {
    // Stop camera, wipe photos completely, and begin capture fresh
    stopCamera();
    session.update((s) => ({
      ...s,
      photos: [],
      retakeIndex: null,
      isCapturing: true,
      captureProgress: 0,
      cameraError: null,
      screen: 'camera',
    }));
  }

  function handleBack(): void {
    // Back from review means discarding the captured batch to retake
    handleRetakeAll();
  }

  function handleContinue(): void {
    goTo('editor');
  }
</script>

<section class="review-screen screen-enter">
  <header class="review-header">
    <button
      class="btn btn-ghost btn-sm"
      on:click={handleBack}
      aria-label="Go back to camera and retake"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Back
    </button>
    <h1 class="review-title">Review Photos</h1>
    <div class="header-spacer"></div>
  </header>

  <div class="review-content">
    <!-- Subtitle -->
    <p class="review-subtitle">
      Happy with these? Continue to design your strip, or retake any photo.
    </p>

    <!-- Photo grid -->
    <div
      class="photo-grid"
      class:grid-1={photoCount === 1}
      class:grid-2={photoCount === 2}
      class:grid-3={photoCount === 3}
      class:grid-4={photoCount === 4}
        class:grid-5={photoCount === 5}
      class:grid-6={photoCount === 6}
    >
      {#each photos as photo, i}
        <div class="photo-card" style="animation-delay: {i * 60}ms">
          <div class="photo-slot">
            {#if photo}
              <img src={photo} alt="Captured photo {i + 1}" />
            {:else}
              <div class="photo-empty">
                <span>Photo {i + 1}</span>
              </div>
            {/if}
          </div>
          <div class="photo-label">
            <span class="photo-num">#{i + 1}</span>
            <button
              id="btn-retake-{i}"
              class="btn btn-danger btn-sm retake-btn"
              on:click={() => handleRetakeOne(i)}
              aria-label="Retake photo {i + 1}"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 .49-5.5"/>
              </svg>
              Retake
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Action bar -->
  <div class="review-actions">
    <button
      id="btn-retake-all"
      class="btn btn-secondary"
      on:click={handleRetakeAll}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 4v6h6"/>
        <path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Retake All
    </button>
    <button
      id="btn-continue-to-editor"
      class="btn btn-primary"
      on:click={handleContinue}
    >
      Design Strip
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  </div>
</section>

<style>
  .review-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
  }

  /* Header */
  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1.5px solid var(--color-border);
    background: var(--color-surface);
    gap: var(--space-3);
  }

  .review-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-ink);
  }

  .header-spacer {
    width: 64px; /* balance the back button */
    flex-shrink: 0;
  }

  /* Content */
  .review-content {
    flex: 1;
    padding: var(--space-5);
    overflow-y: auto;
  }

  .review-subtitle {
    color: var(--color-ink-light);
    font-size: var(--text-sm);
    margin-bottom: var(--space-5);
    text-align: center;
  }

  /* Photo grid — jumlah kolom mengikuti photoCount 1–5 */
  .photo-grid {
    display: grid;
    gap: var(--space-4);
    max-width: 560px;
    margin: 0 auto;
  }

  .grid-1 {
    grid-template-columns: 1fr;
    max-width: 280px;
  }

  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  /* 5 foto: ponsel membagi 3+2, layar lebar membagi 5 rata */
  .grid-5 {
    grid-template-columns: repeat(3, 1fr);
  }

  /* 6 foto: ponsel 3 kolom dua baris, layar lebar 6 rata saat sempit */
  .grid-6 {
    grid-template-columns: repeat(3, 1fr);
  }

  .photo-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    animation: thumbAppear 0.3s ease both;
  }

  .photo-slot {
    aspect-ratio: 3 / 4;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-border);
    border: 2px solid var(--color-border);
    transition: border-color var(--transition-base);
  }

  .photo-slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .photo-card:hover .photo-slot {
    border-color: var(--color-accent);
  }

  .photo-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-muted);
    font-size: var(--text-sm);
  }

  .photo-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .photo-num {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-muted);
    font-family: var(--font-mono);
  }

  .retake-btn {
    font-size: 11px;
    padding: 4px 10px;
  }

  /* Desktop: wider grid */
  @media (min-width: 640px) {
    .grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .grid-5 {
      grid-template-columns: repeat(5, 1fr);
    }
    .grid-6 {
      grid-template-columns: repeat(6, 1fr);
    }
    .grid-1 {
      max-width: 320px;
    }
  }

  /* Action bar */
  .review-actions {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-top: 1.5px solid var(--color-border);
    background: var(--color-surface);
    position: sticky;
    bottom: 0;
  }

  .review-actions .btn-secondary {
    flex: 0 0 auto;
  }

  .review-actions .btn-primary {
    flex: 1;
  }

  @media (max-width: 400px) {
    .review-actions {
      flex-direction: column;
    }
  }
</style>

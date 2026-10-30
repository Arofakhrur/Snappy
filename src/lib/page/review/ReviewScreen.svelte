<script lang="ts">
  import { session, goTo, setRetakeIndex, beginCapture } from '#lib/stores/session';
  import { stopCamera } from '#lib/services/camera';

  $: photos = $session.photos;
  $: photoCount = $session.photoCount;

  // Track aspect ratio per item (fallback '4/3')
  let aspectRatios: Record<number, string> = {};

  // State untuk modal preview zoom (DaisyUI Modal)
  let selectedPhotoUrl: string | null = null;
  let confirmRetakeAllModal: HTMLDialogElement | undefined;

  function handleImageLoad(index: number, e: Event): void {
    const target = e.target as HTMLImageElement | null;
    if (target && target.naturalWidth && target.naturalHeight) {
      aspectRatios[index] = `${target.naturalWidth} / ${target.naturalHeight}`;
    }
  }

  function handleRetakeOne(index: number): void {
    setRetakeIndex(index);
    goTo('camera');
  }

  function openConfirmRetakeAll(): void {
    confirmRetakeAllModal?.showModal();
  }

  function confirmRetakeAll(): void {
    confirmRetakeAllModal?.close();
    stopCamera();
    beginCapture();
  }

  function handleContinue(): void {
    goTo('editor');
  }

  function openZoomModal(url: string): void {
    selectedPhotoUrl = url;
    const modal = document.getElementById('zoom_modal') as HTMLDialogElement | null;
    modal?.showModal();
  }
</script>

<section class="review-screen screen-enter min-h-screen flex flex-col bg-base-100">
  <!-- Header -->
  <header class="review-header flex items-center justify-between p-4 border-b border-base-300 bg-base-100 sticky top-0 z-10">
    <button
      class="btn btn-ghost btn-sm gap-1"
      on:click={openConfirmRetakeAll}
      aria-label="Go back to camera and retake"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Back
    </button>
    <h1 class="review-title font-bold text-lg">Review Photos</h1>
    <div class="w-16 flex-shrink-0"></div>
  </header>

  <!-- Main Content -->
  <div class="review-content flex-1 p-4 md:p-6 overflow-y-auto">
    <p class="review-subtitle text-center text-sm text-base-content/70 mb-6">
      Happy with these? Continue to design your strip, or retake any photo.
    </p>

    <!-- Photo Grid -->
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
        <div class="photo-card flex flex-col gap-2" style="animation-delay: {i * 60}ms">
          <!-- Photo Container -->
          <div 
            class="photo-slot relative group rounded-xl overflow-hidden bg-base-300 border-2 border-base-300 hover:border-primary transition-colors cursor-pointer"
            style="aspect-ratio: {aspectRatios[i] || '4/3'};"
            on:click={() => photo && openZoomModal(photo)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && photo && openZoomModal(photo)}
          >
            {#if photo}
              <img 
                src={photo} 
                alt="Captured photo {i + 1}" 
                class="w-full h-full object-cover"
                on:load={(e) => handleImageLoad(i, e)} 
              />
              <!-- Hover Overlay Zoom Hint -->
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Click to Zoom
              </div>
            {:else}
              <div class="photo-empty w-full h-full flex items-center justify-center text-base-content/40 text-sm">
                <span>Photo {i + 1}</span>
              </div>
            {/if}
          </div>

          <!-- Label & Retake Action -->
          <div class="photo-label flex items-center justify-between">
            <span class="badge badge-neutral badge-sm font-mono">#{i + 1}</span>
            <button
              id="btn-retake-{i}"
              class="btn btn-error btn-xs gap-1"
              on:click={() => handleRetakeOne(i)}
              aria-label="Retake photo {i + 1}"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

  <!-- Bottom Action Bar -->
  <div class="review-actions flex gap-3 p-4 border-t border-base-300 bg-base-100 sticky bottom-0 z-10">
    <button
      id="btn-retake-all"
      class="btn btn-outline btn-error flex-none"
      on:click={openConfirmRetakeAll}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"/>
        <path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Retake All
    </button>

    <button
      id="btn-continue-to-editor"
      class="btn btn-primary flex-1"
      on:click={handleContinue}
    >
      Design Strip
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  </div>
</section>

<!-- DaisyUI Modal: Preview Zoom -->
<dialog id="zoom_modal" class="modal">
  <div class="modal-box p-2 max-w-2xl bg-base-100">
    {#if selectedPhotoUrl}
      <img src={selectedPhotoUrl} alt="Zoomed preview" class="w-full h-auto rounded-lg object-contain" />
    {/if}
    <div class="modal-action p-2">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
    </div>
  </div>
</dialog>

<!-- DaisyUI Modal: Confirm Retake All -->
<dialog bind:this={confirmRetakeAllModal} class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Retake All Photos?</h3>
    <p class="py-4 text-sm text-base-content/70">
      This will clear all current photos and restart the capture session. Are you sure?
    </p>
    <div class="modal-action">
      <form method="dialog" class="flex gap-2">
        <button class="btn btn-ghost">Cancel</button>
        <button class="btn btn-error" on:click={confirmRetakeAll}>Yes, Retake All</button>
      </form>
    </div>
  </div>
</dialog>

<style>
  /* Layout Grid Responsif untuk Foto */
  .photo-grid {
    display: grid;
    gap: 1rem;
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
  }

  .grid-1 { grid-template-columns: 1fr; max-width: 280px; }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-5 { grid-template-columns: repeat(3, 1fr); }
  .grid-6 { grid-template-columns: repeat(3, 1fr); }

  @media (min-width: 640px) {
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-5 { grid-template-columns: repeat(5, 1fr); }
    .grid-6 { grid-template-columns: repeat(6, 1fr); }
    .grid-1 { max-width: 320px; }
  }

  .photo-card {
    animation: thumbAppear 0.3s ease both;
  }

  @keyframes thumbAppear {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
<script lang="ts">
  import { session, goTo, setRetakeIndex, beginCapture } from '#lib/stores/session';
  import { stopCamera } from '#lib/services/camera';
  import PhotoCard from '#lib/features/review/PhotoCard.svelte';
  import ZoomModal from '#lib/features/review/ZoomModal.svelte';
  import ConfirmRetakeModal from '#lib/features/review/ConfirmRetakeModal.svelte';

  $: photos = $session.photos;
  $: photoCount = $session.photoCount;

  let zoomModal: ZoomModal;
  let confirmModal: ConfirmRetakeModal;

  function retakeOne(index: number): void {
    setRetakeIndex(index);
    goTo('camera');
  }

  function retakeAll(): void {
    stopCamera();
    beginCapture();
  }

  function continueToEditor(): void {
    goTo('editor');
  }
</script>

<section
  class="review-screen screen-enter kiosk-scope"
  class:theme-light={$session.theme === 'light'}
  aria-label="Review foto"
>
  <header class="review-head">
    <button type="button" class="back-btn font-mono" on:click={() => confirmModal.open()} aria-label="Kembali ke kamera dan ambil ulang">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Kembali
    </button>
    <h1 class="review-title font-display">Review Foto</h1>
    <span class="counter font-mono" aria-label="{photos.length} dari {photoCount} foto">
      {photos.length} / {photoCount}
    </span>
  </header>

  <div class="review-body">
    <p class="review-note">
      Suka dengan hasilnya? Lanjut atur strip, atau ambil ulang foto yang kurang pas.
    </p>

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
        <PhotoCard
          {photo}
          index={i}
          on:zoom={() => zoomModal.open(photo)}
          on:retake={() => retakeOne(i)}
        />
      {/each}
    </div>
  </div>

  <footer class="review-actions">
    <button type="button" class="ghost-cta font-mono" on:click={() => confirmModal.open()}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 4v6h6" />
        <path d="M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
      Ambil Ulang Semua
    </button>

    <button type="button" class="capsule-cta font-mono" on:click={continueToEditor}>
      Desain Strip
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </footer>
</section>

<ZoomModal bind:this={zoomModal} />
<ConfirmRetakeModal bind:this={confirmModal} on:confirm={retakeAll} />

<style>
  @import "./_ReviewScreen.css";
</style>

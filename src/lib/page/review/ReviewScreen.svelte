<script lang="ts">
  import { session, goTo, setRetakeIndex, beginCapture } from '#lib/stores/session';
  import { stopCamera } from '#lib/services/camera';

  $: photos = $session.photos;
  $: photoCount = $session.photoCount;

  // Menyimpan rasio aspek gambar yang dideteksi per indeks agar layout pas (default '4/3' atau 'square')
  let aspectRatios: Record<number, string> = {};
  let selectedPhotoUrl: string | null = null;
  let confirmRetakeAllModal: HTMLDialogElement | undefined;
  let zoomOpenerEl: HTMLElement | null = null;

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
    // Simpan elemen pemicu agar fokus kembali setelah dialog tertutup (R-32)
    zoomOpenerEl = document.activeElement as HTMLElement | null;
    modal?.showModal();
  }

  function restoreZoomFocus(): void {
    zoomOpenerEl?.focus();
    zoomOpenerEl = null;
  }
</script>

<section class="review-screen min-h-screen flex flex-col bg-base-100">
  <!-- Header -->
  <header class="review-header flex items-center justify-between p-4 border-b border-base-300 bg-base-100 sticky top-0 z-10">
    <button
      class="btn btn-ghost btn-sm gap-1 min-h-[44px]! text-base-content/80"
      on:click={openConfirmRetakeAll}
      aria-label="Kembali ke kamera dan ambil ulang"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Kembali
    </button>
    <h1 class="review-title font-bold text-lg text-base-content">Review Foto</h1>
    <div class="w-16 flex-shrink-0"></div>
  </header>

  <!-- Konten Utama -->
  <div class="review-content flex-1 p-4 md:p-6 overflow-y-auto">
    <p class="review-subtitle text-center text-sm text-base-content/70 mb-6">
      Suka dengan foto-foto ini? Lanjutkan untuk membuat strip foto kamu, atau ambil ulang (retake) foto yang kurang pas.
    </p>

    <!-- Photo Grid Responsif Berdasarkan Jumlah Foto (1 sampai Maksimal 6) -->
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
          <!-- Frame Foto -->
          <div
            class="photo-slot relative group rounded-xl overflow-hidden bg-base-300 border-2 border-base-300 hover:border-primary transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            style="aspect-ratio: {aspectRatios[i] || '4/3'};"
            on:click={() => photo && openZoomModal(photo)}
            role="button"
            tabindex="0"
            aria-label="Perbesar foto {i + 1}"
            on:keydown={(e) => e.key === 'Enter' && photo && openZoomModal(photo)}
          >
            {#if photo}
              <img
                src={photo}
                alt="Foto hasil {i + 1}"
                class="w-full h-full object-cover"
                on:load={(e) => handleImageLoad(i, e)}
              />
              <!-- overlay hover zoom hint -->
              <div class="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Ketuk untuk perbesar
              </div>
            {:else}
              <div class="photo-empty w-full h-full flex items-center justify-center text-base-content/40 text-sm">
                <span>Photo {i + 1}</span>
              </div>
            {/if}
          </div>

          <!-- Indikator Angka & Tombol Retake -->
          <div class="photo-label flex items-center justify-between px-1">
            <span class="badge badge-neutral badge-sm font-mono">#{i + 1}</span>
            <button
              id="btn-retake-{i}"
              class="btn btn-error btn-xs gap-1 min-h-[44px]! min-w-[44px]!"
              on:click={() => handleRetakeOne(i)}
              aria-label="Ambil ulang foto {i + 1}"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 .49-5.5"/>
              </svg>
              Ambil Ulang
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Baris Tombol Aksi Bawah -->
  <div class="review-actions flex gap-3 p-4 border-t border-base-300 bg-base-100 sticky bottom-0 z-10 justify-center">
    <button
      id="btn-retake-all"
      class="btn btn-outline btn-error px-4 flex-none min-h-[44px]!"
      on:click={openConfirmRetakeAll}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"/>
        <path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Ambil Ulang Semua
    </button>

    <button
      id="btn-continue-to-editor"
      class="btn btn-primary flex-1 max-w-sm min-h-[44px]!"
      on:click={handleContinue}
    >
      Desain Strip
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  </div>
</section>

<!-- DaisyUI Modal: Preview Zoom -->
<dialog id="zoom_modal" class="modal" aria-label="Perbesar foto" on:close={restoreZoomFocus}>
  <div class="modal-box p-2 max-w-xl bg-base-100">
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

<!-- DaisyUI Modal: Konfirmasi Ambil Ulang Semua -->
<dialog bind:this={confirmRetakeAllModal} class="modal modal-bottom sm:modal-middle" aria-labelledby="retake-all-title">
  <div class="modal-box">
    <h3 id="retake-all-title" class="font-bold text-lg">Ambil Ulang Semua Foto?</h3>
    <p class="py-4 text-sm text-base-content/70">
      Tindakan ini akan menghapus semua foto yang telah diambil dan memulai sesi pengambilan foto yang baru dari awal. Apakah kamu yakin?
    </p>
    <div class="modal-action flex gap-2">
      <form method="dialog" class="flex gap-2 w-full justify-end">
        <button class="btn btn-ghost">Batal</button>
        <button class="btn btn-error" on:click={confirmRetakeAll}>Ya, Ambil Ulang Semua</button>
      </form>
    </div>
  </div>
</dialog>

<style>
  /* Layout Grid Responsif Menyesuaikan Jumlah Foto 1-6 (Maksimal 6x3 layout) */
  .photo-grid {
    display: grid;
    gap: 1rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  /* 1 Foto: Tengah besar */
  .grid-1 {
    grid-template-columns: 1fr;
    max-width: 320px;
  }

  /* 2 Foto: 2 Kolom */
  .grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 640px;
  }

  /* 3 Foto: 3 Kolom */
  .grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  /* 4 Foto: 2 Baris, 2 Kolom (2x2) */
  .grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 580px;
  }

  /* 5 Foto: 3 Kolom responsif (Svelte auto wrapper/flex can be alternative, here 2 baris 3-kolom) */
  .grid-5 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* 6 Foto: 3 Kolom x 2 Baris (Tepat pada sasaran maksimal) */
  .grid-6 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 640px) {
    .grid-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      max-width: 860px;
    }
    .grid-5 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .grid-6 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  /* Animasi micro-interaction foto muncul */
  .photo-card {
    animation: thumbAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes thumbAppear {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .photo-card {
      animation: none;
    }
  }
</style>
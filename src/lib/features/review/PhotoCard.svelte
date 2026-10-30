<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let photo: string | null = null;
  export let index = 0;

  const dispatch = createEventDispatcher<{ zoom: void; retake: void }>();

  // Rasio aspek asli foto agar slot pas — tidak ada objek yang ke-gugur
  let ratio = '4 / 3';

  function handleImgLoad(e: Event): void {
    const target = e.target as HTMLImageElement | null;
    if (target?.naturalWidth && target?.naturalHeight) {
      ratio = `${target.naturalWidth} / ${target.naturalHeight}`;
    }
  }

  function handleKey(e: KeyboardEvent): void {
    if (!photo) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatch('zoom');
    }
  }
</script>

<article class="photo-card">
  <div
    class="photo-slot"
    style="aspect-ratio: {ratio};"
    role="button"
    tabindex="0"
    aria-label="Perbesar foto {index + 1}"
    on:click={() => photo && dispatch('zoom')}
    on:keydown={handleKey}
  >
    {#if photo}
      <img src={photo} alt="Foto hasil {index + 1}" on:load={handleImgLoad} />
      <span class="zoom-hint font-mono" aria-hidden="true">Perbesar</span>
    {:else}
      <span class="slot-empty font-mono">Foto {index + 1}</span>
    {/if}
  </div>

  <footer class="photo-meta">
    <span class="num font-mono">#{index + 1}</span>
    <button
      type="button"
      class="retake-btn font-mono"
      on:click={() => dispatch('retake')}
      aria-label="Ambil ulang foto {index + 1}"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 .49-5.5" />
      </svg>
      Ambil Ulang
    </button>
  </footer>
</article>

<style>
  .photo-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: thumbAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Bingkai cetakan: foto di atas kertas, garis rambut sebagai tepi */
  .photo-slot {
    position: relative;
    width: 100%;
    border: 1px solid var(--hairline);
    border-radius: 12px;
    overflow: hidden;
    background: var(--veil-edge);
    cursor: pointer;
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 160ms ease;
  }

  .photo-slot:hover {
    border-color: var(--fg-dim);
    box-shadow: var(--card-shadow);
    transform: translateY(-2px);
  }

  .photo-slot:active {
    transform: translateY(0) scale(0.99);
  }

  .photo-slot:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  .photo-slot img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .zoom-hint {
    position: absolute;
    inset: auto 0 0 0;
    padding: 22px 10px 8px;
    text-align: center;
    font-size: 0.62rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--fg);
    background: linear-gradient(to top, rgba(11, 10, 9, 0.55), rgba(11, 10, 9, 0));
    opacity: 0;
    transition: opacity 200ms ease;
  }

  .photo-slot:hover .zoom-hint,
  .photo-slot:focus-visible .zoom-hint {
    opacity: 1;
  }

  .slot-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: var(--fg-dim);
  }

  .photo-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 2px;
  }

  .num {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    color: var(--fg-dim);
  }

  /* Target sentuh minimum 44px (kios layar sentuh) */
  .retake-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--radius-full, 999px);
    background: transparent;
    color: var(--fg-dim);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease, transform 120ms ease;
  }

  .retake-btn:hover {
    color: var(--fg);
    border-color: var(--hairline);
  }

  .retake-btn:active {
    transform: scale(0.96);
  }

  .retake-btn:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  .retake-btn svg {
    flex-shrink: 0;
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
    .photo-slot,
    .retake-btn {
      transition: none;
    }
  }
</style>

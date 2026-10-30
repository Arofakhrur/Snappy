<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let photo: string | null = null;
  export let index = 0;

  const dispatch = createEventDispatcher<{ zoom: void }>();

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
  {:else}
    <span class="slot-empty font-mono">Foto {index + 1}</span>
  {/if}
</div>

<style>
  /* Kartu polos seperti referensi: foto penuh sel, sudut halus, tanpa hiasan */
  .photo-slot {
    position: relative;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: var(--veil-edge);
    cursor: pointer;
    transition: opacity 160ms ease;
  }

  .photo-slot:hover {
    opacity: 0.92;
  }

  .photo-slot:active {
    opacity: 0.85;
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

  .slot-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: var(--fg-dim);
  }

  @media (prefers-reduced-motion: reduce) {
    .photo-slot {
      transition: none;
    }
  }
</style>

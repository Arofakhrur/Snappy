<script lang="ts">
  /**
   * ThemePicker — kartu pilihan tema kamera yang melayang di bawah top bar.
   * Grid 2x2 berisi 4 tema dengan pratinjau mini bergaya CSS; ceklis tanda
   * tema aktif. Tutup dengan Escape, tap latar, atau memilih tema (yang
   * sekaligus menyimpan pilihan). Pemanggil mengembalikan fokus ke tombol
   * pembuka (R-32).
   */
  import { onMount } from 'svelte';
  import type { CameraTheme } from '#lib/types';

  export let activeTheme: CameraTheme;
  export let onSelect: (theme: CameraTheme) => void;
  export let onClose: () => void;

  interface ThemeOption {
    id: CameraTheme;
    label: string;
    desc: string;
  }

  const options: ThemeOption[] = [
    { id: 'clean', label: 'Clean', desc: 'Full frame tanpa hiasan' },
    { id: 'croc', label: 'Croc', desc: 'Rahang buaya menjepit' },
    { id: 'polaroid', label: 'Polaroid', desc: 'Bingkai putih bawah' },
    { id: 'film', label: 'Film', desc: 'Lubang celluloid samping' },
  ];

  let panelEl: HTMLDivElement | undefined;

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose();
  }

  // Fokus langsung ke panel agar tombol Tab berikutnya mulai dari sini
  onMount(() => {
    panelEl?.focus();
  });
</script>

<svelte:window on:keydown={onKeydown} />

<button
  class="picker-backdrop"
  on:click={onClose}
  aria-label="Tutup pemilih tema"
  tabindex="-1"
></button>

<div class="picker-panel" role="dialog" aria-label="Tema kamera" tabindex="-1" bind:this={panelEl}>
  <p class="picker-title">Tema Kamera</p>

  <div class="picker-grid">
    {#each options as option (option.id)}
      <button
        class="picker-item"
        class:active={option.id === activeTheme}
        on:click={() => onSelect(option.id)}
        aria-pressed={option.id === activeTheme}
      >
        <span class="mini mini-{option.id}" aria-hidden="true"></span>
        <span class="pick-name">{option.label}</span>
        <span class="pick-desc">{option.desc}</span>
        {#if option.id === activeTheme}
          <svg class="pick-check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
              d="M4 10.5 8 14.5 16 6"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(5, 8, 10, 0.3);
    border: none;
    padding: 0;
    cursor: default;
  }

  .picker-panel {
    position: fixed;
    top: 64px;
    right: 14px;
    z-index: 45;
    min-width: 252px;
    padding: 12px;
    background: #10161b;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55);
  }

  .picker-panel:focus {
    outline: none; /* fokus programatik; outline interaksi tetap lewat focus-visible */
  }

  .picker-panel:focus-visible {
    outline: 2px solid #fcd34d;
    outline-offset: 2px;
  }

  .picker-title {
    margin: 2px 4px 10px;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .picker-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .picker-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    min-height: 44px;
    padding: 9px 10px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: 10px;
    color: #f8fafc;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .picker-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .picker-item:focus-visible {
    outline: 2px solid #fcd34d;
    outline-offset: 1px;
  }

  .picker-item.active {
    border-color: #fcd34d;
    background: rgba(252, 211, 77, 0.1);
  }

  .pick-check {
    position: absolute;
    top: 8px;
    right: 8px;
    color: #fcd34d;
  }

  .pick-name {
    font-size: 0.82rem;
    font-weight: 650;
    line-height: 1.1;
  }

  .pick-desc {
    font-size: 0.6rem;
    letter-spacing: 0.02em;
    color: #94a3b8;
  }

  /* Mini preview: jendela 52x34 yang menggambar perlakuan viewport tiap tema */
  .mini {
    position: relative;
    width: 52px;
    height: 34px;
    margin-bottom: 3px;
    background: #05080a;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 5px;
    overflow: hidden;
  }

  .mini-clean::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    box-sizing: border-box;
  }

  .mini-croc::before,
  .mini-croc::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    background: #2e5823;
  }

  .mini-croc::before {
    top: 0;
    height: 26%;
    border-radius: 4px 4px 0 0;
  }

  .mini-croc::after {
    bottom: 0;
    height: 22%;
    border-radius: 0 0 4px 4px;
  }

  .mini-polaroid::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 32%;
    background: #fbf7f0;
  }

  .mini-film::before,
  .mini-film::after {
    content: '';
    position: absolute;
    top: 6%;
    bottom: 6%;
    width: 6px;
    background-image: radial-gradient(circle, rgba(244, 241, 236, 0.9) 1.4px, transparent 2px);
    background-size: 100% 8px;
  }

  .mini-film::before {
    left: 3px;
  }

  .mini-film::after {
    right: 3px;
  }

  @media (max-width: 480px) {
    .picker-panel {
      right: 10px;
      left: 10px;
      min-width: 0;
    }
  }
</style>

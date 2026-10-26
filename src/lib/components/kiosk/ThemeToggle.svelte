<script lang="ts">
  /**
   * Sulih tema kios: bulat kecil di pojok kanan atas. Konfigurasi operator,
   * bukan bagian alur pengunjung; nilainya tetap hidup lewat localStorage
   * (disimpan oleh setTheme di session store).
   */
  import { session, setTheme } from '#lib/stores/session';

  $: theme = $session.theme;

  function toggleTheme(): void {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }
</script>

<button
  type="button"
  class="theme-toggle"
  on:click={toggleTheme}
  aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
  title="Ganti tema"
>
  {#if theme === 'dark'}
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.2 13.6A8.4 8.4 0 0 1 10.4 3.8a8.4 8.4 0 1 0 9.8 9.8z" />
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 3;
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border: 1px solid var(--hairline);
    border-radius: 50%;
    background: transparent;
    color: var(--fg-dim);
    cursor: pointer;
    outline: none;
    transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .theme-toggle:hover {
    color: var(--fg);
    border-color: var(--fg);
  }

  .theme-toggle:active {
    transform: scale(0.94);
  }

  .theme-toggle:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-toggle {
      transition: none;
    }
  }
</style>
